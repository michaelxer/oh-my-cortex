/// <reference types="bun-types" />

import { describe, expect, test } from "bun:test"

import { resolveCallerTeamLead, shouldReuseCallerLeadSession } from "./resolve-caller-team-lead"
import type { TeamSpec } from "./types"

function makeSpec(overrides: Partial<TeamSpec> = {}): TeamSpec {
  return {
    version: 1,
    name: "test-team",
    createdAt: Date.now(),
    leadAgentId: "lead",
    members: [
      { kind: "subagent_type", name: "lead", subagent_type: "founder", backendType: "in-process", isActive: true },
      { kind: "category", name: "worker", category: "quick", prompt: "do work", backendType: "in-process", isActive: true },
    ],
    ...overrides,
  }
}

describe("resolveCallerTeamLead", () => {
  test("returns an eligible founder lead for the plain agent key", () => {
    // given
    const rawAgentName = "Founder"

    // when
    const result = resolveCallerTeamLead(rawAgentName)

    // then
    expect(result).toEqual({
      agentTypeId: "founder",
      displayName: "Founder",
      isEligibleForTeamLead: true,
    })
  })

  test("returns an eligible chief lead for the suffixed display name", () => {
    // given
    const rawAgentName = "Chief - Deepworker"

    // when
    const result = resolveCallerTeamLead(rawAgentName)

    // then
    expect(result).toEqual({
      agentTypeId: "chief",
      displayName: "Chief - Deepworker",
      isEligibleForTeamLead: true,
    })
  })

  test("strips invisible ordering prefixes before resolving the caller lead", () => {
    // given
    const rawAgentName = "\u200BFounder - Deep Agent"

    // when
    const result = resolveCallerTeamLead(rawAgentName)

    // then
    expect(result).toEqual({
      agentTypeId: "founder",
      displayName: "Founder - Deep Agent",
      isEligibleForTeamLead: true,
    })
  })

  test("returns not eligible when the caller agent is undefined", () => {
    // given
    const rawAgentName = undefined

    // when
    const result = resolveCallerTeamLead(rawAgentName)

    // then
    expect(result).toEqual({ isEligibleForTeamLead: false })
  })

  test("returns not eligible for read-only agents", () => {
    // given
    const rawAgentName = "Thinker"

    // when
    const result = resolveCallerTeamLead(rawAgentName)

    // then
    expect(result).toEqual({
      displayName: "Thinker",
      isEligibleForTeamLead: false,
    })
  })
})

describe("shouldReuseCallerLeadSession", () => {
  test("reuses caller session when caller is eligible and spec has a lead", () => {
    // given
    const spec = makeSpec({ leadAgentId: "lead" })

    // when
    const result = shouldReuseCallerLeadSession(spec, "founder")

    // then
    expect(result).toBe(true)
  })

  test("reuses caller session even when lead member is category type", () => {
    // given
    const spec = makeSpec({
      leadAgentId: "lead",
      members: [
        { kind: "category", name: "lead", category: "deep", prompt: "lead the team", backendType: "in-process", isActive: true },
        { kind: "category", name: "worker", category: "quick", prompt: "do work", backendType: "in-process", isActive: true },
      ],
    })

    // when
    const result = shouldReuseCallerLeadSession(spec, "founder")

    // then
    expect(result).toBe(true)
  })

  test("reuses caller session even when lead subagent_type differs from caller", () => {
    // given
    const spec = makeSpec({
      leadAgentId: "lead",
      members: [
        { kind: "subagent_type", name: "lead", subagent_type: "lead", backendType: "in-process", isActive: true },
      ],
    })

    // when
    const result = shouldReuseCallerLeadSession(spec, "founder")

    // then
    expect(result).toBe(true)
  })

  test("does not reuse when callerAgentTypeId is undefined", () => {
    // given
    const spec = makeSpec({ leadAgentId: "lead" })

    // when
    const result = shouldReuseCallerLeadSession(spec, undefined)

    // then
    expect(result).toBe(false)
  })

  test("does not reuse when spec has no leadAgentId", () => {
    // given
    const spec = makeSpec({ leadAgentId: undefined })

    // when
    const result = shouldReuseCallerLeadSession(spec, "founder")

    // then
    expect(result).toBe(false)
  })
})
