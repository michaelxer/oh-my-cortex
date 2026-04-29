/// <reference types="bun-types" />

import { describe, expect, test } from "bun:test"

import {
  reorderAgentsByPriority,
  CANONICAL_CORE_AGENT_ORDER,
} from "./agent-priority-order"
import { getAgentDisplayName, getAgentListDisplayName } from "../shared/agent-display-names"

describe("agent-priority-order", () => {
  describe("CANONICAL_CORE_AGENT_ORDER", () => {
    // given: The canonical order constant must exist and be correct

    test("exports canonical order as readonly array", () => {
      // then
      expect(CANONICAL_CORE_AGENT_ORDER).toBeDefined()
      expect(Array.isArray(CANONICAL_CORE_AGENT_ORDER)).toBe(true)
    })

    test("canonical order is exactly [chief, founder, planner, lead]", () => {
      // then
      expect(CANONICAL_CORE_AGENT_ORDER).toEqual([
        "chief",
        "founder",
        "planner",
        "lead",
      ])
    })

    test("canonical order length is exactly 4", () => {
      // then
      expect(CANONICAL_CORE_AGENT_ORDER).toHaveLength(4)
    })
  })

  describe("reorderAgentsByPriority", () => {
    // given: display names for all core agents
    const chief = getAgentListDisplayName("chief")
    const founder = getAgentListDisplayName("founder")
    const planner = getAgentListDisplayName("planner")
    const lead = getAgentListDisplayName("lead")
    const thinker = getAgentDisplayName("thinker")
    const researcher = getAgentDisplayName("researcher")
    const tracker = getAgentDisplayName("tracker")

    describe("#given agents in random order", () => {
      test("#when all core agents present #then orders as chief→founder→planner→lead", () => {
        // given: agents in reverse order
        const agents: Record<string, unknown> = {
          [lead]: { name: "lead" },
          [planner]: { name: "planner" },
          [founder]: { name: "founder" },
          [chief]: { name: "chief" },
        }

        // when
        const result = reorderAgentsByPriority(agents)

        // then
        const keys = Object.keys(result)
        expect(keys[0]).toBe(chief)
        expect(keys[1]).toBe(founder)
        expect(keys[2]).toBe(planner)
        expect(keys[3]).toBe(lead)
      })

      test("#when core agents mixed with non-core #then core agents come first in canonical order", () => {
        // given: mixed order with non-core agents interleaved
        const agents: Record<string, unknown> = {
          [thinker]: { name: "thinker" },
          [lead]: { name: "lead" },
          [researcher]: { name: "researcher" },
          [planner]: { name: "planner" },
          [tracker]: { name: "tracker" },
          [founder]: { name: "founder" },
          custom: { name: "custom" },
          [chief]: { name: "chief" },
        }

        // when
        const result = reorderAgentsByPriority(agents)

        // then
        const keys = Object.keys(result)
        expect(keys.slice(0, 4)).toEqual([chief, founder, planner, lead])
      })
    })

    describe("#given 100 random permutations", () => {
      test("#when reordered #then result is ALWAYS identical", () => {
        // given: base agent config
        const baseAgents = {
          [chief]: { name: "chief" },
          [founder]: { name: "founder" },
          [planner]: { name: "planner" },
          [lead]: { name: "lead" },
          [thinker]: { name: "thinker" },
          [researcher]: { name: "researcher" },
          custom1: { name: "custom1" },
          custom2: { name: "custom2" },
        }

        // given: shuffle function
        const shuffle = <T>(array: T[]): T[] => {
          const result = [...array]
          for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            ;[result[i], result[j]] = [result[j], result[i]]
          }
          return result
        }

        // when: run 100 times with different key orders
        const results: string[][] = []
        for (let i = 0; i < 100; i++) {
          const shuffledKeys = shuffle(Object.keys(baseAgents))
          const shuffledAgents: Record<string, unknown> = {}
          for (const key of shuffledKeys) {
            shuffledAgents[key] = baseAgents[key]
          }
          const result = reorderAgentsByPriority(shuffledAgents)
          results.push(Object.keys(result))
        }

        // then: all results should have identical key order
        const firstResult = results[0]
        for (let i = 1; i < results.length; i++) {
          expect(results[i]).toEqual(firstResult)
        }

        // then: core agents are always first 4 in canonical order
        expect(firstResult.slice(0, 4)).toEqual([
          chief,
          founder,
          planner,
          lead,
        ])
      })
    })

    describe("#given partial core agents", () => {
      test("#when only chief and lead present #then orders as chief→lead", () => {
        // given
        const agents: Record<string, unknown> = {
          [lead]: { name: "lead" },
          custom: { name: "custom" },
          [chief]: { name: "chief" },
        }

        // when
        const result = reorderAgentsByPriority(agents)

        // then
        const keys = Object.keys(result)
        const chiefIdx = keys.indexOf(chief)
        const leadIdx = keys.indexOf(lead)
        expect(chiefIdx).toBeLessThan(leadIdx)
        expect(chiefIdx).toBe(0)
      })

      test("#when only founder and planner present #then orders as founder→planner", () => {
        // given
        const agents: Record<string, unknown> = {
          [planner]: { name: "planner" },
          custom: { name: "custom" },
          [founder]: { name: "founder" },
        }

        // when
        const result = reorderAgentsByPriority(agents)

        // then
        const keys = Object.keys(result)
        const founderIdx = keys.indexOf(founder)
        const plannerIdx = keys.indexOf(planner)
        expect(founderIdx).toBeLessThan(plannerIdx)
        expect(founderIdx).toBe(0)
      })
    })

    describe("#given order field injection", () => {
      test("#when core agent is object #then injects order field", () => {
        // given
        const agents: Record<string, unknown> = {
          [chief]: { name: "chief", mode: "primary" },
          [founder]: { name: "founder", mode: "primary" },
          [planner]: { name: "planner", mode: "primary" },
          [lead]: { name: "lead", mode: "primary" },
        }

        // when
        const result = reorderAgentsByPriority(agents)

        // then
        expect(result[chief]).toEqual({ name: "chief", mode: "primary", order: 1 })
        expect(result[founder]).toEqual({ name: "founder", mode: "primary", order: 2 })
        expect(result[planner]).toEqual({ name: "planner", mode: "primary", order: 3 })
        expect(result[lead]).toEqual({ name: "lead", mode: "primary", order: 4 })
      })

      test("#when core agent is non-object #then leaves value unchanged", () => {
        // given
        const agents: Record<string, unknown> = {
          [chief]: "string-config",
          [lead]: null,
        }

        // when
        const result = reorderAgentsByPriority(agents)

        // then
        expect(result[chief]).toBe("string-config")
        expect(result[lead]).toBe(null)
      })

      test("#when non-core agent #then does NOT inject order field", () => {
        // given
        const agents: Record<string, unknown> = {
          [thinker]: { name: "thinker", mode: "subagent" },
          custom: { name: "custom" },
        }

        // when
        const result = reorderAgentsByPriority(agents)

        // then
        expect(result[thinker]).toEqual({ name: "thinker", mode: "subagent" })
        expect(result.custom).toEqual({ name: "custom" })
      })
    })

    describe("#given non-core agent ordering", () => {
      test("#when multiple non-core agents #then sorted alphabetically after core agents", () => {
        // given: non-core agents in random order
        const agents: Record<string, unknown> = {
          zebra: { name: "zebra" },
          [chief]: { name: "chief" },
          apple: { name: "apple" },
          mango: { name: "mango" },
          [lead]: { name: "lead" },
        }

        // when
        const result = reorderAgentsByPriority(agents)

        // then: core agents first, then alphabetical
        const keys = Object.keys(result)
        expect(keys.slice(0, 2)).toEqual([chief, lead])
        expect(keys.slice(2)).toEqual(["apple", "mango", "zebra"])
      })
    })
  })
})
