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

const { createDomainLensHook } = await import("./hook")
const { DOMAIN_CAUTION_PROMPTS, LENS_COMMAND_MARKER } = await import("./constants")

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

describe("createDomainLensHook", () => {
  beforeEach(() => {
    subagentSessionsSet.clear()
  })

  describe("#given text with auto-detected domain keywords", () => {
    test("#when text contains health keyword #then injects health caution prompt", async () => {
      // given
      const hook = createDomainLensHook()
      const input = createInput("ses_health_auto")
      const output = createOutput("What medication should I take for this?")

      // when
      await hook["chat.message"](input, output)

      // then
      expect(output.parts[0].text).toStartWith(DOMAIN_CAUTION_PROMPTS.health)
      expect(output.parts[0].text).toContain("What medication should I take for this?")
    })

    test("#when text contains legal keyword #then injects legal caution prompt", async () => {
      // given
      const hook = createDomainLensHook()
      const input = createInput("ses_legal_auto")
      const output = createOutput("I want to file a lawsuit against my employer")

      // when
      await hook["chat.message"](input, output)

      // then
      expect(output.parts[0].text).toStartWith(DOMAIN_CAUTION_PROMPTS.legal)
      expect(output.parts[0].text).toContain("I want to file a lawsuit against my employer")
    })

    test("#when text contains financial keyword #then injects financial caution prompt", async () => {
      // given
      const hook = createDomainLensHook()
      const input = createInput("ses_financial_auto")
      const output = createOutput("Should I put my savings into this investment?")

      // when
      await hook["chat.message"](input, output)

      // then
      expect(output.parts[0].text).toStartWith(DOMAIN_CAUTION_PROMPTS.financial)
    })

    test("#when text contains security keyword #then injects security caution prompt", async () => {
      // given
      const hook = createDomainLensHook()
      const input = createInput("ses_security_auto")
      const output = createOutput("We discovered a vulnerability in our API")

      // when
      await hook["chat.message"](input, output)

      // then
      expect(output.parts[0].text).toStartWith(DOMAIN_CAUTION_PROMPTS.security)
    })

    test("#when text contains political keyword #then injects political caution prompt", async () => {
      // given
      const hook = createDomainLensHook()
      const input = createInput("ses_political_auto")
      const output = createOutput("The election results are being contested")

      // when
      await hook["chat.message"](input, output)

      // then
      expect(output.parts[0].text).toStartWith(DOMAIN_CAUTION_PROMPTS.political)
    })
  })

  describe("#given text without domain keywords", () => {
    test("#when text is generic #then does not inject any caution prompt", async () => {
      // given
      const hook = createDomainLensHook()
      const input = createInput("ses_generic")
      const originalText = "Help me write a Python function"
      const output = createOutput(originalText)

      // when
      await hook["chat.message"](input, output)

      // then
      expect(output.parts[0].text).toBe(originalText)
    })
  })

  describe("#given a manual lens command", () => {
    test("#when lens command sets security #then stores override and does not inject on command message", async () => {
      // given
      const hook = createDomainLensHook()
      const sessionID = "ses_manual_cmd"
      const commandText = `${LENS_COMMAND_MARKER} security`
      const output = createOutput(commandText)

      // when
      await hook["chat.message"](createInput(sessionID), output)

      // then - command message is not modified (early return after storing)
      expect(output.parts[0].text).toBe(commandText)
    })

    test("#when manual override is set #then subsequent messages use override domain regardless of content", async () => {
      // given
      const hook = createDomainLensHook()
      const sessionID = "ses_manual_persist"

      // set manual override to security
      const cmdOutput = createOutput(`${LENS_COMMAND_MARKER} security`)
      await hook["chat.message"](createInput(sessionID), cmdOutput)

      // when - next message has no security keywords
      const nextOutput = createOutput("How do I write a for loop?")
      await hook["chat.message"]({ sessionID }, nextOutput)

      // then - security caution is still injected due to manual override
      expect(nextOutput.parts[0].text).toStartWith(DOMAIN_CAUTION_PROMPTS.security)
      expect(nextOutput.parts[0].text).toContain("How do I write a for loop?")
    })

    test("#when manual override is set to health #then health caution is injected even for non-health text", async () => {
      // given
      const hook = createDomainLensHook()
      const sessionID = "ses_manual_health"

      // set manual override to health
      const cmdOutput = createOutput(`${LENS_COMMAND_MARKER} health`)
      await hook["chat.message"](createInput(sessionID), cmdOutput)

      // when - next message is about coding
      const nextOutput = createOutput("Refactor this function")
      await hook["chat.message"]({ sessionID }, nextOutput)

      // then - health caution injected
      expect(nextOutput.parts[0].text).toStartWith(DOMAIN_CAUTION_PROMPTS.health)
    })
  })

  describe("#given session isolation", () => {
    test("#when different sessions have different overrides #then each session uses its own lens", async () => {
      // given
      const hook = createDomainLensHook()

      // session A: set to legal
      const cmdA = createOutput(`${LENS_COMMAND_MARKER} legal`)
      await hook["chat.message"](createInput("ses_iso_A"), cmdA)

      // session B: set to financial
      const cmdB = createOutput(`${LENS_COMMAND_MARKER} financial`)
      await hook["chat.message"](createInput("ses_iso_B"), cmdB)

      // when
      const outputA = createOutput("Tell me about this")
      await hook["chat.message"]({ sessionID: "ses_iso_A" }, outputA)

      const outputB = createOutput("Tell me about that")
      await hook["chat.message"]({ sessionID: "ses_iso_B" }, outputB)

      // then
      expect(outputA.parts[0].text).toStartWith(DOMAIN_CAUTION_PROMPTS.legal)
      expect(outputB.parts[0].text).toStartWith(DOMAIN_CAUTION_PROMPTS.financial)
    })
  })

  describe("#given a system directive message", () => {
    test("#when message starts with system directive prefix #then skips injection", async () => {
      // given
      const hook = createDomainLensHook()
      const input = createInput("ses_system_lens")
      const systemText = "[SYSTEM DIRECTIVE: OH-MY-CORTEX - TODO CONTINUATION] Check the medication dosage."
      const output = createOutput(systemText)

      // when
      await hook["chat.message"](input, output)

      // then
      expect(output.parts[0].text).toBe(systemText)
    })
  })

  describe("#given a subagent session", () => {
    test("#when sessionID is in subagentSessions #then skips injection", async () => {
      // given
      const hook = createDomainLensHook()
      const sessionID = "ses_subagent_lens"
      subagentSessionsSet.add(sessionID)
      const input = createInput(sessionID)
      const output = createOutput("We found a vulnerability in the system")

      // when
      await hook["chat.message"](input, output)

      // then
      expect(output.parts[0].text).toBe("We found a vulnerability in the system")
    })
  })

  describe("#given output with no text parts", () => {
    test("#when parts have no text type #then does nothing", async () => {
      // given
      const hook = createDomainLensHook()
      const input = createInput("ses_no_text_lens")
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

  describe("#given injection format", () => {
    test("#when injecting #then format is cautionPrompt + separator + original text", async () => {
      // given
      const hook = createDomainLensHook()
      const input = createInput("ses_format_lens")
      const originalText = "I need to file a lawsuit"
      const output = createOutput(originalText)

      // when
      await hook["chat.message"](input, output)

      // then
      expect(output.parts[0].text).toBe(`${DOMAIN_CAUTION_PROMPTS.legal}\n\n---\n\n${originalText}`)
    })
  })
})
