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

const { createCheckpointCounterHook } = await import("./hook")
const { CHECKPOINT_THRESHOLD, CHECKPOINT_COMMAND_MARKER, CHECKPOINT_PROMPT } = await import("./constants")

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

describe("createCheckpointCounterHook", () => {
  beforeEach(() => {
    subagentSessionsSet.clear()
  })

  describe("#given messages below threshold", () => {
    test("#when fewer than 20 messages sent #then does not inject checkpoint prompt", async () => {
      // given
      const hook = createCheckpointCounterHook()
      const sessionID = "ses_below_threshold"

      // when - send 19 messages (below threshold of 20)
      let lastOutput: HookOutput = createOutput("")
      for (let i = 0; i < CHECKPOINT_THRESHOLD - 1; i++) {
        lastOutput = createOutput(`Message ${i + 1}`)
        await hook["chat.message"](createInput(sessionID), lastOutput)
      }

      // then - last message is not modified
      expect(lastOutput.parts[0].text).toBe(`Message ${CHECKPOINT_THRESHOLD - 1}`)
    })

    test("#when first message is sent #then does not inject checkpoint prompt", async () => {
      // given
      const hook = createCheckpointCounterHook()
      const input = createInput("ses_first_msg")
      const originalText = "Hello, help me with something"
      const output = createOutput(originalText)

      // when
      await hook["chat.message"](input, output)

      // then
      expect(output.parts[0].text).toBe(originalText)
    })
  })

  describe("#given messages reaching threshold", () => {
    test("#when exactly 20 messages sent #then injects checkpoint prompt on the 20th", async () => {
      // given
      const hook = createCheckpointCounterHook()
      const sessionID = "ses_at_threshold"

      // send 19 messages without injection
      for (let i = 0; i < CHECKPOINT_THRESHOLD - 1; i++) {
        await hook["chat.message"](createInput(sessionID), createOutput(`Msg ${i + 1}`))
      }

      // when - send the 20th message
      const thresholdOutput = createOutput("This is message 20")
      await hook["chat.message"](createInput(sessionID), thresholdOutput)

      // then - checkpoint prompt is injected
      expect(thresholdOutput.parts[0].text).toStartWith(CHECKPOINT_PROMPT)
      expect(thresholdOutput.parts[0].text).toContain("This is message 20")
    })

    test("#when threshold is reached #then counter resets and next cycle starts fresh", async () => {
      // given
      const hook = createCheckpointCounterHook()
      const sessionID = "ses_reset_cycle"

      // reach threshold (20 messages)
      for (let i = 0; i < CHECKPOINT_THRESHOLD; i++) {
        await hook["chat.message"](createInput(sessionID), createOutput(`Cycle1 msg ${i + 1}`))
      }

      // when - send message 21 (first of new cycle)
      const postResetOutput = createOutput("First message after reset")
      await hook["chat.message"](createInput(sessionID), postResetOutput)

      // then - no injection (counter reset to 0, now at 1)
      expect(postResetOutput.parts[0].text).toBe("First message after reset")
    })

    test("#when second cycle reaches threshold #then injects again", async () => {
      // given
      const hook = createCheckpointCounterHook()
      const sessionID = "ses_second_cycle"

      // first cycle: 20 messages
      for (let i = 0; i < CHECKPOINT_THRESHOLD; i++) {
        await hook["chat.message"](createInput(sessionID), createOutput(`C1 msg ${i + 1}`))
      }

      // second cycle: 19 messages without injection
      for (let i = 0; i < CHECKPOINT_THRESHOLD - 1; i++) {
        await hook["chat.message"](createInput(sessionID), createOutput(`C2 msg ${i + 1}`))
      }

      // when - 20th message of second cycle
      const secondThresholdOutput = createOutput("Second cycle threshold")
      await hook["chat.message"](createInput(sessionID), secondThresholdOutput)

      // then - checkpoint injected again
      expect(secondThresholdOutput.parts[0].text).toStartWith(CHECKPOINT_PROMPT)
      expect(secondThresholdOutput.parts[0].text).toContain("Second cycle threshold")
    })
  })

  describe("#given force checkpoint command", () => {
    test("#when message contains force checkpoint marker #then injects checkpoint immediately", async () => {
      // given
      const hook = createCheckpointCounterHook()
      const input = createInput("ses_force")
      const output = createOutput(`Please do a ${CHECKPOINT_COMMAND_MARKER} now`)

      // when
      await hook["chat.message"](input, output)

      // then
      expect(output.parts[0].text).toStartWith(CHECKPOINT_PROMPT)
      expect(output.parts[0].text).toContain(CHECKPOINT_COMMAND_MARKER)
    })

    test("#when force checkpoint is triggered #then counter resets to 0", async () => {
      // given
      const hook = createCheckpointCounterHook()
      const sessionID = "ses_force_reset"

      // send 10 messages to build up counter
      for (let i = 0; i < 10; i++) {
        await hook["chat.message"](createInput(sessionID), createOutput(`Msg ${i + 1}`))
      }

      // force checkpoint
      await hook["chat.message"](
        createInput(sessionID),
        createOutput(`${CHECKPOINT_COMMAND_MARKER}`)
      )

      // when - send 19 more messages (should not trigger since counter reset)
      let lastOutput: HookOutput = createOutput("")
      for (let i = 0; i < CHECKPOINT_THRESHOLD - 1; i++) {
        lastOutput = createOutput(`Post-force msg ${i + 1}`)
        await hook["chat.message"](createInput(sessionID), lastOutput)
      }

      // then - no injection at message 19 (counter was reset by force)
      expect(lastOutput.parts[0].text).toBe(`Post-force msg ${CHECKPOINT_THRESHOLD - 1}`)
    })
  })

  describe("#given session isolation", () => {
    test("#when different sessions have different counts #then each session tracks independently", async () => {
      // given
      const hook = createCheckpointCounterHook()

      // session A: send 19 messages
      for (let i = 0; i < CHECKPOINT_THRESHOLD - 1; i++) {
        await hook["chat.message"](createInput("ses_iso_A"), createOutput(`A msg ${i + 1}`))
      }

      // session B: send 5 messages
      for (let i = 0; i < 5; i++) {
        await hook["chat.message"](createInput("ses_iso_B"), createOutput(`B msg ${i + 1}`))
      }

      // when - session A sends its 20th message
      const outputA = createOutput("A threshold message")
      await hook["chat.message"](createInput("ses_iso_A"), outputA)

      // and session B sends its 6th message
      const outputB = createOutput("B regular message")
      await hook["chat.message"](createInput("ses_iso_B"), outputB)

      // then - A gets checkpoint, B does not
      expect(outputA.parts[0].text).toStartWith(CHECKPOINT_PROMPT)
      expect(outputB.parts[0].text).toBe("B regular message")
    })
  })

  describe("#given a system directive message", () => {
    test("#when message starts with system directive prefix #then skips counting and injection", async () => {
      // given
      const hook = createCheckpointCounterHook()
      const input = createInput("ses_system_cp")
      const systemText = "[SYSTEM DIRECTIVE: OH-MY-CORTEX - TODO CONTINUATION] Keep working."
      const output = createOutput(systemText)

      // when
      await hook["chat.message"](input, output)

      // then
      expect(output.parts[0].text).toBe(systemText)
    })
  })

  describe("#given a subagent session", () => {
    test("#when sessionID is in subagentSessions #then skips counting and injection", async () => {
      // given
      const hook = createCheckpointCounterHook()
      const sessionID = "ses_subagent_cp"
      subagentSessionsSet.add(sessionID)
      const input = createInput(sessionID)
      const originalText = "Do this task for me"
      const output = createOutput(originalText)

      // when
      await hook["chat.message"](input, output)

      // then
      expect(output.parts[0].text).toBe(originalText)
    })
  })

  describe("#given output with no text parts", () => {
    test("#when parts have no text type #then does nothing", async () => {
      // given
      const hook = createCheckpointCounterHook()
      const input = createInput("ses_no_text_cp")
      const output: HookOutput = {
        message: {},
        parts: [{ type: "image", data: "base64..." }],
      }

      // when - even at threshold, no crash
      for (let i = 0; i < CHECKPOINT_THRESHOLD; i++) {
        await hook["chat.message"](createInput("ses_no_text_cp"), output)
      }

      // then
      expect(output.parts[0].type).toBe("image")
      expect(output.parts[0].text).toBeUndefined()
    })
  })

  describe("#given injection format", () => {
    test("#when injecting #then format is checkpointPrompt + separator + original text", async () => {
      // given
      const hook = createCheckpointCounterHook()
      const sessionID = "ses_format_cp"
      const originalText = "Working on something"

      // reach threshold
      for (let i = 0; i < CHECKPOINT_THRESHOLD - 1; i++) {
        await hook["chat.message"](createInput(sessionID), createOutput(`Msg ${i + 1}`))
      }

      // when - threshold message
      const output = createOutput(originalText)
      await hook["chat.message"](createInput(sessionID), output)

      // then
      expect(output.parts[0].text).toBe(`${CHECKPOINT_PROMPT}\n\n---\n\n${originalText}`)
    })
  })
})
