import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { mkdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { randomUUID } from "node:crypto"
import { createPluginInterface } from "./plugin-interface"
import { createAutoSlashCommandHook } from "./hooks/auto-slash-command"
import { createStartWorkHook } from "./hooks/start-work"
import { readWorkStateState } from "./features/work-state"
import {
  _resetForTesting,
  getSessionAgent,
  registerAgentName,
  updateSessionAgent,
} from "./features/claude-code-session-state"


describe("createPluginInterface - command.execute.before", () => {
  let testDir = ""

  beforeEach(() => {
    testDir = join(tmpdir(), `plugin-interface-start-work-${randomUUID()}`)
    mkdirSync(join(testDir, ".cortex", "plans"), { recursive: true })
    writeFileSync(join(testDir, ".cortex", "plans", "worker-plan.md"), "# Plan\n- [ ] Task 1")
    _resetForTesting()
    registerAgentName("planner")
    registerAgentName("chief")
  })

  afterEach(() => {
    _resetForTesting()
    rmSync(testDir, { recursive: true, force: true })
  })

  test("executes start-work side effects for native command execution", async () => {
    // given
    updateSessionAgent("ses-command-before", "planner")
    const pluginInterface = createPluginInterface({
      ctx: {
        directory: testDir,
        client: { tui: { showToast: async () => {} } },
      } as never,
      pluginConfig: {} as never,
      firstMessageVariantGate: {
        shouldOverride: () => false,
        markApplied: () => {},
        markSessionCreated: () => {},
        clear: () => {},
      },
      managers: {} as never,
      hooks: {
        autoSlashCommand: createAutoSlashCommandHook({ skills: [] }),
        startWork: createStartWorkHook({
          directory: testDir,
          client: { tui: { showToast: async () => {} } },
        } as never),
      } as never,
      tools: {},
    })
    const output = {
      parts: [{ type: "text", text: "original" }],
    }

    // when
    await pluginInterface["command.execute.before"]?.(
      {
        command: "start-work",
        sessionID: "ses-command-before",
        arguments: "",
      },
      output as never
    )

    // then
    expect(pluginInterface["command.execute.before"]).toBeDefined()
    expect(output.parts[0]?.text).toContain("Auto-Selected Plan")
    expect(output.parts[0]?.text).toContain("workstate.json has been created")
    expect(getSessionAgent("ses-command-before")).toBe("chief")
    expect(readWorkStateState(testDir)?.agent).toBe("chief")
  })

  test("does not run start-work side effects for other native commands with session context", async () => {
    // given
    updateSessionAgent("ses-handoff", "planner")
    const pluginInterface = createPluginInterface({
      ctx: {
        directory: testDir,
        client: { tui: { showToast: async () => {} } },
      } as never,
      pluginConfig: {} as never,
      firstMessageVariantGate: {
        shouldOverride: () => false,
        markApplied: () => {},
        markSessionCreated: () => {},
        clear: () => {},
      },
      managers: {} as never,
      hooks: {
        autoSlashCommand: createAutoSlashCommandHook({ skills: [] }),
        startWork: createStartWorkHook({
          directory: testDir,
          client: { tui: { showToast: async () => {} } },
        } as never),
      } as never,
      tools: {},
    })
    const output = {
      parts: [{ type: "text", text: "original" }],
    }

    // when
    await pluginInterface["command.execute.before"]?.(
      {
        command: "handoff",
        sessionID: "ses-handoff",
        arguments: "",
      },
      output as never
    )

    // then
    expect(output.parts[0]?.text).toContain("HANDOFF CONTEXT")
    expect(readWorkStateState(testDir)).toBeNull()
    expect(getSessionAgent("ses-handoff")).toBe("planner")
  })

  test("switches native start-work to Lead when Lead is registered in config", async () => {
    // given
    registerAgentName("lead")
    updateSessionAgent("ses-command-lead", "planner")
    const pluginInterface = createPluginInterface({
      ctx: {
        directory: testDir,
        client: { tui: { showToast: async () => {} } },
      } as never,
      pluginConfig: {} as never,
      firstMessageVariantGate: {
        shouldOverride: () => false,
        markApplied: () => {},
        markSessionCreated: () => {},
        clear: () => {},
      },
      managers: {} as never,
      hooks: {
        autoSlashCommand: createAutoSlashCommandHook({ skills: [] }),
        startWork: createStartWorkHook({
          directory: testDir,
          client: { tui: { showToast: async () => {} } },
        } as never),
      } as never,
      tools: {},
    })
    const output = {
      message: {} as Record<string, unknown>,
      parts: [{ type: "text", text: "/start-work" }],
    }

    // when
    await pluginInterface["chat.message"]?.(
      {
        sessionID: "ses-command-lead",
        agent: "planner",
      } as never,
      output as never
    )

    // then
    expect(output.message.agent).toBe("lead")
    expect(getSessionAgent("ses-command-lead")).toBe("lead")
    expect(readWorkStateState(testDir)?.agent).toBe("lead")
  })
})

describe("createPluginInterface - dw-loop native command smoke", () => {
  let testDir = ""

  beforeEach(() => {
    testDir = join(tmpdir(), `plugin-interface-dw-loop-${randomUUID()}`)
    mkdirSync(testDir, { recursive: true })
    _resetForTesting()
    registerAgentName("chief")
  })

  afterEach(() => {
    _resetForTesting()
    rmSync(testDir, { recursive: true, force: true })
  })

  test("starts the deepwork loop from the native command flow with parsed arguments intact", async () => {
    // given
    const startLoopCalls: Array<{
      sessionID: string
      prompt: string
      options: Record<string, unknown>
    }> = []
    const pluginInterface = createPluginInterface({
      ctx: {
        directory: testDir,
        client: { tui: { showToast: async () => {} } },
      } as never,
      pluginConfig: {} as never,
      firstMessageVariantGate: {
        shouldOverride: () => false,
        markApplied: () => {},
        markSessionCreated: () => {},
        clear: () => {},
      },
      managers: {} as never,
      hooks: {
        autoSlashCommand: createAutoSlashCommandHook({ skills: [] }),
        cortexLoop: {
          startLoop: (sessionID: string, prompt: string, options?: Record<string, unknown>) => {
            startLoopCalls.push({ sessionID, prompt, options: options ?? {} })
            return true
          },
          cancelLoop: () => true,
          getState: () => null,
        },
      } as never,
      tools: {},
    })
    const output = {
      message: {} as Record<string, unknown>,
      parts: [{ type: "text", text: "original" }],
    }

    // when
    await pluginInterface["command.execute.before"]?.(
      {
        command: "dw-loop",
        sessionID: "ses-dw-native",
        arguments: '"Ship feature" --strategy=continue',
      },
      output as never,
    )
    await pluginInterface["chat.message"]?.(
      {
        sessionID: "ses-dw-native",
        agent: "chief",
      } as never,
      output as never,
    )

    // then
    expect(output.parts[0]?.text).toContain("/dw-loop Command")
    expect(startLoopCalls).toEqual([
      {
        sessionID: "ses-dw-native",
        prompt: "Ship feature",
        options: {
          deepwork: true,
          maxIterations: undefined,
          completionPromise: undefined,
          strategy: "continue",
        },
      },
    ])
  })
})

describe("createPluginInterface - backward compatibility", () => {
  beforeEach(() => {
    _resetForTesting()
    registerAgentName("founder")
  })

  afterEach(() => {
    _resetForTesting()
  })

  test("strips legacy ZWSP-prefixed agent names from persisted chat.message session state (GH-3259)", async () => {
    // given - persisted session payload from v3.14.0-v3.16.0 with ZWSP prefix
    const pluginInterface = createPluginInterface({
      ctx: {
        directory: tmpdir(),
        client: { tui: { showToast: async () => {} } },
      } as never,
      pluginConfig: {} as never,
      firstMessageVariantGate: {
        shouldOverride: () => false,
        markApplied: () => {},
        markSessionCreated: () => {},
        clear: () => {},
      },
      managers: {} as never,
      hooks: {} as never,
      tools: {},
    })
    const output = {
      message: {} as Record<string, unknown>,
      parts: [{ type: "text", text: "hello" }],
    }

    // when
    await pluginInterface["chat.message"]?.(
      {
        sessionID: "ses-legacy-zwsp",
        agent: "\u200B\u200BFounder - Deep Agent",
      } as never,
      output as never,
    )

    // then
    expect(getSessionAgent("ses-legacy-zwsp")).toBe("Founder - Deep Agent")
  })
})
