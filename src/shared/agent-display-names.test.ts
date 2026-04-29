import { describe, it, expect } from "bun:test"
import { AGENT_DISPLAY_NAMES, getAgentConfigKey, getAgentDisplayName, getAgentListDisplayName, normalizeAgentForPrompt, normalizeAgentForPromptKey, stripAgentListSortPrefix } from "./agent-display-names"

describe("getAgentDisplayName", () => {
  it("returns display name for lowercase config key (new format)", () => {
    // given config key "chief"
    const configKey = "chief"

    // when getAgentDisplayName called
    const result = getAgentDisplayName(configKey)

    // then returns "Chief - Deepworker"
    expect(result).toBe("Chief - Deepworker")
  })

  it("returns display name for uppercase config key (old format - case-insensitive)", () => {
    // given config key "Chief" (old format)
    const configKey = "Chief"

    // when getAgentDisplayName called
    const result = getAgentDisplayName(configKey)

    // then returns "Chief - Deepworker" (case-insensitive lookup)
    expect(result).toBe("Chief - Deepworker")
  })

  it("returns original key for unknown agents (fallback)", () => {
    // given config key "custom-agent"
    const configKey = "custom-agent"

    // when getAgentDisplayName called
    const result = getAgentDisplayName(configKey)

    // then returns "custom-agent" (original key unchanged)
    expect(result).toBe("custom-agent")
  })

  it("returns display name for lead", () => {
    // given config key "lead"
    const configKey = "lead"

    // when getAgentDisplayName called
    const result = getAgentDisplayName(configKey)

     // then returns "Lead - Plan Executor"
    expect(result).toBe("Lead - Plan Executor")
  })

  it("returns display name for planner", () => {
    // given config key "planner"
    const configKey = "planner"

    // when getAgentDisplayName called
    const result = getAgentDisplayName(configKey)

    // then returns "Planner - Plan Builder"
    expect(result).toBe("Planner - Plan Builder")
  })

  it("returns display name for worker", () => {
    // given config key "worker"
    const configKey = "worker"

    // when getAgentDisplayName called
    const result = getAgentDisplayName(configKey)

    // then returns "Worker"
    expect(result).toBe("Worker")
  })

  it("returns display name for reviewer", () => {
    // given config key "reviewer"
    const configKey = "reviewer"

    // when getAgentDisplayName called
    const result = getAgentDisplayName(configKey)

    // then returns "Reviewer - Plan Consultant"
    expect(result).toBe("Reviewer - Plan Consultant")
  })

  it("returns display name for critic", () => {
    // given config key "critic"
    const configKey = "critic"

    // when getAgentDisplayName called
    const result = getAgentDisplayName(configKey)

     // then returns "Critic - Plan Critic"
    expect(result).toBe("Critic - Plan Critic")
  })

  it("returns display name for thinker", () => {
    // given config key "thinker"
    const configKey = "thinker"

    // when getAgentDisplayName called
    const result = getAgentDisplayName(configKey)

    // then returns "thinker"
    expect(result).toBe("thinker")
  })

  it("returns display name for researcher", () => {
    // given config key "researcher"
    const configKey = "researcher"

    // when getAgentDisplayName called
    const result = getAgentDisplayName(configKey)

    // then returns "researcher"
    expect(result).toBe("researcher")
  })

  it("returns display name for tracker", () => {
    // given config key "tracker"
    const configKey = "tracker"

    // when getAgentDisplayName called
    const result = getAgentDisplayName(configKey)

    // then returns "tracker"
    expect(result).toBe("tracker")
  })

  it("returns display name for spotter", () => {
    // given config key "spotter"
    const configKey = "spotter"

    // when getAgentDisplayName called
    const result = getAgentDisplayName(configKey)

    // then returns "spotter"
    expect(result).toBe("spotter")
  })
})

describe("getAgentConfigKey", () => {
  it("resolves display name to config key", () => {
    // given display name "Chief - Deepworker"
    // when getAgentConfigKey called
    // then returns "chief"
    expect(getAgentConfigKey("Chief - Deepworker")).toBe("chief")
  })

  it("resolves display name case-insensitively", () => {
    // given display name in different case
    // when getAgentConfigKey called
    // then returns "lead"
    expect(getAgentConfigKey("lead - plan executor")).toBe("lead")
  })

  it("resolves legacy parenthesized display names", () => {
    // given legacy parenthesized display name from old configs/sessions
    // when getAgentConfigKey called
    // then resolves to canonical config key
    expect(getAgentConfigKey("Chief (Deepworker)")).toBe("chief")
    expect(getAgentConfigKey("Lead (Plan Executor)")).toBe("lead")
  })

  it("passes through lowercase config keys unchanged", () => {
    // given lowercase config key "planner"
    // when getAgentConfigKey called
    // then returns "planner"
    expect(getAgentConfigKey("planner")).toBe("planner")
  })

  it("returns lowercased unknown agents", () => {
    // given unknown agent name
    // when getAgentConfigKey called
    // then returns lowercased
    expect(getAgentConfigKey("Custom-Agent")).toBe("custom-agent")
  })

  it("resolves all core agent display names", () => {
    // given all core display names
    // when/then each resolves to its config key
    expect(getAgentConfigKey("Founder - Deep Agent")).toBe("founder")
    expect(getAgentConfigKey("Planner - Plan Builder")).toBe("planner")
    expect(getAgentConfigKey("Lead - Plan Executor")).toBe("lead")
    expect(getAgentConfigKey("Reviewer - Plan Consultant")).toBe("reviewer")
    expect(getAgentConfigKey("Critic - Plan Critic")).toBe("critic")
    expect(getAgentConfigKey("Worker")).toBe("worker")
  })

  it("resolves lead even when the UI ordering prefix is present", () => {
    expect(getAgentConfigKey(getAgentListDisplayName("lead"))).toBe("lead")
  })

  it("resolves display names even when zero-width characters are embedded", () => {
    expect(getAgentConfigKey("Chief\u200B - Deepworker")).toBe("chief")
    expect(getAgentConfigKey("\uFEFFLead - Plan Executor")).toBe("lead")
  })
})

