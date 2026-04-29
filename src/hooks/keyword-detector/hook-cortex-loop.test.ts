import { describe, expect, test, beforeEach, afterEach } from "bun:test"
import { createKeywordDetectorHook } from "./index"
import { _resetForTesting, setMainSession } from "../../features/claude-code-session-state"

type StartLoopCall = {
  sessionID: string
  prompt: string
  options: Record<string, unknown>
}

type CancelLoopCall = { sessionID: string }

function createMockPluginInput() {
  return {
    client: {
      tui: {
        showToast: async () => {},
      },
    },
  } as any
}

function createMockCortexLoop(startLoopCalls: StartLoopCall[], cancelLoopCalls: CancelLoopCall[] = []) {
  return {
    startLoop: (sessionID: string, prompt: string, options?: Record<string, unknown>): boolean => {
      startLoopCalls.push({ sessionID, prompt, options: options ?? {} })
      return true
    },
    cancelLoop: (sessionID: string): boolean => {
      cancelLoopCalls.push({ sessionID })
      return true
    },
    getState: () => null,
    event: async () => {},
  }
}

describe("keyword-detector deepwork routing", () => {
  beforeEach(() => {
    _resetForTesting()
  })

  afterEach(() => {
    _resetForTesting()
  })

  test("#given dw keyword in main session #when chat.message fires #then deepwork prompt is injected without starting cortex loop", async () => {
    // given
    setMainSession("main-session")
    const startLoopCalls: StartLoopCall[] = []
    const cortexLoop = createMockCortexLoop(startLoopCalls)
    const hook = createKeywordDetectorHook(createMockPluginInput(), undefined, cortexLoop)
    const output = {
      message: {} as Record<string, unknown>,
      parts: [{ type: "text", text: "dw build a multi-agent backend architecture" }],
    }

    // when
    await hook["chat.message"]({ sessionID: "main-session", agent: "chief" }, output)

    // then
    expect(startLoopCalls).toHaveLength(0)
    expect(output.parts[0]?.text).toContain("YOU MUST LEVERAGE ALL AVAILABLE AGENTS")
    expect(output.parts[0]?.text).toContain("dw build a multi-agent backend architecture")
  })

  test("#given deepwork keyword in main session #when chat.message fires #then deepwork prompt is injected without starting cortex loop", async () => {
    // given
    setMainSession("main-session")
    const startLoopCalls: StartLoopCall[] = []
    const cortexLoop = createMockCortexLoop(startLoopCalls)
    const hook = createKeywordDetectorHook(createMockPluginInput(), undefined, cortexLoop)
    const output = {
      message: {} as Record<string, unknown>,
      parts: [{ type: "text", text: "deepwork ship the dashboard" }],
    }

    // when
    await hook["chat.message"]({ sessionID: "main-session", agent: "chief" }, output)

    // then
    expect(startLoopCalls).toHaveLength(0)
    expect(output.parts[0]?.text).toContain("YOU MUST LEVERAGE ALL AVAILABLE AGENTS")
    expect(output.parts[0]?.text).toContain("deepwork ship the dashboard")
  })

  test("#given dw mentioned mid-sentence #when chat.message fires #then deepwork prompt is injected without starting cortex loop", async () => {
    // given
    setMainSession("main-session")
    const startLoopCalls: StartLoopCall[] = []
    const cortexLoop = createMockCortexLoop(startLoopCalls)
    const hook = createKeywordDetectorHook(createMockPluginInput(), undefined, cortexLoop)
    const output = {
      message: {} as Record<string, unknown>,
      parts: [{ type: "text", text: "please dw fix the flaky keyword tests" }],
    }

    // when
    await hook["chat.message"]({ sessionID: "main-session", agent: "chief" }, output)

    // then
    expect(startLoopCalls).toHaveLength(0)
    expect(output.parts[0]?.text).toContain("please dw fix the flaky keyword tests")
  })

  test("#given question about deepwork #when chat.message fires #then deepwork prompt is injected without starting cortex loop", async () => {
    // given
    setMainSession("main-session")
    const startLoopCalls: StartLoopCall[] = []
    const cortexLoop = createMockCortexLoop(startLoopCalls)
    const hook = createKeywordDetectorHook(createMockPluginInput(), undefined, cortexLoop)
    const output = {
      message: {} as Record<string, unknown>,
      parts: [{ type: "text", text: "what is deepwork?" }],
    }

    // when
    await hook["chat.message"]({ sessionID: "main-session", agent: "chief" }, output)

    // then
    expect(startLoopCalls).toHaveLength(0)
    expect(output.parts[0]?.text).toContain("what is deepwork?")
  })

  test("#given non-dw message #when chat.message fires #then cortex-loop startLoop is not invoked", async () => {
    // given
    setMainSession("main-session")
    const startLoopCalls: StartLoopCall[] = []
    const cortexLoop = createMockCortexLoop(startLoopCalls)
    const hook = createKeywordDetectorHook(createMockPluginInput(), undefined, cortexLoop)
    const output = {
      message: {} as Record<string, unknown>,
      parts: [{ type: "text", text: "just a normal message" }],
    }

    // when
    await hook["chat.message"]({ sessionID: "main-session", agent: "chief" }, output)

    // then
    expect(startLoopCalls).toHaveLength(0)
  })

  test("#given dw keyword with planner agent #when chat.message fires #then cortex-loop startLoop is not invoked", async () => {
    // given
    setMainSession("main-session")
    const startLoopCalls: StartLoopCall[] = []
    const cortexLoop = createMockCortexLoop(startLoopCalls)
    const hook = createKeywordDetectorHook(createMockPluginInput(), undefined, cortexLoop)
    const output = {
      message: {} as Record<string, unknown>,
      parts: [{ type: "text", text: "dw plan this feature" }],
    }

    // when
    await hook["chat.message"]({ sessionID: "main-session", agent: "planner" }, output)

    // then
    expect(startLoopCalls).toHaveLength(0)
  })

  test("#given dw keyword with non-OMX agent #when chat.message fires #then cortex-loop startLoop is not invoked", async () => {
    // given
    setMainSession("main-session")
    const startLoopCalls: StartLoopCall[] = []
    const cortexLoop = createMockCortexLoop(startLoopCalls)
    const hook = createKeywordDetectorHook(createMockPluginInput(), undefined, cortexLoop)
    const output = {
      message: {} as Record<string, unknown>,
      parts: [{ type: "text", text: "dw build feature" }],
    }

    // when
    await hook["chat.message"]({ sessionID: "main-session", agent: "OpenCode-Builder" }, output)

    // then
    expect(startLoopCalls).toHaveLength(0)
  })

  test("#given dw keyword without cortexLoop dependency #when chat.message fires #then no error is thrown and prompt is still injected", async () => {
    // given
    setMainSession("main-session")
    const hook = createKeywordDetectorHook(createMockPluginInput())
    const output = {
      message: {} as Record<string, unknown>,
      parts: [{ type: "text", text: "dw do this" }],
    }

    // when
    await hook["chat.message"]({ sessionID: "main-session", agent: "chief" }, output)

    // then
    const textPart = output.parts.find((p) => p.type === "text")
    expect(textPart!.text).toContain("YOU MUST LEVERAGE ALL AVAILABLE AGENTS")
    expect(textPart!.text).toContain("do this")
  })

  test("#given partial 'dw' substring in StatefulWidget #when chat.message fires #then cortex-loop startLoop is not invoked", async () => {
    // given
    _resetForTesting()
    const startLoopCalls: StartLoopCall[] = []
    const cortexLoop = createMockCortexLoop(startLoopCalls)
    const hook = createKeywordDetectorHook(createMockPluginInput(), undefined, cortexLoop)
    const output = {
      message: {} as Record<string, unknown>,
      parts: [{ type: "text", text: "refactor the StatefulWidget component" }],
    }

    // when
    await hook["chat.message"]({ sessionID: "any-session", agent: "chief" }, output)

    // then
    expect(startLoopCalls).toHaveLength(0)
  })

  test("#given dw keyword inside system-reminder block #when chat.message fires #then cortex-loop startLoop is not invoked", async () => {
    // given
    setMainSession("main-session")
    const startLoopCalls: StartLoopCall[] = []
    const cortexLoop = createMockCortexLoop(startLoopCalls)
    const hook = createKeywordDetectorHook(createMockPluginInput(), undefined, cortexLoop)
    const output = {
      message: {} as Record<string, unknown>,
      parts: [{
        type: "text",
        text: `<system-reminder>
The system mentions dw mode in passing.
</system-reminder>`,
      }],
    }

    // when
    await hook["chat.message"]({ sessionID: "main-session", agent: "chief" }, output)

    // then
    expect(startLoopCalls).toHaveLength(0)
  })

  test("#given dw keyword #when chat.message fires #then prompt is injected as before without starting cortex loop", async () => {
    // given
    setMainSession("main-session")
    const startLoopCalls: StartLoopCall[] = []
    const cortexLoop = createMockCortexLoop(startLoopCalls)
    const hook = createKeywordDetectorHook(createMockPluginInput(), undefined, cortexLoop)
    const output = {
      message: {} as Record<string, unknown>,
      parts: [{ type: "text", text: "dw refactor the codebase" }],
    }

    // when
    await hook["chat.message"]({ sessionID: "main-session", agent: "chief" }, output)

    // then
    const textPart = output.parts.find((p) => p.type === "text")
    expect(textPart!.text).toContain("YOU MUST LEVERAGE ALL AVAILABLE AGENTS")
    expect(textPart!.text).toContain("refactor the codebase")
    expect(startLoopCalls).toHaveLength(0)
  })
})
