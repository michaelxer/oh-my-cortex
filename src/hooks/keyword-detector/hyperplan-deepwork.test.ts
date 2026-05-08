import { describe, expect, test, beforeEach, afterEach, spyOn } from "bun:test"
import type { PluginInput } from "@opencode-ai/plugin"
import { createKeywordDetectorHook } from "./index"
import { setMainSession, _resetForTesting } from "../../features/claude-code-session-state"
import * as sharedModule from "../../shared"
import * as sessionState from "../../features/claude-code-session-state"

describe("keyword-detector hyperplan-deepwork combo", () => {
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

  function createMockPluginInput(options: { toastCalls?: string[] } = {}) {
    const toastCalls = options.toastCalls ?? []
    return {
      client: {
        tui: {
          showToast: async (opts: { body: { title: string } }) => {
            toastCalls.push(opts.body.title)
          },
        },
      },
    } as unknown as PluginInput
  }

  test("should inject combo message for hpp dw and suppress standalone banners", async () => {
    const sessionID = "combo-forward-session"
    getMainSessionSpy = spyOn(sessionState, "getMainSessionID").mockReturnValue(sessionID)
    const hook = createKeywordDetectorHook(createMockPluginInput())
    const output = {
      message: {} as Record<string, unknown>,
      parts: [{ type: "text", text: "hpp dw refactor the auth module" }],
    }

    await hook["chat.message"]({ sessionID }, output)

    expect(output.parts[0]?.text).toContain("<hyperplan-deepwork-mode>")
    expect(output.parts[0]?.text).toContain("<deepwork-mode>")
    expect(output.parts[0]?.text).not.toContain("<hyperplan-mode>")
    expect(output.parts[0]?.text).toContain("refactor the auth module")
  })

  test("should inject combo message for reverse order", async () => {
    const sessionID = "combo-reverse-session"
    getMainSessionSpy = spyOn(sessionState, "getMainSessionID").mockReturnValue(sessionID)
    const hook = createKeywordDetectorHook(createMockPluginInput())
    const output = {
      message: {} as Record<string, unknown>,
      parts: [{ type: "text", text: "deepwork hyperplan ship this feature" }],
    }

    await hook["chat.message"]({ sessionID }, output)

    expect(output.parts[0]?.text).toContain("<hyperplan-deepwork-mode>")
    expect(output.parts[0]?.text).toContain("<deepwork-mode>")
    expect(output.parts[0]?.text).toContain("ship this feature")
  })

  test("should fire combo toast and suppress standalone toasts", async () => {
    const sessionID = "combo-toast-session"
    const toastCalls: string[] = []
    getMainSessionSpy = spyOn(sessionState, "getMainSessionID").mockReturnValue(sessionID)
    const hook = createKeywordDetectorHook(createMockPluginInput({ toastCalls }))
    const output = {
      message: {} as Record<string, unknown>,
      parts: [{ type: "text", text: "hpp dw do it" }],
    }

    await hook["chat.message"]({ sessionID }, output)

    expect(toastCalls).toContain("Hyperplan Deepwork Mode Activated")
    expect(toastCalls).not.toContain("Deepwork Mode Activated")
    expect(toastCalls).not.toContain("Hyperplan Mode Activated")
  })

  test("should disable only combo when hyperplan-deepwork is disabled", async () => {
    const sessionID = "combo-disabled-session"
    getMainSessionSpy = spyOn(sessionState, "getMainSessionID").mockReturnValue(sessionID)
    const hook = createKeywordDetectorHook(
      createMockPluginInput(),
      undefined,
      undefined,
      { disabled_keywords: ["hyperplan-deepwork"] },
    )
    const output = {
      message: {} as Record<string, unknown>,
      parts: [{ type: "text", text: "hpp dw work it" }],
    }

    await hook["chat.message"]({ sessionID }, output)

    expect(output.parts[0]?.text).not.toContain("<hyperplan-deepwork-mode>")
    expect(output.parts[0]?.text).toContain("<hyperplan-mode>")
    expect(output.parts[0]?.text).toContain("<deepwork-mode>")
  })

  test("should block combo via intersection rule when deepwork is disabled", async () => {
    const sessionID = "combo-intersection-session"
    getMainSessionSpy = spyOn(sessionState, "getMainSessionID").mockReturnValue(sessionID)
    const toastCalls: string[] = []
    const hook = createKeywordDetectorHook(
      createMockPluginInput({ toastCalls }),
      undefined,
      undefined,
      { disabled_keywords: ["deepwork"] },
    )
    const output = {
      message: {} as Record<string, unknown>,
      parts: [{ type: "text", text: "hpp dw plan stuff" }],
    }

    await hook["chat.message"]({ sessionID }, output)

    expect(output.parts[0]?.text).not.toContain("<hyperplan-deepwork-mode>")
    expect(output.parts[0]?.text).not.toContain("<deepwork-mode>")
    expect(output.parts[0]?.text).toContain("<hyperplan-mode>")
    expect(toastCalls).toContain("Hyperplan Mode Activated")
    expect(toastCalls).not.toContain("Hyperplan Deepwork Mode Activated")
  })

  test("should allow combo in non-main session like standalone deepwork", async () => {
    setMainSession("main-combo")
    const hook = createKeywordDetectorHook(createMockPluginInput())
    const output = {
      message: {} as Record<string, unknown>,
      parts: [{ type: "text", text: "hpp dw run this" }],
    }

    await hook["chat.message"]({ sessionID: "subagent-combo" }, output)

    expect(output.parts[0]?.text).toContain("<hyperplan-deepwork-mode>")
    expect(output.parts[0]?.text).toContain("<deepwork-mode>")
    expect(output.parts[0]?.text).toContain("run this")
  })
})
