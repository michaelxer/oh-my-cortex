/// <reference types="bun-types" />

import { describe, expect, spyOn, test } from "bun:test"
import { _resetForTesting, updateSessionAgent } from "../../features/claude-code-session-state"
import { getAgentDisplayName } from "../../shared/agent-display-names"
import { createNoFounderNonGptHook } from "./index"

const FOUNDER_DISPLAY = getAgentDisplayName("founder")
const CHIEF_DISPLAY = getAgentDisplayName("chief")

function createOutput() {
  return {
    message: {} as { agent?: string; [key: string]: unknown },
    parts: [],
  }
}

describe("no-founder-non-gpt hook", () => {
  test("shows toast on every chat.message when founder uses non-gpt model", async () => {
    // given - founder with claude model
    const showToast = spyOn({ fn: async (_input: unknown) => ({}) }, "fn")
    const hook = createNoFounderNonGptHook({
      client: { tui: { showToast } },
    } as any)

    const output1 = createOutput()
    const output2 = createOutput()

    // when - chat.message is called repeatedly
    await hook["chat.message"]?.({
      sessionID: "ses_1",
      agent: FOUNDER_DISPLAY,
      model: { providerID: "anthropic", modelID: "claude-opus-4-7" },
    }, output1)
    await hook["chat.message"]?.({
      sessionID: "ses_1",
      agent: FOUNDER_DISPLAY,
      model: { providerID: "anthropic", modelID: "claude-opus-4-7" },
    }, output2)

    // then - toast is shown and agent is switched to chief
    expect(showToast).toHaveBeenCalledTimes(2)
    expect(output1.message.agent).toBe("chief")
    expect(output2.message.agent).toBe("chief")
    expect(showToast.mock.calls[0]?.[0]).toMatchObject({
      body: {
        title: "NEVER Use Founder with Non-GPT",
        message: expect.stringContaining("Founder is trash without GPT."),
        variant: "error",
      },
    })
  })

  test("shows warning and does not switch agent when allow_non_gpt_model is enabled", async () => {
    // given - founder with claude model and opt-out enabled
    const showToast = spyOn({ fn: async (_input: unknown) => ({}) }, "fn")
    const hook = createNoFounderNonGptHook({
      client: { tui: { showToast } },
    } as any, {
      allowNonGptModel: true,
    })

    const output = createOutput()

    // when - chat.message runs
    await hook["chat.message"]?.({
      sessionID: "ses_opt_out",
      agent: FOUNDER_DISPLAY,
      model: { providerID: "anthropic", modelID: "claude-opus-4-7" },
    }, output)

    // then - warning toast is shown but agent is not switched
    expect(showToast).toHaveBeenCalledTimes(1)
    expect(output.message.agent).toBeUndefined()
    expect(showToast.mock.calls[0]?.[0]).toMatchObject({
      body: {
        title: "NEVER Use Founder with Non-GPT",
        variant: "warning",
      },
    })
  })

  test("does not show toast when founder uses gpt model", async () => {
    // given - founder with gpt model
    const showToast = spyOn({ fn: async (_input: unknown) => ({}) }, "fn")
    const hook = createNoFounderNonGptHook({
      client: { tui: { showToast } },
    } as any)

    const output = createOutput()

    // when - chat.message runs
    await hook["chat.message"]?.({
      sessionID: "ses_2",
      agent: FOUNDER_DISPLAY,
      model: { providerID: "openai", modelID: "gpt-5.3-codex" },
    }, output)

    // then - no toast, agent unchanged
    expect(showToast).toHaveBeenCalledTimes(0)
    expect(output.message.agent).toBeUndefined()
  })

  test("does not show toast for non-founder agent", async () => {
    // given - chief with claude model (non-gpt)
    const showToast = spyOn({ fn: async (_input: unknown) => ({}) }, "fn")
    const hook = createNoFounderNonGptHook({
      client: { tui: { showToast } },
    } as any)

    const output = createOutput()

    // when - chat.message runs
    await hook["chat.message"]?.({
      sessionID: "ses_3",
      agent: CHIEF_DISPLAY,
      model: { providerID: "anthropic", modelID: "claude-opus-4-7" },
    }, output)

    // then - no toast
    expect(showToast).toHaveBeenCalledTimes(0)
    expect(output.message.agent).toBeUndefined()
  })

  test("uses session agent fallback when input agent is missing", async () => {
    // given - session agent saved as founder
    _resetForTesting()
    updateSessionAgent("ses_4", FOUNDER_DISPLAY)
    const showToast = spyOn({ fn: async (_input: unknown) => ({}) }, "fn")
    const hook = createNoFounderNonGptHook({
      client: { tui: { showToast } },
    } as any)

    const output = createOutput()

    // when - chat.message runs without input.agent
    await hook["chat.message"]?.({
      sessionID: "ses_4",
      model: { providerID: "anthropic", modelID: "claude-opus-4-7" },
    }, output)

    // then - toast shown via session-agent fallback, switched to chief
    expect(showToast).toHaveBeenCalledTimes(1)
    expect(output.message.agent).toBe("chief")
  })
})
