import { describe, expect, test, beforeEach, afterEach, spyOn } from "bun:test"
import type { PluginInput } from "@opencode-ai/plugin"
import { createKeywordDetectorHook } from "./index"
import { setMainSession, _resetForTesting } from "../../features/claude-code-session-state"
import * as sharedModule from "../../shared"
import * as sessionState from "../../features/claude-code-session-state"

describe("keyword-detector hyperplan keyword", () => {
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

  test("should inject hyperplan message when user types hyperplan", async () => {
    const sessionID = "hyperplan-full-session"
    getMainSessionSpy = spyOn(sessionState, "getMainSessionID").mockReturnValue(sessionID)
    const hook = createKeywordDetectorHook(createMockPluginInput())
    const output = {
      message: {} as Record<string, unknown>,
      parts: [{ type: "text", text: "hyperplan refactor the auth module" }],
    }

    await hook["chat.message"]({ sessionID }, output)

    expect(output.parts[0]?.text).toContain("<hyperplan-mode>")
    expect(output.parts[0]?.text).toContain('skill(name="hyperplan")')
    expect(output.parts[0]?.text).toContain("HYPERPLAN MODE ENABLED")
    expect(output.parts[0]?.text).toContain("unspecified-low")
    expect(output.parts[0]?.text).toContain("unspecified-high")
    expect(output.parts[0]?.text).toContain("ultrabrain")
    expect(output.parts[0]?.text).toContain("artistry")
    expect(output.parts[0]?.text).toContain("planner")
    expect(output.parts[0]?.text).toContain("oh-my-cortex.jsonc")
    expect(output.parts[0]?.text).toContain("refactor the auth module")
    expect(output.parts[0]?.text).toContain("---")
  })

  test("should inject hyperplan message for hpp shorthand and show toast", async () => {
    const sessionID = "hyperplan-short-session"
    const toastCalls: string[] = []
    getMainSessionSpy = spyOn(sessionState, "getMainSessionID").mockReturnValue(sessionID)
    const hook = createKeywordDetectorHook(createMockPluginInput({ toastCalls }))
    const output = {
      message: {} as Record<string, unknown>,
      parts: [{ type: "text", text: "hpp structure this feature" }],
    }

    await hook["chat.message"]({ sessionID }, output)

    expect(output.parts[0]?.text).toContain("<hyperplan-mode>")
    expect(toastCalls).toContain("Hyperplan Mode Activated")
  })

  test("should not inject hyperplan for slash command invocations", async () => {
    const sessionID = "hyperplan-slash-session"
    const toastCalls: string[] = []
    getMainSessionSpy = spyOn(sessionState, "getMainSessionID").mockReturnValue(sessionID)
    const hook = createKeywordDetectorHook(createMockPluginInput({ toastCalls }))
    const output = {
      message: {} as Record<string, unknown>,
      parts: [{ type: "text", text: "/hyperplan refactor the auth module" }],
    }

    await hook["chat.message"]({ sessionID }, output)

    expect(output.parts[0]?.text).toBe("/hyperplan refactor the auth module")
    expect(toastCalls).not.toContain("Hyperplan Mode Activated")
  })

  test("should respect disabled hyperplan keyword config", async () => {
    const sessionID = "hyperplan-disabled-session"
    getMainSessionSpy = spyOn(sessionState, "getMainSessionID").mockReturnValue(sessionID)
    const hook = createKeywordDetectorHook(
      createMockPluginInput(),
      undefined,
      undefined,
      { disabled_keywords: ["hyperplan"] },
    )
    const output = {
      message: {} as Record<string, unknown>,
      parts: [{ type: "text", text: "hyperplan refactor this" }],
    }

    await hook["chat.message"]({ sessionID }, output)

    expect(output.parts[0]?.text).toBe("hyperplan refactor this")
  })

  test("should filter hyperplan in non-main and planner sessions", async () => {
    setMainSession("main-hyperplan")
    const hook = createKeywordDetectorHook(createMockPluginInput())
    const nonMainOutput = {
      message: {} as Record<string, unknown>,
      parts: [{ type: "text", text: "hyperplan please" }],
    }

    await hook["chat.message"]({ sessionID: "subagent-hyperplan" }, nonMainOutput)

    expect(nonMainOutput.parts[0]?.text).toBe("hyperplan please")

    const plannerOutput = {
      message: {} as Record<string, unknown>,
      parts: [{ type: "text", text: "hpp plan this feature" }],
    }

    await hook["chat.message"]({ sessionID: "planner-session", agent: "planner" }, plannerOutput)

    expect(plannerOutput.parts[0]?.text).toBe("hpp plan this feature")
  })
})
