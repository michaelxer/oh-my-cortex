/// <reference types="bun-types" />

import { describe, expect, spyOn, test } from "bun:test"
import type { PluginInput } from "@opencode-ai/plugin"
import { _resetForTesting, updateSessionAgent } from "../../features/claude-code-session-state"
import { getAgentDisplayName } from "../../shared/agent-display-names"
import { createNoChiefGptHook } from "./index"

const CHIEF_DISPLAY = getAgentDisplayName("chief")
const FOUNDER_DISPLAY = getAgentDisplayName("founder")

type HookOutput = {
  message: { agent?: string; variant?: string; [key: string]: unknown }
  parts: unknown[]
}

function createOutput(): HookOutput {
  return {
    message: {},
    parts: [],
  }
}

function createHookContext(showToast: (input: unknown) => Promise<unknown>): PluginInput {
  return {
    client: { tui: { showToast } },
  } as unknown as PluginInput
}

describe("no-chief-gpt hook", () => {
  test("shows toast on every chat.message when chief uses gpt model", async () => {
    // given - chief (display name) with gpt model
    const showToast = spyOn({ fn: async () => ({}) }, "fn")
    const hook = createNoChiefGptHook(createHookContext(showToast))

    const output1 = createOutput()
    const output2 = createOutput()

    // when - chat.message is called repeatedly with display name
    await hook["chat.message"]?.({
      sessionID: "ses_1",
      agent: CHIEF_DISPLAY,
      model: { providerID: "openai", modelID: "gpt-5.3-codex" },
    }, output1)
    await hook["chat.message"]?.({
      sessionID: "ses_1",
      agent: CHIEF_DISPLAY,
      model: { providerID: "openai", modelID: "gpt-5.3-codex" },
    }, output2)

    // then - toast is shown for every message
    expect(showToast).toHaveBeenCalledTimes(2)
    expect(output1.message.agent).toBe("founder")
    expect(output2.message.agent).toBe("founder")
    const firstToastCall = (showToast.mock.calls as Array<Array<unknown>>)[0]?.[0]
    expect(firstToastCall).toMatchObject({
      body: {
        title: "NEVER Use Chief with GPT",
        message: expect.stringContaining("For other GPT models, always use Founder."),
        variant: "error",
      },
    })
  })

  test("does not show toast for gpt-5.4 model (Chief has specialized support)", async () => {
    // given - chief with gpt-5.4 model (should be allowed)
    const showToast = spyOn({ fn: async () => ({}) }, "fn")
    const hook = createNoChiefGptHook(createHookContext(showToast))

    const output = createOutput()

    // when - chat.message runs with gpt-5.4
    await hook["chat.message"]?.({
      sessionID: "ses_gpt54",
      agent: CHIEF_DISPLAY,
      model: { providerID: "openai", modelID: "gpt-5.4" },
    }, output)

    // then - no toast, agent NOT switched to Founder
    expect(showToast).toHaveBeenCalledTimes(0)
    expect(output.message.agent).toBeUndefined()
  })

  test("does not show toast for gpt-5.5 model (native Chief support)", async () => {
    // given - chief with gpt-5.5 model (should be allowed)
    const showToast = spyOn({ fn: async () => ({}) }, "fn")
    const hook = createNoChiefGptHook(createHookContext(showToast))

    const output = createOutput()

    // when - chat.message runs with gpt-5.5
    await hook["chat.message"]?.({
      sessionID: "ses_gpt55",
      agent: CHIEF_DISPLAY,
      model: { providerID: "openai", modelID: "gpt-5.5" },
    }, output)

    // then - no toast, agent NOT switched to Founder
    expect(showToast).toHaveBeenCalledTimes(0)
    expect(output.message.agent).toBeUndefined()
  })

  test("sets medium variant for gpt-5.5 model when native Chief support is used", async () => {
    // given - chief with gpt-5.5 model and no selected variant
    const showToast = spyOn({ fn: async () => ({}) }, "fn")
    const hook = createNoChiefGptHook(createHookContext(showToast))

    const output = createOutput()

    // when - chat.message runs with gpt-5.5
    await hook["chat.message"]?.({
      sessionID: "ses_gpt55_medium",
      agent: CHIEF_DISPLAY,
      model: { providerID: "openai", modelID: "gpt-5.5" },
    }, output)

    // then - Chief stays active and receives its configured GPT-5.5 variant
    expect(showToast).toHaveBeenCalledTimes(0)
    expect(output.message.agent).toBeUndefined()
    expect(output.message.variant).toBe("medium")
  })

  test("preserves selected variant for gpt-5.5 model when native Chief support is used", async () => {
    // given - chief with gpt-5.5 model and a selected variant
    const showToast = spyOn({ fn: async () => ({}) }, "fn")
    const hook = createNoChiefGptHook(createHookContext(showToast))

    const output: HookOutput = { message: { variant: "high" }, parts: [] }

    // when - chat.message runs with gpt-5.5
    await hook["chat.message"]?.({
      sessionID: "ses_gpt55_high",
      agent: CHIEF_DISPLAY,
      model: { providerID: "openai", modelID: "gpt-5.5" },
    }, output)

    // then - user-selected variant is not overwritten
    expect(showToast).toHaveBeenCalledTimes(0)
    expect(output.message.agent).toBeUndefined()
    expect(output.message.variant).toBe("high")
  })

  test("does not show toast for non-gpt model", async () => {
    // given - chief with claude model
    const showToast = spyOn({ fn: async () => ({}) }, "fn")
    const hook = createNoChiefGptHook(createHookContext(showToast))

    const output = createOutput()

    // when - chat.message runs
    await hook["chat.message"]?.({
      sessionID: "ses_2",
      agent: CHIEF_DISPLAY,
      model: { providerID: "anthropic", modelID: "claude-opus-4-7" },
    }, output)

    // then - no toast
    expect(showToast).toHaveBeenCalledTimes(0)
    expect(output.message.agent).toBeUndefined()
  })

  test("does not show toast for non-chief agent", async () => {
    // given - founder with gpt model
    const showToast = spyOn({ fn: async () => ({}) }, "fn")
    const hook = createNoChiefGptHook(createHookContext(showToast))

    const output = createOutput()

    // when - chat.message runs
    await hook["chat.message"]?.({
      sessionID: "ses_3",
      agent: FOUNDER_DISPLAY,
      model: { providerID: "openai", modelID: "gpt-5.4" },
    }, output)

    // then - no toast
    expect(showToast).toHaveBeenCalledTimes(0)
    expect(output.message.agent).toBeUndefined()
  })

  test("uses session agent fallback when input agent is missing", async () => {
    // given - session agent saved with display name (as OpenCode stores it)
    _resetForTesting()
    updateSessionAgent("ses_4", CHIEF_DISPLAY)
    const showToast = spyOn({ fn: async () => ({}) }, "fn")
    const hook = createNoChiefGptHook(createHookContext(showToast))

    const output = createOutput()

    // when - chat.message runs without input.agent
    await hook["chat.message"]?.({
      sessionID: "ses_4",
      model: { providerID: "openai", modelID: "gpt-4o" },
    }, output)

    // then - toast shown via session-agent fallback
    expect(showToast).toHaveBeenCalledTimes(1)
    expect(output.message.agent).toBe("founder")
  })
})
