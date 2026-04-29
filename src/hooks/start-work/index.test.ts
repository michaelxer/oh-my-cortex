/// <reference types="bun-types" />

import { describe, expect, test, beforeEach, afterEach, spyOn } from "bun:test"
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { randomUUID } from "node:crypto"
import { createStartWorkHook } from "./index"
import { buildStartWorkContextInfo } from "./context-info-builder"
import { createLeadHook } from "../lead"
import {
  writeWorkStateState,
  clearWorkStateState,
  readWorkStateState,
} from "../../features/work-state"
import type { WorkStateState } from "../../features/work-state"
import * as sessionState from "../../features/claude-code-session-state"
import * as worktreeDetector from "./worktree-detector"

describe("start-work hook", () => {
  let testDir: string
  let chiefDir: string

  function createMockPluginInput() {
    return {
      directory: testDir,
      client: {},
    } as Parameters<typeof createStartWorkHook>[0]
  }

  function createStartWorkPrompt(options?: {
    sessionContext?: string
    userRequest?: string
  }): string {
    const sessionContext = options?.sessionContext ?? ""
    const userRequest = options?.userRequest ?? ""

    return `<command-instruction>
You are starting a Chief work session.
</command-instruction>

<session-context>${sessionContext}</session-context>${userRequest ? `

<user-request>${userRequest}</user-request>` : ""}`
  }

  beforeEach(() => {
    sessionState._resetForTesting()
    sessionState.registerAgentName("lead")
    sessionState.registerAgentName("chief")
    testDir = join(tmpdir(), `start-work-test-${randomUUID()}`)
    chiefDir = join(testDir, ".cortex")
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true })
    }
    if (!existsSync(chiefDir)) {
      mkdirSync(chiefDir, { recursive: true })
    }
    clearWorkStateState(testDir)
  })

  afterEach(() => {
    sessionState._resetForTesting()
    clearWorkStateState(testDir)
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
  })

  describe("chat.message handler", () => {
    test("should not include /plan literal in missing-plan guidance", () => {
      // given
      const contextInfo = buildStartWorkContextInfo({
        ctx: createMockPluginInput(),
        explicitPlanName: null,
        existingState: null,
        sessionId: "session-123",
        timestamp: "2026-04-12T00:00:00.000Z",
        activeAgent: "chief",
        worktreePath: undefined,
        worktreeBlock: "",
      })

      // when
      const containsLegacyPlanCommand = contextInfo.includes("/plan")

      // then
      expect(containsLegacyPlanCommand).toBe(false)
      expect(contextInfo).toContain("Planner")
    })

    test("should ignore non-start-work commands", async () => {
      // given - hook and non-start-work message
      const hook = createStartWorkHook(createMockPluginInput())
      const output = {
        parts: [{ type: "text", text: "Just a regular message" }],
      }

      // when
      await hook["chat.message"](
        { sessionID: "session-123" },
        output
      )

      // then - output should be unchanged
      expect(output.parts[0].text).toBe("Just a regular message")
    })

    test("should ignore plain session-context blocks without the start-work marker", async () => {
      // given
      const hook = createStartWorkHook(createMockPluginInput())
      const output = {
        parts: [{ type: "text", text: "<session-context>Some context here</session-context>" }],
      }

      // when
      await hook["chat.message"](
        { sessionID: "session-123" },
        output
      )

      // then
      expect(output.parts[0].text).toBe("<session-context>Some context here</session-context>")
      expect(readWorkStateState(testDir)).toBeNull()
    })

    test("should detect start-work command via session-context tag", async () => {
      // given - hook and start-work message
      const hook = createStartWorkHook(createMockPluginInput())
      const output = {
        parts: [
          {
            type: "text",
            text: createStartWorkPrompt({ sessionContext: "Some context here" }),
          },
        ],
      }

      // when
      await hook["chat.message"](
        { sessionID: "session-123" },
        output
      )

      // then - output should be modified with context info
      expect(output.parts[0].text).toContain("---")
    })

    test("should inject resume info when existing workstate state found", async () => {
      // given - existing workstate state with incomplete plan
      const planPath = join(testDir, "test-plan.md")
      writeFileSync(planPath, "# Plan\n- [ ] Task 1\n- [x] Task 2")

      const state: WorkStateState = {
        active_plan: planPath,
        started_at: "2026-01-02T10:00:00Z",
        session_ids: ["session-1"],
        plan_name: "test-plan",
      }
      writeWorkStateState(testDir, state)

      const hook = createStartWorkHook(createMockPluginInput())
      const output = {
        parts: [{ type: "text", text: createStartWorkPrompt() }],
      }

      // when
      await hook["chat.message"](
        { sessionID: "session-123" },
        output
      )

      // then - should show resuming status
      expect(output.parts[0].text).toContain("RESUMING")
      expect(output.parts[0].text).toContain("test-plan")
    })

    test("should replace $SESSION_ID placeholder", async () => {
      // given - hook and message with placeholder
      const hook = createStartWorkHook(createMockPluginInput())
      const output = {
        parts: [
          {
            type: "text",
            text: createStartWorkPrompt({ sessionContext: "Session: $SESSION_ID" }),
          },
        ],
      }

      // when
      await hook["chat.message"](
        { sessionID: "ses-abc123" },
        output
      )

      // then - placeholder should be replaced
      expect(output.parts[0].text).toContain("ses-abc123")
      expect(output.parts[0].text).not.toContain("$SESSION_ID")
    })

    test("should replace $TIMESTAMP placeholder", async () => {
      // given - hook and message with placeholder
      const hook = createStartWorkHook(createMockPluginInput())
      const output = {
        parts: [
          {
            type: "text",
            text: createStartWorkPrompt({ sessionContext: "Time: $TIMESTAMP" }),
          },
        ],
      }

      // when
      await hook["chat.message"](
        { sessionID: "session-123" },
        output
      )

      // then - placeholder should be replaced with ISO timestamp
      expect(output.parts[0].text).not.toContain("$TIMESTAMP")
      expect(output.parts[0].text).toMatch(/\d{4}-\d{2}-\d{2}T/)
    })

    test("should auto-select when only one incomplete plan among multiple plans", async () => {
      // given - multiple plans but only one incomplete
      const plansDir = join(testDir, ".cortex", "plans")
      mkdirSync(plansDir, { recursive: true })

      // Plan 1: complete (all checked)
      const plan1Path = join(plansDir, "plan-complete.md")
      writeFileSync(plan1Path, "# Plan Complete\n- [x] Task 1\n- [x] Task 2")

      // Plan 2: incomplete (has unchecked)
      const plan2Path = join(plansDir, "plan-incomplete.md")
      writeFileSync(plan2Path, "# Plan Incomplete\n- [ ] Task 1\n- [x] Task 2")

      const hook = createStartWorkHook(createMockPluginInput())
      const output = {
        parts: [{ type: "text", text: createStartWorkPrompt() }],
      }

      // when
      await hook["chat.message"](
        { sessionID: "session-123" },
        output
      )

      // then - should auto-select the incomplete plan, not ask user
      expect(output.parts[0].text).toContain("Auto-Selected Plan")
      expect(output.parts[0].text).toContain("plan-incomplete")
      expect(output.parts[0].text).not.toContain("Multiple Plans Found")
    })

    test("should wrap multiple plans message in system-reminder tag", async () => {
      // given - multiple incomplete plans
      const plansDir = join(testDir, ".cortex", "plans")
      mkdirSync(plansDir, { recursive: true })

      const plan1Path = join(plansDir, "plan-a.md")
      writeFileSync(plan1Path, "# Plan A\n- [ ] Task 1")

      const plan2Path = join(plansDir, "plan-b.md")
      writeFileSync(plan2Path, "# Plan B\n- [ ] Task 2")

      const hook = createStartWorkHook(createMockPluginInput())
      const output = {
        parts: [{ type: "text", text: createStartWorkPrompt() }],
      }

      // when
      await hook["chat.message"](
        { sessionID: "session-123" },
        output
      )

      // then - should use system-reminder tag format
      expect(output.parts[0].text).toContain("<system-reminder>")
      expect(output.parts[0].text).toContain("</system-reminder>")
      expect(output.parts[0].text).toContain("Multiple Plans Found")
    })

    test("should use 'ask user' prompt style for multiple plans", async () => {
      // given - multiple incomplete plans
      const plansDir = join(testDir, ".cortex", "plans")
      mkdirSync(plansDir, { recursive: true })

      const plan1Path = join(plansDir, "plan-x.md")
      writeFileSync(plan1Path, "# Plan X\n- [ ] Task 1")

      const plan2Path = join(plansDir, "plan-y.md")
      writeFileSync(plan2Path, "# Plan Y\n- [ ] Task 2")

      const hook = createStartWorkHook(createMockPluginInput())
      const output = {
        parts: [{ type: "text", text: createStartWorkPrompt() }],
      }

      // when
      await hook["chat.message"](
        { sessionID: "session-123" },
        output
      )

      // then - should prompt agent to ask user, not ask directly
      expect(output.parts[0].text).toContain("Ask the user")
      expect(output.parts[0].text).not.toContain("Which plan would you like to work on?")
    })

    test("should select explicitly specified plan name from user-request, ignoring existing workstate state", async () => {
      // given - existing workstate state pointing to old plan
      const plansDir = join(testDir, ".cortex", "plans")
      mkdirSync(plansDir, { recursive: true })

      // Old plan (in workstate state)
      const oldPlanPath = join(plansDir, "old-plan.md")
      writeFileSync(oldPlanPath, "# Old Plan\n- [ ] Old Task 1")

      // New plan (user wants this one)
      const newPlanPath = join(plansDir, "new-plan.md")
      writeFileSync(newPlanPath, "# New Plan\n- [ ] New Task 1")

      // Set up stale workstate state pointing to old plan
      const staleState: WorkStateState = {
        active_plan: oldPlanPath,
        started_at: "2026-01-01T10:00:00Z",
        session_ids: ["old-session"],
        plan_name: "old-plan",
      }
      writeWorkStateState(testDir, staleState)

      const hook = createStartWorkHook(createMockPluginInput())
      const output = {
        parts: [
          {
            type: "text",
            text: createStartWorkPrompt({ userRequest: "new-plan" }),
          },
        ],
      }

      // when - user explicitly specifies new-plan
      await hook["chat.message"](
        { sessionID: "session-123" },
        output
      )

      // then - should select new-plan, NOT resume old-plan
      expect(output.parts[0].text).toContain("new-plan")
      expect(output.parts[0].text).not.toContain("RESUMING")
      expect(output.parts[0].text).not.toContain("old-plan")
    })

    test("should strip deepwork/dw keywords from plan name argument", async () => {
      // given - plan with deepwork keyword in user-request
      const plansDir = join(testDir, ".cortex", "plans")
      mkdirSync(plansDir, { recursive: true })

      const planPath = join(plansDir, "my-feature-plan.md")
      writeFileSync(planPath, "# My Feature Plan\n- [ ] Task 1")

      const hook = createStartWorkHook(createMockPluginInput())
      const output = {
        parts: [
          {
            type: "text",
            text: createStartWorkPrompt({ userRequest: "my-feature-plan deepwork" }),
          },
        ],
      }

      // when - user specifies plan with deepwork keyword
      await hook["chat.message"](
        { sessionID: "session-123" },
        output
      )

      // then - should find plan without deepwork suffix
      expect(output.parts[0].text).toContain("my-feature-plan")
      expect(output.parts[0].text).toContain("Auto-Selected Plan")
    })

    test("should strip dw keyword from plan name argument", async () => {
      // given - plan with dw keyword in user-request
      const plansDir = join(testDir, ".cortex", "plans")
      mkdirSync(plansDir, { recursive: true })

      const planPath = join(plansDir, "api-refactor.md")
      writeFileSync(planPath, "# API Refactor\n- [ ] Task 1")

      const hook = createStartWorkHook(createMockPluginInput())
      const output = {
        parts: [
          {
            type: "text",
            text: createStartWorkPrompt({ userRequest: "api-refactor dw" }),
          },
        ],
      }

      // when
      await hook["chat.message"](
        { sessionID: "session-123" },
        output
      )

      // then - should find plan without dw suffix
      expect(output.parts[0].text).toContain("api-refactor")
      expect(output.parts[0].text).toContain("Auto-Selected Plan")
    })

    test("should match plan by partial name", async () => {
      // given - user specifies partial plan name
      const plansDir = join(testDir, ".cortex", "plans")
      mkdirSync(plansDir, { recursive: true })

      const planPath = join(plansDir, "2026-01-15-feature-implementation.md")
      writeFileSync(planPath, "# Feature Implementation\n- [ ] Task 1")

      const hook = createStartWorkHook(createMockPluginInput())
      const output = {
        parts: [
          {
            type: "text",
            text: createStartWorkPrompt({ userRequest: "feature-implementation" }),
          },
        ],
      }

      // when
      await hook["chat.message"](
        { sessionID: "session-123" },
        output
      )

      // then - should find plan by partial match
      expect(output.parts[0].text).toContain("2026-01-15-feature-implementation")
      expect(output.parts[0].text).toContain("Auto-Selected Plan")
    })

    test("should match quoted human-readable plan names to slugged filenames", async () => {
      // given - saved plan uses a slugged filename
      const plansDir = join(testDir, ".cortex", "plans")
      mkdirSync(plansDir, { recursive: true })

      const planPath = join(plansDir, "my-feature-plan.md")
      writeFileSync(planPath, "# My Feature Plan\n- [ ] Task 1")

      const hook = createStartWorkHook(createMockPluginInput())
      const output = {
        parts: [
          {
            type: "text",
            text: createStartWorkPrompt({ userRequest: "\"my feature plan\"" }),
          },
        ],
      }

      // when
      await hook["chat.message"](
        { sessionID: "session-123" },
        output,
      )

      // then
      expect(output.parts[0].text).toContain("my-feature-plan")
      expect(output.parts[0].text).toContain("Auto-Selected Plan")
    })

    test("should match Korean plan names after Unicode-aware normalization", async () => {
      // given
      const plansDir = join(testDir, ".cortex", "plans")
      mkdirSync(plansDir, { recursive: true })

      const planPath = join(plansDir, "결제-플로우.md")
      writeFileSync(planPath, "# 결제 플로우\n- [ ] 작업 1")

      const hook = createStartWorkHook(createMockPluginInput())
      const output = {
        parts: [
          {
            type: "text",
            text: createStartWorkPrompt({ userRequest: "결제 플로우" }),
          },
        ],
      }

      // when
      await hook["chat.message"](
        { sessionID: "session-korean-plan" },
        output,
      )

      // then
      expect(output.parts[0].text).toContain("결제-플로우")
      expect(output.parts[0].text).toContain("Auto-Selected Plan")
    })

    test("should match Japanese plan names after Unicode-aware normalization", async () => {
      // given
      const plansDir = join(testDir, ".cortex", "plans")
      mkdirSync(plansDir, { recursive: true })

      const planPath = join(plansDir, "支払い-フロー.md")
      writeFileSync(planPath, "# 支払い フロー\n- [ ] タスク 1")

      const hook = createStartWorkHook(createMockPluginInput())
      const output = {
        parts: [
          {
            type: "text",
            text: createStartWorkPrompt({ userRequest: "支払い フロー" }),
          },
        ],
      }

      // when
      await hook["chat.message"](
        { sessionID: "session-japanese-plan" },
        output,
      )

      // then
      expect(output.parts[0].text).toContain("支払い-フロー")
      expect(output.parts[0].text).toContain("Auto-Selected Plan")
    })

    test("should keep ASCII plan name matching behavior unchanged", async () => {
      // given
      const plansDir = join(testDir, ".cortex", "plans")
      mkdirSync(plansDir, { recursive: true })

      const planPath = join(plansDir, "checkout-flow.md")
      writeFileSync(planPath, "# Checkout Flow\n- [ ] Task 1")

      const hook = createStartWorkHook(createMockPluginInput())
      const output = {
        parts: [
          {
            type: "text",
            text: createStartWorkPrompt({ userRequest: "checkout flow" }),
          },
        ],
      }

      // when
      await hook["chat.message"](
        { sessionID: "session-ascii-plan" },
        output,
      )

      // then
      expect(output.parts[0].text).toContain("checkout-flow")
      expect(output.parts[0].text).toContain("Auto-Selected Plan")
    })

    test("should match mixed ASCII and non-ASCII plan names", async () => {
      // given
      const plansDir = join(testDir, ".cortex", "plans")
      mkdirSync(plansDir, { recursive: true })

      const planPath = join(plansDir, "v2-결제-flow.md")
      writeFileSync(planPath, "# v2 결제 flow\n- [ ] Task 1")

      const hook = createStartWorkHook(createMockPluginInput())
      const output = {
        parts: [
          {
            type: "text",
            text: createStartWorkPrompt({ userRequest: "v2 결제 flow" }),
          },
        ],
      }

      // when
      await hook["chat.message"](
        { sessionID: "session-mixed-plan" },
        output,
      )

      // then
      expect(output.parts[0].text).toContain("v2-결제-flow")
      expect(output.parts[0].text).toContain("Auto-Selected Plan")
    })
  })

  describe("session agent management", () => {
    test("should update session agent to Lead when start-work command is triggered", async () => {
      // given
      const updateSpy = spyOn(sessionState, "updateSessionAgent")
      
      const hook = createStartWorkHook(createMockPluginInput())
      const output = {
        parts: [{ type: "text", text: createStartWorkPrompt() }],
      }

      // when
      await hook["chat.message"](
        { sessionID: "ses-planner-to-chief" },
        output
      )

      // then
      expect(updateSpy).toHaveBeenCalledWith("ses-planner-to-chief", "lead")
      updateSpy.mockRestore()
    })

    test("should stamp the outgoing message with Lead config key so OpenCode can resolve the agent", async () => {
      // given
      const hook = createStartWorkHook(createMockPluginInput())
      const output = {
        message: {} as Record<string, unknown>,
        parts: [{ type: "text", text: createStartWorkPrompt() }],
      }

      // when
      await hook["chat.message"](
        { sessionID: "ses-planner-to-lead" },
        output
      )

      // then - config key, not display name (matches no-chief-gpt / workstate-continuation-injector convention)
      expect(output.message.agent).toBe("lead")
    })

    test("should switch to Lead even when current session is Chief (regression: #3155)", async () => {
      // given: user runs /start-work while in a Chief session
      // lead is registered, so /start-work must always hand off to lead
      sessionState.updateSessionAgent("ses-chief-to-lead", "chief")

      const hook = createStartWorkHook(createMockPluginInput())
      const output = {
        message: {} as Record<string, unknown>,
        parts: [{ type: "text", text: createStartWorkPrompt() }],
      }

      await hook["chat.message"](
        { sessionID: "ses-chief-to-lead" },
        output
      )

      // lead is registered in beforeEach, so it must be selected
      expect(output.message.agent).toBe("lead")
      expect(sessionState.getSessionAgent("ses-chief-to-lead")).toBe("lead")
    })

    test("should keep the current agent when Lead is unavailable", async () => {
      // given
      sessionState._resetForTesting()
      sessionState.registerAgentName("chief")
      sessionState.updateSessionAgent("ses-planner-to-chief", "chief")

      const hook = createStartWorkHook(createMockPluginInput())
      const output = {
        message: {} as Record<string, unknown>,
        parts: [{ type: "text", text: createStartWorkPrompt() }],
      }

      // when
      await hook["chat.message"](
        { sessionID: "ses-planner-to-chief" },
        output
      )

      // then
      expect(output.message.agent).toBe("chief")
      expect(sessionState.getSessionAgent("ses-planner-to-chief")).toBe("chief")
    })

    test("should fall back to Chief instead of keeping Planner when Lead is unavailable", async () => {
      // given
      sessionState._resetForTesting()
      sessionState.registerAgentName("planner")
      sessionState.registerAgentName("chief")
      sessionState.updateSessionAgent("ses-planner-to-worker", "planner")

      const plansDir = join(testDir, ".cortex", "plans")
      mkdirSync(plansDir, { recursive: true })
      writeFileSync(join(plansDir, "worker-plan.md"), "# Plan\n- [ ] Task 1")

      const hook = createStartWorkHook(createMockPluginInput())
      const output = {
        message: {} as Record<string, unknown>,
        parts: [{ type: "text", text: createStartWorkPrompt() }],
      }

      // when
      await hook["chat.message"](
        { sessionID: "ses-planner-to-worker" },
        output
      )

      // then
      expect(output.message.agent).toBe("chief")
      expect(sessionState.getSessionAgent("ses-planner-to-worker")).toBe("chief")
      expect(readWorkStateState(testDir)?.agent).toBe("chief")
    })

    test("should rewrite stale Planner workstate state to Chief when resuming without Lead", async () => {
      // given
      sessionState._resetForTesting()
      sessionState.registerAgentName("planner")
      sessionState.registerAgentName("chief")
      sessionState.updateSessionAgent("ses-planner-resume", "planner")

      const planPath = join(testDir, "resume-plan.md")
      writeFileSync(planPath, "# Plan\n- [ ] Task 1")
      writeWorkStateState(testDir, {
        active_plan: planPath,
        started_at: "2026-01-02T10:00:00Z",
        session_ids: ["old-session"],
        plan_name: "resume-plan",
        agent: "planner",
      })

      const hook = createStartWorkHook(createMockPluginInput())
      const output = {
        message: {} as Record<string, unknown>,
        parts: [{ type: "text", text: createStartWorkPrompt() }],
      }

      // when
      await hook["chat.message"](
        { sessionID: "ses-planner-resume" },
        output
      )

      // then
      expect(output.message.agent).toBe("chief")
      expect(readWorkStateState(testDir)?.agent).toBe("chief")
    })

    test("#given start-work hands the session to Lead #when Lead later receives session.idle #then the same session continues the selected plan", async () => {
      // given
      const plansDir = join(testDir, ".cortex", "plans")
      mkdirSync(plansDir, { recursive: true })
      writeFileSync(join(plansDir, "lead-plan.md"), "# Plan\n- [ ] Task 1\n- [ ] Task 2")

      const promptAsyncMock = spyOn({
        promptAsync: async (_request: unknown) => undefined,
      }, "promptAsync")
      const ctx = {
        directory: testDir,
        client: {
          session: {
            promptAsync: promptAsyncMock,
            prompt: async (_request: unknown) => undefined,
            messages: async () => ({ data: [] }),
          },
        },
      } as unknown as Parameters<typeof createLeadHook>[0]
      const startWorkHook = createStartWorkHook(ctx)
      const leadHook = createLeadHook(ctx)
      const output = {
        message: {} as Record<string, unknown>,
        parts: [{ type: "text", text: createStartWorkPrompt({ userRequest: "lead-plan" }) }],
      }

      // when
      await startWorkHook["chat.message"]({ sessionID: "session-123" }, output)
      await leadHook.handler({ event: { type: "session.idle", properties: { sessionID: "session-123" } } })

      // then
      expect(output.message.agent).toBe("lead")
      expect(readWorkStateState(testDir)?.session_ids).toContain("session-123")
      expect(readWorkStateState(testDir)?.agent).toBe("lead")
      expect(promptAsyncMock).toHaveBeenCalledTimes(1)
      promptAsyncMock.mockRestore()
    })

    test("#given start-work hands the session to Lead but background work is still running #when that work finishes #then Lead resumes via retry for the same session", async () => {
      // given
      const plansDir = join(testDir, ".cortex", "plans")
      mkdirSync(plansDir, { recursive: true })
      writeFileSync(join(plansDir, "lead-plan.md"), "# Plan\n- [ ] Task 1\n- [ ] Task 2")

      const capturedTimers = new Map<number, { callback: Function; cleared: boolean }>()
      let nextTimerId = 4000
      let backgroundRunning = true
      const originalSetTimeout = globalThis.setTimeout
      const originalClearTimeout = globalThis.clearTimeout
      const originalDateNow = Date.now
      let fakeNow = 10000
      const promptAsyncMock = spyOn({
        promptAsync: async (_request: unknown) => undefined,
      }, "promptAsync")

      globalThis.setTimeout = ((callback: Function, delay?: number, ...args: unknown[]) => {
        const normalized = typeof delay === "number" ? delay : 0
        if (normalized >= 5000) {
          const id = nextTimerId++
          capturedTimers.set(id, { callback: () => callback(...args), cleared: false })
          return id as unknown as ReturnType<typeof setTimeout>
        }

        return originalSetTimeout(callback as Parameters<typeof originalSetTimeout>[0], delay)
      }) as unknown as typeof setTimeout

      globalThis.clearTimeout = ((id?: number | ReturnType<typeof setTimeout>) => {
        if (typeof id === "number" && capturedTimers.has(id)) {
          capturedTimers.get(id)!.cleared = true
          capturedTimers.delete(id)
          return
        }

        originalClearTimeout(id as Parameters<typeof originalClearTimeout>[0])
      }) as unknown as typeof clearTimeout

      Date.now = () => fakeNow

      const ctx = {
        directory: testDir,
        client: {
          session: {
            promptAsync: promptAsyncMock,
            prompt: async (_request: unknown) => undefined,
            messages: async () => ({ data: [] }),
          },
        },
      } as unknown as Parameters<typeof createLeadHook>[0]
      const startWorkHook = createStartWorkHook(ctx)
      const leadHook = createLeadHook(ctx, {
        directory: testDir,
        backgroundManager: {
          getTasksByParentSession: () => backgroundRunning ? [{ status: "running" }] : [],
        } as unknown as NonNullable<Parameters<typeof createLeadHook>[1]>["backgroundManager"],
      })
      const output = {
        message: {} as Record<string, unknown>,
        parts: [{ type: "text", text: createStartWorkPrompt({ userRequest: "lead-plan" }) }],
      }

      async function firePendingTimers(): Promise<void> {
        for (const [id, entry] of capturedTimers) {
          if (!entry.cleared) {
            capturedTimers.delete(id)
            fakeNow += 6000
            await entry.callback()
          }
        }
      }

      try {
        // when
        await startWorkHook["chat.message"]({ sessionID: "session-123" }, output)
        await leadHook.handler({ event: { type: "session.idle", properties: { sessionID: "session-123" } } })
        expect(promptAsyncMock).toHaveBeenCalledTimes(0)
        expect(capturedTimers.size).toBe(1)

        backgroundRunning = false
        await firePendingTimers()

        // then
        expect(output.message.agent).toBe("lead")
        expect(readWorkStateState(testDir)?.session_ids).toContain("session-123")
        expect(readWorkStateState(testDir)?.agent).toBe("lead")
        expect(promptAsyncMock).toHaveBeenCalledTimes(1)
      } finally {
        globalThis.setTimeout = originalSetTimeout
        globalThis.clearTimeout = originalClearTimeout
        Date.now = originalDateNow
        promptAsyncMock.mockRestore()
      }
    })
  })

  describe("worktree support", () => {
    let detectSpy: ReturnType<typeof spyOn>

    beforeEach(() => {
      detectSpy = spyOn(worktreeDetector, "detectWorktreePath").mockReturnValue(null)
    })

    afterEach(() => {
      detectSpy.mockRestore()
    })

    test("should NOT inject worktree instructions when no --worktree flag", async () => {
      // given - single plan, no worktree flag
      const plansDir = join(testDir, ".cortex", "plans")
      mkdirSync(plansDir, { recursive: true })
      writeFileSync(join(plansDir, "my-plan.md"), "# Plan\n- [ ] Task 1")

      const hook = createStartWorkHook(createMockPluginInput())
      const output = {
        parts: [{ type: "text", text: createStartWorkPrompt() }],
      }

      // when
      await hook["chat.message"]({ sessionID: "session-123" }, output)

      // then - no worktree instructions should appear
      expect(output.parts[0].text).not.toContain("Worktree Setup Required")
      expect(output.parts[0].text).not.toContain("Worktree Active")
      expect(output.parts[0].text).not.toContain("git worktree list --porcelain")
    })

    test("should inject worktree path when --worktree flag is valid", async () => {
      // given - single plan + valid worktree path
      const plansDir = join(testDir, ".cortex", "plans")
      mkdirSync(plansDir, { recursive: true })
      writeFileSync(join(plansDir, "my-plan.md"), "# Plan\n- [ ] Task 1")
      detectSpy.mockReturnValue("/validated/worktree")

      const hook = createStartWorkHook(createMockPluginInput())
      const output = {
        parts: [{ type: "text", text: createStartWorkPrompt({ userRequest: "--worktree /validated/worktree" }) }],
      }

      // when
      await hook["chat.message"]({ sessionID: "session-123" }, output)

      // then - strong worktree active instructions shown
      expect(output.parts[0].text).toContain("Worktree Active")
      expect(output.parts[0].text).toContain("/validated/worktree")
      expect(output.parts[0].text).toContain("subagent")
      expect(output.parts[0].text).not.toContain("Worktree Setup Required")
    })

    test("should store worktree_path in workstate when --worktree is valid", async () => {
      // given - plan + valid worktree
      const plansDir = join(testDir, ".cortex", "plans")
      mkdirSync(plansDir, { recursive: true })
      writeFileSync(join(plansDir, "my-plan.md"), "# Plan\n- [ ] Task 1")
      detectSpy.mockReturnValue("/valid/wt")

      const hook = createStartWorkHook(createMockPluginInput())
      const output = {
        parts: [{ type: "text", text: createStartWorkPrompt({ userRequest: "--worktree /valid/wt" }) }],
      }

      // when
      await hook["chat.message"]({ sessionID: "session-123" }, output)

      // then - workstate.json has worktree_path
      const state = readWorkStateState(testDir)
      expect(state?.worktree_path).toBe("/valid/wt")
    })

    test("should NOT store worktree_path when --worktree path is invalid", async () => {
      // given - plan + invalid worktree path (detectWorktreePath returns null)
      const plansDir = join(testDir, ".cortex", "plans")
      mkdirSync(plansDir, { recursive: true })
      writeFileSync(join(plansDir, "my-plan.md"), "# Plan\n- [ ] Task 1")
      // detectSpy already returns null by default

      const hook = createStartWorkHook(createMockPluginInput())
      const output = {
        parts: [{ type: "text", text: createStartWorkPrompt({ userRequest: "--worktree /nonexistent/wt" }) }],
      }

      // when
      await hook["chat.message"]({ sessionID: "session-123" }, output)

      // then - worktree_path absent, setup instructions present
      const state = readWorkStateState(testDir)
      expect(state?.worktree_path).toBeUndefined()
      expect(output.parts[0].text).toContain("needs setup")
      expect(output.parts[0].text).toContain("git worktree add /nonexistent/wt")
    })

    test("should update workstate worktree_path on resume when new --worktree given", async () => {
      // given - existing workstate with old worktree, user provides new worktree
      const planPath = join(testDir, "plan.md")
      writeFileSync(planPath, "# Plan\n- [ ] Task 1")
      const existingState: WorkStateState = {
        active_plan: planPath,
        started_at: "2026-01-01T00:00:00Z",
        session_ids: ["old-session"],
        plan_name: "plan",
        worktree_path: "/old/wt",
      }
      writeWorkStateState(testDir, existingState)
      detectSpy.mockReturnValue("/new/wt")

      const hook = createStartWorkHook(createMockPluginInput())
      const output = {
        parts: [{ type: "text", text: createStartWorkPrompt({ userRequest: "--worktree /new/wt" }) }],
      }

      // when
      await hook["chat.message"]({ sessionID: "session-456" }, output)

      // then - workstate reflects updated worktree and new session appended
      const state = readWorkStateState(testDir)
      expect(state?.worktree_path).toBe("/new/wt")
      expect(state?.session_ids).toContain("session-456")
    })

    test("should show existing worktree on resume when no --worktree flag", async () => {
      // given - existing workstate already has worktree_path, no flag given
      const planPath = join(testDir, "plan.md")
      writeFileSync(planPath, "# Plan\n- [ ] Task 1")
      const existingState: WorkStateState = {
        active_plan: planPath,
        started_at: "2026-01-01T00:00:00Z",
        session_ids: ["old-session"],
        plan_name: "plan",
        worktree_path: "/existing/wt",
      }
      writeWorkStateState(testDir, existingState)

      const hook = createStartWorkHook(createMockPluginInput())
      const output = {
        parts: [{ type: "text", text: createStartWorkPrompt() }],
      }

      // when
      await hook["chat.message"]({ sessionID: "session-789" }, output)

      // then - shows strong worktree active instructions
      expect(output.parts[0].text).toContain("Worktree Active")
      expect(output.parts[0].text).toContain("/existing/wt")
      expect(output.parts[0].text).toContain("subagent")
      expect(output.parts[0].text).not.toContain("Worktree Setup Required")
    })
  })
})
