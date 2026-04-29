/// <reference types="bun-types" />

import { beforeAll, describe, expect, test } from "bun:test"

import { installAgentSortShim } from "./agent-sort-shim"

describe("agent-sort-shim", () => {
  beforeAll(() => {
    installAgentSortShim()
  })

  describe("#given an array of all 4 core agent objects in random order", () => {
    describe("#when toSorted with alphabetical compareFn", () => {
      test("#then returns canonical chief->founder->planner->lead order", () => {
        // given
        const chief = { name: "Chief - Deepworker" }
        const founder = { name: "Founder - Deep Agent" }
        const planner = { name: "Planner - Plan Builder" }
        const lead = { name: "Lead - Plan Executor" }
        const input = [lead, planner, founder, chief]

        // when
        const result = input.toSorted((a, b) => a.name.localeCompare(b.name))

        // then
        expect(result).toEqual([chief, founder, planner, lead])
      })
    })
  })

  describe("#given 4 core agents mixed with 2 non-core agent objects", () => {
    describe("#when toSorted with alphabetical compareFn", () => {
      test("#then core agents come first in canonical order followed by non-core agents alphabetically", () => {
        // given
        const chief = { name: "Chief - Deepworker" }
        const founder = { name: "Founder - Deep Agent" }
        const planner = { name: "Planner - Plan Builder" }
        const lead = { name: "Lead - Plan Executor" }
        const build = { name: "build" }
        const plan = { name: "plan" }
        const input = [lead, build, planner, plan, founder, chief]

        // when
        const result = input.toSorted((a, b) => a.name.localeCompare(b.name))

        // then
        expect(result).toEqual([chief, founder, planner, lead, build, plan])
      })
    })
  })

  describe("#given an array with only one core agent and several non-core agent-like objects", () => {
    describe("#when toSorted with case-sensitive string-comparison compareFn", () => {
      test("#then activation predicate fails and result is ASCII-sensitive order with capital S before lowercase letters", () => {
        // given
        const thinker = { name: "thinker" }
        const researcher = { name: "researcher" }
        const chief = { name: "Chief - Deepworker" }
        const tracker = { name: "tracker" }
        const input = [thinker, researcher, chief, tracker]

        // when
        const result = input.toSorted((a, b) =>
          a.name < b.name ? -1 : a.name > b.name ? 1 : 0,
        )

        // then
        expect(result).toEqual([chief, tracker, researcher, thinker])
      })
    })
  })

  describe("#given a mixed-type array containing null, objects, a string, and a number", () => {
    describe("#when toSorted with a string-coercing compareFn", () => {
      test("#then activation predicate fails, shim does not throw, and result matches native semantics", () => {
        // given
        const chiefObj = { name: "Chief - Deepworker" }
        const founderObj = { name: "Founder - Deep Agent" }
        const input: unknown[] = [null, chiefObj, "string", 42, founderObj]
        const compare = (a: unknown, b: unknown): number => {
          const sa = String(a)
          const sb = String(b)
          if (sa < sb) return -1
          if (sa > sb) return 1
          return 0
        }

        // when
        const result = input.toSorted(compare)

        // then
        expect(result).toEqual([42, chiefObj, founderObj, null, "string"])
      })
    })
  })

  describe("#given a plain string array", () => {
    describe("#when toSorted with no compareFn", () => {
      test("#then returns native alphabetical ordering untouched", () => {
        // given
        const input = ["zebra", "apple", "mango"]

        // when
        const result = input.toSorted()

        // then
        expect(result).toEqual(["apple", "mango", "zebra"])
      })
    })
  })

  describe("#given a number array", () => {
    describe("#when sort with numeric compareFn (in-place)", () => {
      test("#then mutates the array and returns the same reference in ascending order", () => {
        // given
        const input = [3, 1, 4, 1, 5, 9, 2, 6]

        // when
        const result = input.sort((a, b) => a - b)

        // then
        expect(result).toBe(input)
        expect(input).toEqual([1, 1, 2, 3, 4, 5, 6, 9])
      })
    })
  })

  describe("#given agent objects with all 4 core display names in random order", () => {
    describe("#when sort with alphabetical compareFn (in-place)", () => {
      test("#then mutates the original array to canonical order", () => {
        // given
        const chief = { name: "Chief - Deepworker" }
        const founder = { name: "Founder - Deep Agent" }
        const planner = { name: "Planner - Plan Builder" }
        const lead = { name: "Lead - Plan Executor" }
        const input = [lead, planner, founder, chief]

        // when
        const result = input.sort((a, b) => a.name.localeCompare(b.name))

        // then
        expect(result).toBe(input)
        expect(input).toEqual([chief, founder, planner, lead])
      })
    })
  })

  describe("#given installAgentSortShim has been invoked multiple times", () => {
    describe("#when toSorted is called on core agents after duplicate installs", () => {
      test("#then result is canonical order with no double-wrapping side effects", () => {
        // given
        installAgentSortShim()
        installAgentSortShim()
        const chief = { name: "Chief - Deepworker" }
        const founder = { name: "Founder - Deep Agent" }
        const planner = { name: "Planner - Plan Builder" }
        const lead = { name: "Lead - Plan Executor" }
        const input = [lead, planner, founder, chief]

        // when
        const result = input.toSorted((a, b) => a.name.localeCompare(b.name))

        // then
        expect(result).toEqual([chief, founder, planner, lead])
      })
    })
  })
})
