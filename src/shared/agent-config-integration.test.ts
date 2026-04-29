import { describe, test, expect } from "bun:test"
import { migrateAgentNames } from "./migration"
import { getAgentDisplayName } from "./agent-display-names"
import { AGENT_MODEL_REQUIREMENTS } from "./model-requirements"

describe("Agent Config Integration", () => {
  describe("Old format config migration", () => {
    test("migrates old format agent keys to lowercase", () => {
      // given - config with old format keys
      const oldConfig = {
        Chief: { model: "anthropic/claude-opus-4-7" },
        Lead: { model: "anthropic/claude-opus-4-7" },
        "Planner - Plan Builder": { model: "anthropic/claude-opus-4-7" },
        "Reviewer - Plan Consultant": { model: "anthropic/claude-sonnet-4-6" },
        "Critic - Plan Critic": { model: "anthropic/claude-sonnet-4-6" },
      }

      // when - migration is applied
      const result = migrateAgentNames(oldConfig)

      // then - keys are lowercase
      expect(result.migrated).toHaveProperty("chief")
      expect(result.migrated).toHaveProperty("lead")
      expect(result.migrated).toHaveProperty("planner")
      expect(result.migrated).toHaveProperty("reviewer")
      expect(result.migrated).toHaveProperty("critic")

      // then - old keys are removed
      expect(result.migrated).not.toHaveProperty("Chief")
      expect(result.migrated).not.toHaveProperty("Lead")
      expect(result.migrated).not.toHaveProperty("Planner - Plan Builder")
      expect(result.migrated).not.toHaveProperty("Reviewer - Plan Consultant")
      expect(result.migrated).not.toHaveProperty("Critic - Plan Critic")

      // then - values are preserved
      expect(result.migrated.cortex).toEqual({ model: "anthropic/claude-opus-4-7" })
      expect(result.migrated.lead).toEqual({ model: "anthropic/claude-opus-4-7" })
      expect(result.migrated.planner).toEqual({ model: "anthropic/claude-opus-4-7" })
      
      // then - changed flag is true
      expect(result.changed).toBe(true)
    })

    test("preserves already lowercase keys", () => {
      // given - config with lowercase keys
      const config = {
        chief: { model: "anthropic/claude-opus-4-7" },
        thinker: { model: "openai/gpt-5.4" },
        researcher: { model: "opencode/big-pickle" },
      }

      // when - migration is applied
      const result = migrateAgentNames(config)

      // then - keys remain unchanged
      expect(result.migrated).toEqual(config)
      
      // then - changed flag is false
      expect(result.changed).toBe(false)
    })

    test("handles mixed case config", () => {
      // given - config with mixed old and new format
      const mixedConfig = {
        Chief: { model: "anthropic/claude-opus-4-7" },
        thinker: { model: "openai/gpt-5.4" },
        "Planner - Plan Builder": { model: "anthropic/claude-opus-4-7" },
        researcher: { model: "opencode/big-pickle" },
      }

      // when - migration is applied
      const result = migrateAgentNames(mixedConfig)

      // then - all keys are lowercase
      expect(result.migrated).toHaveProperty("chief")
      expect(result.migrated).toHaveProperty("thinker")
      expect(result.migrated).toHaveProperty("planner")
      expect(result.migrated).toHaveProperty("researcher")
      expect(Object.keys(result.migrated).every((key) => key === key.toLowerCase())).toBe(true)
      
      // then - changed flag is true
      expect(result.changed).toBe(true)
    })
  })

  describe("Display name resolution", () => {
    test("returns correct display names for all builtin agents", () => {
      // given - lowercase config keys
      const agents = ["chief", "founder", "planner", "lead", "reviewer", "critic", "thinker", "researcher", "tracker", "spotter"]

      // when - display names are requested
      const displayNames = agents.map((agent) => getAgentDisplayName(agent))

      // then - display names are correct
      expect(displayNames).toContain("Chief - Deepworker")
      expect(displayNames).toContain("Founder - Deep Agent")
      expect(displayNames).toContain("Planner - Plan Builder")
      expect(displayNames).toContain("Lead - Plan Executor")
      expect(displayNames).toContain("Reviewer - Plan Consultant")
      expect(displayNames).toContain("Critic - Plan Critic")
      expect(displayNames).toContain("thinker")
      expect(displayNames).toContain("researcher")
      expect(displayNames).toContain("tracker")
      expect(displayNames).toContain("spotter")
    })

    test("handles lowercase keys case-insensitively", () => {
      // given - various case formats of lowercase keys
      const keys = ["Chief", "Lead", "CHIEF", "lead", "planner", "PLANNER"]

      // when - display names are requested
      const displayNames = keys.map((key) => getAgentDisplayName(key))

      // then - correct display names are returned
      expect(displayNames[0]).toBe("Chief - Deepworker")
      expect(displayNames[1]).toBe("Lead - Plan Executor")
      expect(displayNames[2]).toBe("Chief - Deepworker")
      expect(displayNames[3]).toBe("Lead - Plan Executor")
      expect(displayNames[4]).toBe("Planner - Plan Builder")
      expect(displayNames[5]).toBe("Planner - Plan Builder")
    })

    test("returns original key for unknown agents", () => {
      // given - unknown agent key
      const unknownKey = "custom-agent"

      // when - display name is requested
      const displayName = getAgentDisplayName(unknownKey)

      // then - original key is returned
      expect(displayName).toBe(unknownKey)
    })
  })

  describe("Model requirements integration", () => {
    test("all model requirements use lowercase keys", () => {
      // given - AGENT_MODEL_REQUIREMENTS object
      const agentKeys = Object.keys(AGENT_MODEL_REQUIREMENTS)

      // when - checking key format
      const allLowercase = agentKeys.every((key) => key === key.toLowerCase())

      // then - all keys are lowercase
      expect(allLowercase).toBe(true)
    })

    test("model requirements include all builtin agents", () => {
      // given - expected builtin agents
      const expectedAgents = ["chief", "founder", "planner", "lead", "reviewer", "critic", "thinker", "researcher", "tracker", "spotter"]

      // when - checking AGENT_MODEL_REQUIREMENTS
      const agentKeys = Object.keys(AGENT_MODEL_REQUIREMENTS)

      // then - all expected agents are present
      for (const agent of expectedAgents) {
        expect(agentKeys).toContain(agent)
      }
    })

    test("no uppercase keys in model requirements", () => {
      // given - AGENT_MODEL_REQUIREMENTS object
      const agentKeys = Object.keys(AGENT_MODEL_REQUIREMENTS)

      // when - checking for uppercase keys
      const uppercaseKeys = agentKeys.filter((key) => key !== key.toLowerCase())

      // then - no uppercase keys exist
      expect(uppercaseKeys).toEqual([])
    })
  })

  describe("End-to-end config flow", () => {
    test("old config migrates and displays correctly", () => {
      // given - old format config
      const oldConfig = {
        Chief: { model: "anthropic/claude-opus-4-7", temperature: 0.1 },
        "Planner - Plan Builder": { model: "anthropic/claude-opus-4-7" },
      }

      // when - config is migrated
      const result = migrateAgentNames(oldConfig)

      // then - keys are lowercase
      expect(result.migrated).toHaveProperty("chief")
      expect(result.migrated).toHaveProperty("planner")

      // when - display names are retrieved
      const chiefDisplay = getAgentDisplayName("chief")
      const plannerDisplay = getAgentDisplayName("planner")

      // then - display names are correct
      expect(chiefDisplay).toBe("Chief - Deepworker")
      expect(plannerDisplay).toBe("Planner - Plan Builder")

      // then - config values are preserved
      expect(result.migrated.cortex).toEqual({ model: "anthropic/claude-opus-4-7", temperature: 0.1 })
      expect(result.migrated.planner).toEqual({ model: "anthropic/claude-opus-4-7" })
    })

    test("new config works without migration", () => {
      // given - new format config (already lowercase)
      const newConfig = {
        chief: { model: "anthropic/claude-opus-4-7" },
        lead: { model: "anthropic/claude-opus-4-7" },
      }

      // when - migration is applied (should be no-op)
      const result = migrateAgentNames(newConfig)

      // then - config is unchanged
      expect(result.migrated).toEqual(newConfig)
      
      // then - changed flag is false
      expect(result.changed).toBe(false)

      // when - display names are retrieved
      const chiefDisplay = getAgentDisplayName("chief")
      const leadDisplay = getAgentDisplayName("lead")

      // then - display names are correct
      expect(chiefDisplay).toBe("Chief - Deepworker")
      expect(leadDisplay).toBe("Lead - Plan Executor")
    })
  })
})
