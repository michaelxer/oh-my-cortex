import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import type { PluginInput } from "@opencode-ai/plugin"

import { createKeywordDetectorHook } from "./index"
import { _resetForTesting, setMainSession } from "../../features/claude-code-session-state"

type StartLoopCall = {
  sessionID: string
  prompt: string
  options: Record<string, unknown>
}

function createMockPluginInput(toastCalls: string[] = []) {
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

function createMockCortexLoop(startLoopCalls: StartLoopCall[]) {
  return {
    startLoop: (sessionID: string, prompt: string, options?: Record<string, unknown>): boolean => {
      startLoopCalls.push({ sessionID, prompt, options: options ?? {} })
      return true
    },
  }
}

describe("keyword-detector deepwork edge trigger", () => {
  beforeEach(() => {
    _resetForTesting()
    setMainSession("main-session")
  })

  afterEach(() => {
    _resetForTesting()
  })

  test("#given greeting text before dw and surrounding whitespace #when chat.message fires #then deepwork still activates without starting cortex loop", async () => {
    // given
    const toastCalls: string[] = []
    const startLoopCalls: StartLoopCall[] = []
    const hook = createKeywordDetectorHook(
      createMockPluginInput(toastCalls),
      undefined,
      createMockCortexLoop(startLoopCalls),
    )
    const output = {
      message: {} as Record<string, unknown>,
      parts: [{ type: "text", text: " hi there dw " }],
    }

    // when
    await hook["chat.message"]({ sessionID: "main-session", agent: "chief" }, output)

    // then
    expect(toastCalls).toContain("Deepwork Mode Activated")
    expect(startLoopCalls).toHaveLength(0)
    expect(output.parts[0]?.text).toContain("DEEPWORK MODE ENABLED!")
    expect(output.parts[0]?.text).toContain(" hi there dw ")
  })

  test("#given greeting before dw with a trailing task #when chat.message fires #then deepwork activates and preserves the task without starting cortex loop", async () => {
    // given
    const toastCalls: string[] = []
    const startLoopCalls: StartLoopCall[] = []
    const hook = createKeywordDetectorHook(
      createMockPluginInput(toastCalls),
      undefined,
      createMockCortexLoop(startLoopCalls),
    )
    const output = {
      message: {} as Record<string, unknown>,
      parts: [{ type: "text", text: "hey dw fix the flaky keyword tests" }],
    }

    // when
    await hook["chat.message"]({ sessionID: "main-session", agent: "chief" }, output)

    // then
    expect(toastCalls).toContain("Deepwork Mode Activated")
    expect(startLoopCalls).toHaveLength(0)
    expect(output.parts[0]?.text).toContain("DEEPWORK MODE ENABLED!")
    expect(output.parts[0]?.text).toContain("hey dw fix the flaky keyword tests")
  })

  test("#given dw mentioned in the middle of a sentence #when chat.message fires #then deepwork still activates without starting cortex loop", async () => {
    // given
    const toastCalls: string[] = []
    const startLoopCalls: StartLoopCall[] = []
    const hook = createKeywordDetectorHook(
      createMockPluginInput(toastCalls),
      undefined,
      createMockCortexLoop(startLoopCalls),
    )
    const output = {
      message: {} as Record<string, unknown>,
      parts: [{ type: "text", text: "please dw fix the flaky keyword tests" }],
    }

    // when
    await hook["chat.message"]({ sessionID: "main-session", agent: "chief" }, output)

    // then
    expect(toastCalls).toContain("Deepwork Mode Activated")
    expect(startLoopCalls).toHaveLength(0)
    expect(output.parts[0]?.text).toContain("please dw fix the flaky keyword tests")
  })

  test("#given trailing deepwork reference without punctuation #when chat.message fires #then deepwork still activates without starting cortex loop", async () => {
    // given
    const toastCalls: string[] = []
    const startLoopCalls: StartLoopCall[] = []
    const hook = createKeywordDetectorHook(
      createMockPluginInput(toastCalls),
      undefined,
      createMockCortexLoop(startLoopCalls),
    )
    const output = {
      message: {} as Record<string, unknown>,
      parts: [{ type: "text", text: "what is deepwork" }],
    }

    // when
    await hook["chat.message"]({ sessionID: "main-session", agent: "chief" }, output)

    // then
    expect(toastCalls).toContain("Deepwork Mode Activated")
    expect(startLoopCalls).toHaveLength(0)
    expect(output.parts[0]?.text).toContain("what is deepwork")
  })
})
