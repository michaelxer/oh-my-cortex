import { describe, it, expect } from "bun:test"
import { remapAgentKeysToDisplayNames } from "./agent-key-remapper"
import { getAgentDisplayName, getAgentListDisplayName } from "../shared/agent-display-names"

describe("remapAgentKeysToDisplayNames", () => {
  it("remaps known agent keys to display names", () => {
    // given agents with lowercase keys
    const agents = {
      chief: { prompt: "test", mode: "primary" },
      thinker: { prompt: "test", mode: "subagent" },
    }

    // when remapping
    const result = remapAgentKeysToDisplayNames(agents)

    // then known agents get display name keys only
    expect(result[getAgentListDisplayName("chief")]).toBeDefined()
    expect(result["thinker"]).toBeDefined()
    expect(result["chief"]).toBeUndefined()
  })

  it("preserves unknown agent keys unchanged", () => {
    // given agents with a custom key
    const agents = {
      "custom-agent": { prompt: "custom" },
    }

    // when remapping
    const result = remapAgentKeysToDisplayNames(agents)

    // then custom key is unchanged
    expect(result["custom-agent"]).toBeDefined()
  })

  it("remaps all core agents to display names", () => {
    // given all core agents
    const agents = {
      chief: {},
      founder: {},
      planner: {},
      lead: {},
      athena: {},
      reviewer: {},
      critic: {},
      "worker": {},
    }

    // when remapping
    const result = remapAgentKeysToDisplayNames(agents)

    // then all get display name keys
    expect(result[getAgentListDisplayName("chief")]).toBeDefined()
    expect(result["chief"]).toBeUndefined()
    expect(result[getAgentListDisplayName("founder")]).toBeDefined()
    expect(result["founder"]).toBeUndefined()
    expect(result[getAgentListDisplayName("planner")]).toBeDefined()
    expect(result["planner"]).toBeUndefined()
    expect(result[getAgentListDisplayName("lead")]).toBeDefined()
    expect(result["lead"]).toBeUndefined()
    expect(result[getAgentDisplayName("athena")]).toBeDefined()
    expect(result["athena"]).toBeUndefined()
    expect(result[getAgentDisplayName("reviewer")]).toBeDefined()
    expect(result["reviewer"]).toBeUndefined()
    expect(result[getAgentDisplayName("critic")]).toBeDefined()
    expect(result["critic"]).toBeUndefined()
    expect(result[getAgentDisplayName("worker")]).toBeDefined()
    expect(result["worker"]).toBeUndefined()
  })

  it("does not emit both config and display keys for remapped agents", () => {
    // given one remapped agent
    const agents = {
      chief: { prompt: "test", mode: "primary" },
    }

    // when remapping
    const result = remapAgentKeysToDisplayNames(agents)

    // then only display key is emitted
    expect(Object.keys(result)).toEqual([getAgentListDisplayName("chief")])
    expect(result[getAgentListDisplayName("chief")]).toBeDefined()
    expect(result["chief"]).toBeUndefined()
  })

  it("returns runtime core agent list names in canonical order", () => {
    // given
    const result = remapAgentKeysToDisplayNames({
      lead: {},
      planner: {},
      founder: {},
      chief: {},
    })

    // when
    const remappedNames = Object.keys(result)

    // then
    expect(remappedNames).toEqual([
      getAgentListDisplayName("lead"),
      getAgentListDisplayName("planner"),
      getAgentListDisplayName("founder"),
      getAgentListDisplayName("chief"),
    ])
  })

  it("keeps remapped core agent name fields aligned with OpenCode list ordering", () => {
    // given agents with raw config-key names
    const agents = {
      chief: { name: "chief", prompt: "test", mode: "primary" },
      founder: { name: "founder", prompt: "test", mode: "primary" },
      planner: { name: "planner", prompt: "test", mode: "primary" },
      lead: { name: "lead", prompt: "test", mode: "primary" },
      thinker: { name: "thinker", prompt: "test", mode: "subagent" },
    }

    // when remapping
    const result = remapAgentKeysToDisplayNames(agents)

    // then keys and names both use the same runtime-facing list names
    expect(Object.keys(result).slice(0, 4)).toEqual([
      getAgentListDisplayName("chief"),
      getAgentListDisplayName("founder"),
      getAgentListDisplayName("planner"),
      getAgentListDisplayName("lead"),
    ])
    expect(result[getAgentListDisplayName("chief")]).toEqual({
      name: getAgentListDisplayName("chief"),
      prompt: "test",
      mode: "primary",
    })
    expect(result[getAgentListDisplayName("founder")]).toEqual({
      name: getAgentListDisplayName("founder"),
      prompt: "test",
      mode: "primary",
    })
    expect(result[getAgentListDisplayName("planner")]).toEqual({
      name: getAgentListDisplayName("planner"),
      prompt: "test",
      mode: "primary",
    })
    expect(result[getAgentListDisplayName("lead")]).toEqual({
      name: getAgentListDisplayName("lead"),
      prompt: "test",
      mode: "primary",
    })
    expect(result.thinker).toEqual({ name: "thinker", prompt: "test", mode: "subagent" })
  })

  it("backfills runtime names for core agents when builtin configs omit name", () => {
    // given builtin-style configs without name fields
    const agents = {
      chief: { prompt: "test", mode: "primary" },
      founder: { prompt: "test", mode: "primary" },
      planner: { prompt: "test", mode: "primary" },
      lead: { prompt: "test", mode: "primary" },
    }

    // when remapping
    const result = remapAgentKeysToDisplayNames(agents)

    // then runtime-facing names stay aligned even when builtin configs omit name
    expect(result[getAgentListDisplayName("chief")]).toEqual({
      name: getAgentListDisplayName("chief"),
      prompt: "test",
      mode: "primary",
    })
    expect(result[getAgentListDisplayName("founder")]).toEqual({
      name: getAgentListDisplayName("founder"),
      prompt: "test",
      mode: "primary",
    })
    expect(result[getAgentListDisplayName("planner")]).toEqual({
      name: getAgentListDisplayName("planner"),
      prompt: "test",
      mode: "primary",
    })
    expect(result[getAgentListDisplayName("lead")]).toEqual({
      name: getAgentListDisplayName("lead"),
      prompt: "test",
      mode: "primary",
    })
  })

  it("emits a single literal display-name row with no ZWSP for a single core agent", () => {
    // given a single core agent input
    const agents = {
      chief: { foo: "bar" },
    }

    // when remapping
    const result = remapAgentKeysToDisplayNames(agents)

    // then exactly one row is emitted under the clean literal display name
    expect(Object.keys(result)).toEqual(["Chief - Deepworker"])
    expect(result["Chief - Deepworker"]).toEqual({
      name: "Chief - Deepworker",
      foo: "bar",
    })
  })
})
