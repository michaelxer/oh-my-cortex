import { afterAll, describe, expect, test, beforeEach, afterEach, mock } from "bun:test"
import { mkdirSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { randomUUID } from "node:crypto"
import { SYSTEM_DIRECTIVE_PREFIX } from "../../shared/system-directive"
import { clearSessionAgent, setSessionAgent } from "../../features/claude-code-session-state"
// Force stable (JSON) mode for tests that rely on message file storage
mock.module("../../shared/opencode-storage-detection", () => ({
  isSqliteBackend: () => false,
  resetSqliteBackendCache: () => {},
}))

afterAll(() => {
  mock.restore()
})

const { createPlannerMdOnlyHook } = await import("./index")
const { MESSAGE_STORAGE } = await import("../../features/hook-message-injector")

describe("planner-md-only", () => {
  const TEST_SESSION_ID = "ses_test_planner"
  let testMessageDir: string

  function createMockPluginInput() {
    return {
      client: {},
      directory: "/tmp/test",
    } as never
  }

  function setupMessageStorage(
    sessionID: string,
    agent: string | undefined,
    options?: { useSessionAgent?: boolean },
  ): void {
    const useSessionAgent = options?.useSessionAgent ?? true
    testMessageDir = join(MESSAGE_STORAGE, sessionID)
    if (agent && useSessionAgent) {
      setSessionAgent(sessionID, agent)
      return
    }

    clearSessionAgent(sessionID)
    rmSync(testMessageDir, { recursive: true, force: true })
    mkdirSync(testMessageDir, { recursive: true })
    if (!agent) {
      return
    }

    try {
      writeFileSync(
        join(testMessageDir, "msg_001.json"),
        JSON.stringify({
          agent,
          model: { providerID: "test", modelID: "test-model" },
        }),
      )
    } catch {
      clearSessionAgent(sessionID)
    }
  }

  afterEach(() => {
    clearSessionAgent(TEST_SESSION_ID)
    if (testMessageDir) {
      try {
        rmSync(testMessageDir, { recursive: true, force: true })
      } catch {
        // ignore
      }
    }
  })

  describe("agent name matching", () => {
    test("should enforce md-only restriction for exact planner agent name", async () => {
      //#given
      setupMessageStorage(TEST_SESSION_ID, "planner")
      const hook = createPlannerMdOnlyHook(createMockPluginInput())
      const input = {
        tool: "Write",
        sessionID: TEST_SESSION_ID,
        callID: "call-1",
      }
      const output = {
        args: { filePath: "/path/to/file.ts" },
      }

      //#when //#then
      await expect(
        hook["tool.execute.before"](input, output)
      ).rejects.toThrow("File operations restricted to .cortex/*.md plan files only")
    })

    test("should enforce md-only restriction for Planner display name Plan Builder", async () => {
      //#given
      setupMessageStorage(TEST_SESSION_ID, "Planner - Plan Builder")
      const hook = createPlannerMdOnlyHook(createMockPluginInput())
      const input = {
        tool: "Write",
        sessionID: TEST_SESSION_ID,
        callID: "call-1",
      }
      const output = {
        args: { filePath: "/path/to/file.ts" },
      }

      //#when //#then
      await expect(
        hook["tool.execute.before"](input, output)
      ).rejects.toThrow("File operations restricted to .cortex/*.md plan files only")
    })

    test("should enforce md-only restriction for Planner display name Planner", async () => {
      //#given
      setupMessageStorage(TEST_SESSION_ID, "Planner - Plan Builder")
      const hook = createPlannerMdOnlyHook(createMockPluginInput())
      const input = {
        tool: "Write",
        sessionID: TEST_SESSION_ID,
        callID: "call-1",
      }
      const output = {
        args: { filePath: "/path/to/file.ts" },
      }

      //#when //#then
      await expect(
        hook["tool.execute.before"](input, output)
      ).rejects.toThrow("File operations restricted to .cortex/*.md plan files only")
    })

    test("should enforce md-only restriction for uppercase PLANNER", async () => {
      //#given
      setupMessageStorage(TEST_SESSION_ID, "PLANNER")
      const hook = createPlannerMdOnlyHook(createMockPluginInput())
      const input = {
        tool: "Write",
        sessionID: TEST_SESSION_ID,
        callID: "call-1",
      }
      const output = {
        args: { filePath: "/path/to/file.ts" },
      }

      //#when //#then
      await expect(
        hook["tool.execute.before"](input, output)
      ).rejects.toThrow("File operations restricted to .cortex/*.md plan files only")
    })

    test("should not enforce restriction for non-Planner agent", async () => {
      //#given
      setupMessageStorage(TEST_SESSION_ID, "chief")
      const hook = createPlannerMdOnlyHook(createMockPluginInput())
      const input = {
        tool: "Write",
        sessionID: TEST_SESSION_ID,
        callID: "call-1",
      }
      const output = {
        args: { filePath: "/path/to/file.ts" },
      }

      //#when //#then
      await expect(
        hook["tool.execute.before"](input, output)
      ).resolves.toBeUndefined()
    })

    test("should not enforce restriction when agent name is undefined", async () => {
      //#given
      setupMessageStorage(TEST_SESSION_ID, undefined)
      const hook = createPlannerMdOnlyHook(createMockPluginInput())
      const input = {
        tool: "Write",
        sessionID: TEST_SESSION_ID,
        callID: "call-1",
      }
      const output = {
        args: { filePath: "/path/to/file.ts" },
      }

      //#when //#then
      await expect(
        hook["tool.execute.before"](input, output)
      ).resolves.toBeUndefined()
    })
  })

   describe("with Planner agent in message storage", () => {
     beforeEach(() => {
       setupMessageStorage(TEST_SESSION_ID, "planner")
     })

    test("should block Planner from writing non-.md files", async () => {
      // given
      const hook = createPlannerMdOnlyHook(createMockPluginInput())
      const input = {
        tool: "Write",
        sessionID: TEST_SESSION_ID,
        callID: "call-1",
      }
      const output = {
        args: { filePath: "/path/to/file.ts" },
      }

      // when / #then
      await expect(
        hook["tool.execute.before"](input, output)
      ).rejects.toThrow("File operations restricted to .cortex/*.md plan files only")
    })

    test("should allow Planner to write .md files inside .cortex/", async () => {
      // given
      const hook = createPlannerMdOnlyHook(createMockPluginInput())
      const input = {
        tool: "Write",
        sessionID: TEST_SESSION_ID,
        callID: "call-1",
      }
      const output = {
        args: { filePath: "/tmp/test/.cortex/plans/work-plan.md" },
      }

      // when / #then
      await expect(
        hook["tool.execute.before"](input, output)
      ).resolves.toBeUndefined()
    })

    test("should inject workflow reminder when Planner writes to .cortex/plans/", async () => {
      // given
      const hook = createPlannerMdOnlyHook(createMockPluginInput())
      const input = {
        tool: "Write",
        sessionID: TEST_SESSION_ID,
        callID: "call-1",
      }
      const output: { args: Record<string, unknown>; message?: string } = {
        args: { filePath: "/tmp/test/.cortex/plans/work-plan.md" },
      }

      // when
      await hook["tool.execute.before"](input, output)

      // then
      expect(output.message).toContain("PLANNER MANDATORY WORKFLOW REMINDER")
      expect(output.message).toContain("INTERVIEW")
      expect(output.message).toContain("REVIEWER CONSULTATION")
      expect(output.message).toContain("CRITIC REVIEW")
    })

    test("should NOT inject workflow reminder for .cortex/drafts/", async () => {
      // given
      const hook = createPlannerMdOnlyHook(createMockPluginInput())
      const input = {
        tool: "Write",
        sessionID: TEST_SESSION_ID,
        callID: "call-1",
      }
      const output: { args: Record<string, unknown>; message?: string } = {
        args: { filePath: "/tmp/test/.cortex/drafts/notes.md" },
      }

      // when
      await hook["tool.execute.before"](input, output)

      // then
      expect(output.message).toBeUndefined()
    })

    test("should block Planner from writing .md files outside .cortex/", async () => {
      // given
      const hook = createPlannerMdOnlyHook(createMockPluginInput())
      const input = {
        tool: "Write",
        sessionID: TEST_SESSION_ID,
        callID: "call-1",
      }
      const output = {
        args: { filePath: "/path/to/README.md" },
      }

      // when / #then
      await expect(
        hook["tool.execute.before"](input, output)
      ).rejects.toThrow("File operations restricted to .cortex/*.md plan files only")
    })

    test("should block Edit tool for non-.md files", async () => {
      // given
      const hook = createPlannerMdOnlyHook(createMockPluginInput())
      const input = {
        tool: "Edit",
        sessionID: TEST_SESSION_ID,
        callID: "call-1",
      }
      const output = {
        args: { filePath: "/path/to/code.py" },
      }

      // when / #then
      await expect(
        hook["tool.execute.before"](input, output)
      ).rejects.toThrow("File operations restricted to .cortex/*.md plan files only")
    })

    test("should allow bash commands from Planner", async () => {
      // given
      const hook = createPlannerMdOnlyHook(createMockPluginInput())
      const input = {
        tool: "bash",
        sessionID: TEST_SESSION_ID,
        callID: "call-1",
      }
      const output = {
        args: { command: "echo test" },
      }

      // when / #then
      await expect(
        hook["tool.execute.before"](input, output)
      ).resolves.toBeUndefined()
    })

    test("should not affect non-blocked tools", async () => {
      // given
      const hook = createPlannerMdOnlyHook(createMockPluginInput())
      const input = {
        tool: "Read",
        sessionID: TEST_SESSION_ID,
        callID: "call-1",
      }
      const output = {
        args: { filePath: "/path/to/file.ts" },
      }

      // when / #then
      await expect(
        hook["tool.execute.before"](input, output)
      ).resolves.toBeUndefined()
    })

    test("should handle missing filePath gracefully", async () => {
      // given
      const hook = createPlannerMdOnlyHook(createMockPluginInput())
      const input = {
        tool: "Write",
        sessionID: TEST_SESSION_ID,
        callID: "call-1",
      }
      const output = {
        args: {},
      }

      // when / #then
      await expect(
        hook["tool.execute.before"](input, output)
      ).resolves.toBeUndefined()
    })

    test("should inject planning warning when Planner calls task", async () => {
      // given
      const hook = createPlannerMdOnlyHook(createMockPluginInput())
      const input = {
        tool: "task",
        sessionID: TEST_SESSION_ID,
        callID: "call-1",
      }
      const output = {
        args: { prompt: "Analyze this codebase" },
      }

      // when
      await hook["tool.execute.before"](input, output)

      // then
      expect(output.args.prompt).toContain(SYSTEM_DIRECTIVE_PREFIX)
      expect(output.args.prompt).toContain("DO NOT modify any files")
    })

    test("should inject planning warning when Planner calls task", async () => {
      // given
      const hook = createPlannerMdOnlyHook(createMockPluginInput())
      const input = {
        tool: "task",
        sessionID: TEST_SESSION_ID,
        callID: "call-1",
      }
      const output = {
        args: { prompt: "Research this library" },
      }

      // when
      await hook["tool.execute.before"](input, output)

      // then
      expect(output.args.prompt).toContain(SYSTEM_DIRECTIVE_PREFIX)
    })

    test("should inject planning warning when Planner calls call_cortex_agent", async () => {
      // given
      const hook = createPlannerMdOnlyHook(createMockPluginInput())
      const input = {
        tool: "call_cortex_agent",
        sessionID: TEST_SESSION_ID,
        callID: "call-1",
      }
      const output = {
        args: { prompt: "Find implementation examples" },
      }

      // when
      await hook["tool.execute.before"](input, output)

      // then
      expect(output.args.prompt).toContain(SYSTEM_DIRECTIVE_PREFIX)
    })

    test("should not double-inject warning if already present", async () => {
      // given
      const hook = createPlannerMdOnlyHook(createMockPluginInput())
      const input = {
        tool: "task",
        sessionID: TEST_SESSION_ID,
        callID: "call-1",
      }
      const promptWithWarning = `Some prompt ${SYSTEM_DIRECTIVE_PREFIX} already here`
      const output = {
        args: { prompt: promptWithWarning },
      }

      // when
      await hook["tool.execute.before"](input, output)

      // then
      const occurrences = (output.args.prompt as string).split(SYSTEM_DIRECTIVE_PREFIX).length - 1
      expect(occurrences).toBe(1)
    })
  })

  describe("with non-Planner agent in message storage", () => {
    beforeEach(() => {
      setupMessageStorage(TEST_SESSION_ID, "chief")
    })

    test("should not affect non-Planner agents", async () => {
      // given
      const hook = createPlannerMdOnlyHook(createMockPluginInput())
      const input = {
        tool: "Write",
        sessionID: TEST_SESSION_ID,
        callID: "call-1",
      }
      const output = {
        args: { filePath: "/path/to/file.ts" },
      }

      // when / #then
      await expect(
        hook["tool.execute.before"](input, output)
      ).resolves.toBeUndefined()
    })

    test("should not inject warning for non-Planner agents calling task", async () => {
      // given
      const hook = createPlannerMdOnlyHook(createMockPluginInput())
      const input = {
        tool: "task",
        sessionID: TEST_SESSION_ID,
        callID: "call-1",
      }
      const originalPrompt = "Implement this feature"
      const output = {
        args: { prompt: originalPrompt },
      }

      // when
      await hook["tool.execute.before"](input, output)

      // then
      expect(output.args.prompt).toBe(originalPrompt)
      expect(output.args.prompt).not.toContain(SYSTEM_DIRECTIVE_PREFIX)
    })
  })

  describe("workstate state priority over message files (fixes #927)", () => {
    const WORKSTATE_DIR = join(tmpdir(), `workstate-test-${randomUUID()}`)
    const WORKSTATE_FILE = join(WORKSTATE_DIR, ".cortex", "workstate.json")

    beforeEach(() => {
      mkdirSync(join(WORKSTATE_DIR, ".cortex"), { recursive: true })
    })

    afterEach(() => {
      rmSync(WORKSTATE_DIR, { recursive: true, force: true })
    })

    //#given session was started with planner (first message), but /start-work set workstate agent to lead
    //#when user types "continue" after interruption (memory cleared, falls back to message files)
    //#then should use workstate state agent (lead), not message file agent (planner)
    test("should prioritize workstate agent over message file agent", async () => {
      setupMessageStorage(TEST_SESSION_ID, undefined)
      
      // given - lead in workstate state (from /start-work)
      writeFileSync(WORKSTATE_FILE, JSON.stringify({
        active_plan: "/test/plan.md",
        started_at: new Date().toISOString(),
        session_ids: [TEST_SESSION_ID],
        plan_name: "test-plan",
        agent: "lead"
      }))

      const hook = createPlannerMdOnlyHook({
        client: {},
        directory: WORKSTATE_DIR,
      } as never)

      const input = {
        tool: "Write",
        sessionID: TEST_SESSION_ID,
        callID: "call-1",
      }
      const output = {
        args: { filePath: "/path/to/code.ts" },
      }

      // when / then - should NOT block because workstate says lead, not planner
      await expect(
        hook["tool.execute.before"](input, output)
      ).resolves.toBeUndefined()
    })

    test("should use planner from workstate state when set", async () => {
      // given - lead in message files (from some other agent)
      setupMessageStorage(TEST_SESSION_ID, "lead", { useSessionAgent: false })
      
      // given - planner in workstate state (edge case, but should honor it)
      writeFileSync(WORKSTATE_FILE, JSON.stringify({
        active_plan: "/test/plan.md",
        started_at: new Date().toISOString(),
        session_ids: [TEST_SESSION_ID],
        plan_name: "test-plan",
        agent: "planner"
      }))

      const hook = createPlannerMdOnlyHook({
        client: {},
        directory: WORKSTATE_DIR,
      } as never)

      const input = {
        tool: "Write",
        sessionID: TEST_SESSION_ID,
        callID: "call-1",
      }
      const output = {
        args: { filePath: "/path/to/code.ts" },
      }

      // when / then - should block because workstate says planner
      await expect(
        hook["tool.execute.before"](input, output)
      ).rejects.toThrow("File operations restricted to .cortex/*.md plan files only")
    })

    test("should fall back to message files when session not in workstate", async () => {
      // given - planner in message files
      setupMessageStorage(TEST_SESSION_ID, "planner")
      
      // given - workstate state exists but for different session
      writeFileSync(WORKSTATE_FILE, JSON.stringify({
        active_plan: "/test/plan.md",
        started_at: new Date().toISOString(),
        session_ids: ["ses_other_session_id"],
        plan_name: "test-plan",
        agent: "lead"
      }))

      const hook = createPlannerMdOnlyHook({
        client: {},
        directory: WORKSTATE_DIR,
      } as never)

      const input = {
        tool: "Write",
        sessionID: TEST_SESSION_ID,
        callID: "call-1",
      }
      const output = {
        args: { filePath: "/path/to/code.ts" },
      }

      // when / then - should block because falls back to message files (planner)
      await expect(
        hook["tool.execute.before"](input, output)
      ).rejects.toThrow("File operations restricted to .cortex/*.md plan files only")
    })
  })

  describe("without message storage", () => {
    test("should handle missing session gracefully (no agent found)", async () => {
      // given
      const hook = createPlannerMdOnlyHook(createMockPluginInput())
      const input = {
        tool: "Write",
        sessionID: "ses_non_existent_session",
        callID: "call-1",
      }
      const output = {
        args: { filePath: "/path/to/file.ts" },
      }

      // when / #then
      await expect(
        hook["tool.execute.before"](input, output)
      ).resolves.toBeUndefined()
    })
  })

  describe("cross-platform path validation", () => {
    beforeEach(() => {
      setupMessageStorage(TEST_SESSION_ID, "planner")
    })

     test("should allow Windows-style backslash paths under .cortex/", async () => {
       // given
       setupMessageStorage(TEST_SESSION_ID, "planner")
       const hook = createPlannerMdOnlyHook(createMockPluginInput())
       const input = {
         tool: "Write",
         sessionID: TEST_SESSION_ID,
         callID: "call-1",
       }
       const output = {
         args: { filePath: ".cortex\\plans\\work-plan.md" },
       }

       // when / #then
       await expect(
         hook["tool.execute.before"](input, output)
       ).resolves.toBeUndefined()
     })

     test("should allow mixed separator paths under .cortex/", async () => {
       // given
       setupMessageStorage(TEST_SESSION_ID, "planner")
       const hook = createPlannerMdOnlyHook(createMockPluginInput())
       const input = {
         tool: "Write",
         sessionID: TEST_SESSION_ID,
         callID: "call-1",
       }
       const output = {
         args: { filePath: ".cortex\\plans/work-plan.MD" },
       }

       // when / #then
       await expect(
         hook["tool.execute.before"](input, output)
       ).resolves.toBeUndefined()
     })

     test("should allow uppercase .MD extension", async () => {
       // given
       setupMessageStorage(TEST_SESSION_ID, "planner")
       const hook = createPlannerMdOnlyHook(createMockPluginInput())
       const input = {
         tool: "Write",
         sessionID: TEST_SESSION_ID,
         callID: "call-1",
       }
       const output = {
         args: { filePath: ".cortex/plans/work-plan.MD" },
       }

       // when / #then
       await expect(
         hook["tool.execute.before"](input, output)
       ).resolves.toBeUndefined()
     })

     test("should block paths outside workspace root even if containing .cortex", async () => {
       // given
       setupMessageStorage(TEST_SESSION_ID, "planner")
       const hook = createPlannerMdOnlyHook(createMockPluginInput())
       const input = {
         tool: "Write",
         sessionID: TEST_SESSION_ID,
         callID: "call-1",
       }
       const output = {
         args: { filePath: "/other/project/.cortex/plans/x.md" },
       }

       // when / #then
       await expect(
         hook["tool.execute.before"](input, output)
       ).rejects.toThrow("File operations restricted to .cortex/*.md plan files only")
     })

     test("should allow nested .cortex directories (ctx.directory may be parent)", async () => {
       // given - when ctx.directory is parent of actual project, path includes project name
       setupMessageStorage(TEST_SESSION_ID, "planner")
       const hook = createPlannerMdOnlyHook(createMockPluginInput())
       const input = {
         tool: "Write",
         sessionID: TEST_SESSION_ID,
         callID: "call-1",
       }
       const output = {
         args: { filePath: "src/.cortex/plans/x.md" },
       }

       // when / #then - should allow because .cortex is in path
       await expect(
         hook["tool.execute.before"](input, output)
       ).resolves.toBeUndefined()
     })

     test("should block path traversal attempts", async () => {
       // given
       setupMessageStorage(TEST_SESSION_ID, "planner")
       const hook = createPlannerMdOnlyHook(createMockPluginInput())
       const input = {
         tool: "Write",
         sessionID: TEST_SESSION_ID,
         callID: "call-1",
       }
       const output = {
         args: { filePath: ".cortex/../secrets.md" },
       }

       // when / #then
       await expect(
         hook["tool.execute.before"](input, output)
       ).rejects.toThrow("File operations restricted to .cortex/*.md plan files only")
     })

     test("should allow case-insensitive .CHIEF directory", async () => {
       // given
       setupMessageStorage(TEST_SESSION_ID, "planner")
       const hook = createPlannerMdOnlyHook(createMockPluginInput())
       const input = {
         tool: "Write",
         sessionID: TEST_SESSION_ID,
         callID: "call-1",
       }
       const output = {
         args: { filePath: ".CHIEF/plans/work-plan.md" },
       }

       // when / #then
       await expect(
         hook["tool.execute.before"](input, output)
       ).resolves.toBeUndefined()
     })

     test("should allow nested project path with .cortex (Windows real-world case)", async () => {
       // given - simulates when ctx.directory is parent of actual project
       // User reported: xauusd-dxy-plan\.cortex\drafts\supabase-email-templates.md
       setupMessageStorage(TEST_SESSION_ID, "planner")
       const hook = createPlannerMdOnlyHook(createMockPluginInput())
       const input = {
         tool: "Write",
         sessionID: TEST_SESSION_ID,
         callID: "call-1",
       }
       const output = {
         args: { filePath: "xauusd-dxy-plan\\.cortex\\drafts\\supabase-email-templates.md" },
       }

       // when / #then
       await expect(
         hook["tool.execute.before"](input, output)
       ).resolves.toBeUndefined()
     })

     test("should allow nested project path with mixed separators", async () => {
       // given
       setupMessageStorage(TEST_SESSION_ID, "planner")
       const hook = createPlannerMdOnlyHook(createMockPluginInput())
       const input = {
         tool: "Write",
         sessionID: TEST_SESSION_ID,
         callID: "call-1",
       }
       const output = {
         args: { filePath: "my-project/.cortex\\plans/task.md" },
       }

       // when / #then
       await expect(
         hook["tool.execute.before"](input, output)
       ).resolves.toBeUndefined()
     })

     test("should block nested project path without .cortex", async () => {
       // given
       setupMessageStorage(TEST_SESSION_ID, "planner")
       const hook = createPlannerMdOnlyHook(createMockPluginInput())
       const input = {
         tool: "Write",
         sessionID: TEST_SESSION_ID,
         callID: "call-1",
       }
       const output = {
         args: { filePath: "my-project\\src\\code.ts" },
       }

       // when / #then
       await expect(
         hook["tool.execute.before"](input, output)
       ).rejects.toThrow("File operations restricted to .cortex/*.md plan files only")
     })
  })
})
