import { describe, expect, test, beforeEach, afterEach, spyOn } from "bun:test"
import type { PluginInput } from "@opencode-ai/plugin"
import { createKeywordDetectorHook } from "./index"
import { _resetForTesting } from "../../features/claude-code-session-state"
import * as sharedModule from "../../shared"
import * as sessionState from "../../features/claude-code-session-state"

describe("keyword-detector team mode keyword", () => {
  let logSpy: ReturnType<typeof spyOn>
  let getMainSessionSpy: ReturnType<typeof spyOn>

  beforeEach(() => {
    _resetForTesting()
    logSpy = spyOn(sharedModule, "log").mockImplementation(() => {})
  })

  afterEach(() => {
    logSpy?.mockRestore()
    getMainSessionSpy?.mockRestore()
    _resetForTesting()
  })

  function createMockPluginInput() {
    return {
      client: {
        tui: {
          showToast: async () => {},
        },
      },
    } as unknown as PluginInput
  }

  test("should inject team-mode guidance when user types team mode", async () => {
    const sessionID = "team-mode-session"
    getMainSessionSpy = spyOn(sessionState, "getMainSessionID").mockReturnValue(sessionID)
    const hook = createKeywordDetectorHook(createMockPluginInput())
    const output = {
      message: {} as Record<string, unknown>,
      parts: [{ type: "text", text: "team mode review this architecture" }],
    }

    await hook["chat.message"]({ sessionID }, output)

    expect(output.parts[0]?.text).toContain("[team-mode]")
    expect(output.parts[0]?.text).toContain("team_create")
    expect(output.parts[0]?.text).toContain("team_mode.enabled=true")
    expect(output.parts[0]?.text).toContain("review this architecture")
  })

  test("should respect disabled team keyword config", async () => {
    const sessionID = "team-mode-disabled-session"
    getMainSessionSpy = spyOn(sessionState, "getMainSessionID").mockReturnValue(sessionID)
    const hook = createKeywordDetectorHook(
      createMockPluginInput(),
      undefined,
      undefined,
      { disabled_keywords: ["team"] },
    )
    const output = {
      message: {} as Record<string, unknown>,
      parts: [{ type: "text", text: "team-mode coordinate this" }],
    }

    await hook["chat.message"]({ sessionID }, output)

    expect(output.parts[0]?.text).toBe("team-mode coordinate this")
  })
})