describe("getAgentListDisplayName", () => {
  it("returns the canonical display name for the core agent list", () => {
    expect(getAgentListDisplayName("chief")).toBe("Chief - Deepworker")
    expect(getAgentListDisplayName("founder")).toBe("Founder - Deep Agent")
    expect(getAgentListDisplayName("planner")).toBe("Planner - Plan Builder")
    expect(getAgentListDisplayName("lead")).toBe("Lead - Plan Executor")
  })

  it("keeps non-core agents unchanged for list display", () => {
    expect(getAgentListDisplayName("thinker")).toBe("thinker")
  })

  it("is a thin alias for getAgentDisplayName", () => {
    expect(getAgentListDisplayName("chief")).toBe(getAgentDisplayName("chief"))
  })
})

describe("stripAgentListSortPrefix", () => {
  it("strips legacy zero-width sort prefixes baked into v3.14.0–v3.16.0 sessions", () => {
    expect(stripAgentListSortPrefix("\u200B\u200BFounder - Deep Agent")).toBe("Founder - Deep Agent")
  })
})

describe("normalizeAgentForPrompt", () => {
  it("strips core UI ordering prefixes back to canonical display names", () => {
    expect(normalizeAgentForPrompt(getAgentListDisplayName("chief"))).toBe("Chief - Deepworker")
    expect(normalizeAgentForPrompt(getAgentListDisplayName("founder"))).toBe("Founder - Deep Agent")
    expect(normalizeAgentForPrompt(getAgentListDisplayName("planner"))).toBe("Planner - Plan Builder")
    expect(normalizeAgentForPrompt(getAgentListDisplayName("lead"))).toBe("Lead - Plan Executor")
  })

  it("removes zero-width characters before returning canonical names", () => {
    expect(normalizeAgentForPrompt("Chief\u200B - Deepworker")).toBe("Chief - Deepworker")
  })

  it("converts legacy parenthesized names to canonical display names", () => {
    expect(normalizeAgentForPrompt("Lead (Plan Executor)")).toBe("Lead - Plan Executor")
  })
})

describe("normalizeAgentForPromptKey", () => {
  it("converts built-in display names to config keys", () => {
    expect(normalizeAgentForPromptKey("Chief (Deepworker)")).toBe("chief")
  })

  it("strips UI ordering prefixes before returning config keys", () => {
    expect(normalizeAgentForPromptKey(getAgentListDisplayName("lead"))).toBe("lead")
  })

  it("preserves custom agents", () => {
    expect(normalizeAgentForPromptKey("MyCustomAgent")).toBe("MyCustomAgent")
  })
})

describe("AGENT_DISPLAY_NAMES", () => {
  it("contains all expected agent mappings", () => {
    // given expected mappings
    const expectedMappings = {
      chief: "Chief - Deepworker",
      founder: "Founder - Deep Agent",
      planner: "Planner - Plan Builder",
      lead: "Lead - Plan Executor",
      "worker": "Worker",
      reviewer: "Reviewer - Plan Consultant",
      critic: "Critic - Plan Critic",
      athena: "Athena - Council",
      "athena-junior": "Athena-Junior - Council",
      thinker: "thinker",
      researcher: "researcher",
      tracker: "tracker",
      "spotter": "spotter",
      "council-member": "council-member",
    }

    // when checking the constant
    // then contains all expected mappings
    expect(AGENT_DISPLAY_NAMES).toEqual(expectedMappings)
  })

  it("all display names must be HTTP-header-safe (no parentheses)", () => {
    // given all agent display names
    const httpHeaderUnsafe = /[()]/

    // when checking each display name
    for (const [, displayName] of Object.entries(AGENT_DISPLAY_NAMES)) {
      // then none should contain parentheses
      expect(httpHeaderUnsafe.test(displayName)).toBe(false)
    }
  })
})
