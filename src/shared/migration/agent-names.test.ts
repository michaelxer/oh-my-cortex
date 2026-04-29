/// <reference types="bun-types" />

import { describe, expect, test } from "bun:test"
import { AGENT_NAME_MAP, migrateAgentNames } from "./agent-names"

describe("AGENT_NAME_MAP parenthesized aliases", () => {
  test("maps Chief (Deepworker) to chief", () => {
    // given
    const alias = "Chief (Deepworker)"

    // when
    const result = AGENT_NAME_MAP[alias]

    // then
    expect(result).toBe("chief")
  })

  test("maps Founder (Deep Agent) to founder", () => {
    // given
    const alias = "Founder (Deep Agent)"

    // when
    const result = AGENT_NAME_MAP[alias]

    // then
    expect(result).toBe("founder")
  })

  test("maps Planner (Plan Builder) to planner", () => {
    // given
    const alias = "Planner (Plan Builder)"

    // when
    const result = AGENT_NAME_MAP[alias]

    // then
    expect(result).toBe("planner")
  })

  test("maps Lead (Plan Executor) to lead", () => {
    // given
    const alias = "Lead (Plan Executor)"

    // when
    const result = AGENT_NAME_MAP[alias]

    // then
    expect(result).toBe("lead")
  })

  test("maps Reviewer (Plan Consultant) to reviewer", () => {
    // given
    const alias = "Reviewer (Plan Consultant)"

    // when
    const result = AGENT_NAME_MAP[alias]

    // then
    expect(result).toBe("reviewer")
  })

  test("maps Critic (Plan Critic) to critic", () => {
    // given
    const alias = "Critic (Plan Critic)"

    // when
    const result = AGENT_NAME_MAP[alias]

    // then
    expect(result).toBe("critic")
  })
})

describe("migrateAgentNames with parenthesized aliases", () => {
  test("migrates all parenthesized aliases to canonical names", () => {
    // given
    const legacyAgents = {
      "Chief (Deepworker)": { model: "claude-opus-4" },
      "Founder (Deep Agent)": { model: "gpt-5.4" },
      "Planner (Plan Builder)": { model: "claude-opus-4" },
      "Lead (Plan Executor)": { model: "kimi-k2.5" },
      "Reviewer (Plan Consultant)": { model: "claude-opus-4" },
      "Critic (Plan Critic)": { model: "claude-opus-4" },
    }

    // when
    const { migrated, changed } = migrateAgentNames(legacyAgents)

    // then
    expect(changed).toBe(true)
    expect(migrated.cortex).toEqual({ model: "claude-opus-4" })
    expect(migrated.founder).toEqual({ model: "gpt-5.4" })
    expect(migrated.planner).toEqual({ model: "claude-opus-4" })
    expect(migrated.lead).toEqual({ model: "kimi-k2.5" })
    expect(migrated.reviewer).toEqual({ model: "claude-opus-4" })
    expect(migrated.critic).toEqual({ model: "claude-opus-4" })
    expect(migrated["Chief (Deepworker)"]).toBeUndefined()
    expect(migrated["Founder (Deep Agent)"]).toBeUndefined()
  })
})
