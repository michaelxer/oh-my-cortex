import { beforeEach, describe, expect, mock, test } from "bun:test"

mock.module("../../shared", () => ({
  log: () => {},
}))

mock.module("../../shared/system-directive", () => ({
  isSystemDirective: (text: string) => text.startsWith("[SYSTEM DIRECTIVE: OH-MY-CORTEX"),
}))

const subagentSessionsSet = new Set<string>()
mock.module("../../features/claude-code-session-state", () => ({
  subagentSessions: subagentSessionsSet,
}))

const { createChallengeEngineHook } = await import("./hook")
const { getLevelPrompt } = await import("./levels")
const { CHALLENGE_COMMAND_MARKER } = await import("./constants")

type HookInput = {
  sessionID: string
  agent?: string
  model?: { providerID: string; modelID: string }
}

type HookOutput = {
  message: Record<string, unknown>
  parts: Array<{ type: string; text?: string; [key: string]: unknown }>
}

function createInput(sessionID: string): HookInput {
  return { sessionID, agent: "chief", model: { providerID: "anthropic", modelID: "claude-opus-4-7" } }
}

function createOutput(text: string): HookOutput {
  return {
    message: {},
    parts: [{ type: "text", text }],
  }
}

describe("createChallengeEngineHook", () => {
  beforeEach(() => {
    subagentSessionsSet.clear()
  })

  describe("#given a new session with default level", () => {
    test("#when chat.message fires #then injects level 1 (Nudge) prompt", async () => {
      // given
      const hook = createChallengeEngineHook()
      const input = createInput("ses_default_1")
      const output = createOutput("Help me refactor this code")

      // when
      await hook["chat.message"](input, output)

      // then
      const expectedPrefix = getLevelPrompt(1)
      expect(output.parts[0].text).toStartWith(expectedPrefix)
      expect(output.parts[0].text).toContain("Help me refactor this code")
    })

    test("#when output has no text parts #then does nothing", async () => {
      // given
      const hook = createChallengeEngineHook()
      const input = createInput("ses_no_text")
      const output: HookOutput = {
        message: {},
        parts: [{ type: "image", data: "base64..." }],
      }

      // when
      await hook["chat.message"](input, output)

      // then
      expect(output.parts[0].type).toBe("image")
      expect(output.parts[0].text).toBeUndefined()
    })
  })

  describe("#given a challenge level command in the message", () => {
    test("#when level is set to 3 #then stores level and does not inject prompt", async () => {
      // given
      const hook = createChallengeEngineHook()
      const sessionID = "ses_cmd_level3"
      const commandText = `${CHALLENGE_COMMAND_MARKER} 3`
      const input = createInput(sessionID)
      const output = createOutput(commandText)

      // when
      await hook["chat.message"](input, output)

      // then - command message is not modified (early return after storing)
      expect(output.parts[0].text).toBe(commandText)
    })

    test("#when level is set to 3 then subsequent messages use level 3 prompt", async () => {
      // given
      const hook = createChallengeEngineHook()
      const sessionID = "ses_cmd_then_msg"

      // set level to 3
      const commandOutput = createOutput(`${CHALLENGE_COMMAND_MARKER} 3`)
      await hook["chat.message"](createInput(sessionID), commandOutput)

      // when - next message in same session
      const nextOutput = createOutput("What do you think about my plan?")
      await hook["chat.message"]({ sessionID, agent: "chief" }, nextOutput)

      // then - level 3 prompt injected
      const expectedPrefix = getLevelPrompt(3)
      expect(nextOutput.parts[0].text).toStartWith(expectedPrefix)
      expect(nextOutput.parts[0].text).toContain("What do you think about my plan?")
    })
  })

  describe("#given session isolation", () => {
    test("#when different sessions have different levels #then each session uses its own level", async () => {
      // given
      const hook = createChallengeEngineHook()

      // set session A to level 4
      const cmdOutputA = createOutput(`${CHALLENGE_COMMAND_MARKER} 4`)
      await hook["chat.message"](createInput("ses_A"), cmdOutputA)

      // set session B to level 2
      const cmdOutputB = createOutput(`${CHALLENGE_COMMAND_MARKER} 2`)
      await hook["chat.message"](createInput("ses_B"), cmdOutputB)

      // when - each session sends a message
      const outputA = createOutput("Analyze this")
      await hook["chat.message"]({ sessionID: "ses_A" }, outputA)

      const outputB = createOutput("Review this")
      await hook["chat.message"]({ sessionID: "ses_B" }, outputB)

      // then - each gets its own level prompt
      expect(outputA.parts[0].text).toStartWith(getLevelPrompt(4))
      expect(outputB.parts[0].text).toStartWith(getLevelPrompt(2))
    })
  })

  describe("#given a system directive message", () => {
    test("#when message starts with system directive prefix #then skips injection", async () => {
      // given
      const hook = createChallengeEngineHook()
      const input = createInput("ses_system")
      const systemText = "[SYSTEM DIRECTIVE: OH-MY-CORTEX - TODO CONTINUATION] Continue working."
      const output = createOutput(systemText)

      // when
      await hook["chat.message"](input, output)

      // then - text is unchanged
      expect(output.parts[0].text).toBe(systemText)
    })
  })

  describe("#given a subagent session", () => {
    test("#when sessionID is in subagentSessions #then skips injection", async () => {
      // given
      const hook = createChallengeEngineHook()
      const sessionID = "ses_subagent_1"
      subagentSessionsSet.add(sessionID)
      const input = createInput(sessionID)
      const output = createOutput("Do this task")

      // when
      await hook["chat.message"](input, output)

      // then - text is unchanged
      expect(output.parts[0].text).toBe("Do this task")
    })
  })

  describe("#given level prompt injection format", () => {
    test("#when injecting #then format is levelPrompt + separator + original text", async () => {
      // given
      const hook = createChallengeEngineHook()
      const input = createInput("ses_format_check")
      const originalText = "My question here"
      const output = createOutput(originalText)

      // when
      await hook["chat.message"](input, output)

      // then
      const expectedPrompt = getLevelPrompt(1)
      expect(output.parts[0].text).toBe(`${expectedPrompt}\n\n---\n\n${originalText}`)
    })
  })
})
