import { describe, expect, test } from "bun:test"
import {
  AGENT_ELIGIBILITY_REGISTRY,
  CategoryMemberSchema,
  MemberSchema,
  SubagentMemberSchema,
} from "./types"

describe("team-mode types", () => {
  test("member category branch parses and narrows", () => {
    // given
    const member = { kind: "category", name: "m1", category: "deep", prompt: "impl X" }

    // when
    const result = MemberSchema.safeParse(member)

    // then
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toMatchObject(member)
      expect(result.data).toMatchObject({ kind: "category", category: "deep" })
    }
  })

  test("both kinds rejected", () => {
    // given
    const member = {
      kind: "category",
      name: "m1",
      category: "deep",
      subagent_type: "chief",
      prompt: "impl X",
    }

    // when
    const result = MemberSchema.safeParse(member)

    // then
    expect(result.success).toBe(false)
  })

  test("category requires prompt", () => {
    // given
    const member = { kind: "category", name: "m1", category: "deep" }

    // when
    const result = CategoryMemberSchema.safeParse(member)

    // then
    expect(result.success).toBe(false)
  })

  test("eligibility registry shape", () => {
    // given
    const entries = Object.entries(AGENT_ELIGIBILITY_REGISTRY)

    // when
    const verdictCounts = entries.reduce(
      (counts, [, value]) => {
        counts[value.verdict] += 1
        return counts
      },
      { eligible: 0, conditional: 0, "hard-reject": 0 },
    )

    // then
    expect(entries).toHaveLength(11)
    expect(verdictCounts).toEqual({ eligible: 3, conditional: 1, "hard-reject": 7 })
    expect(AGENT_ELIGIBILITY_REGISTRY.founder.rejectionMessage).toBe(
      "Agent 'founder' lacks teammate permission. Use subagent_type: 'chief' unless founder teammate permissions are explicitly enabled.",
    )
    expect(AGENT_ELIGIBILITY_REGISTRY.thinker.rejectionMessage).toBe(
      "Agent 'thinker' is read-only. Team members must write to mailbox inbox files. Use delegate-task with subagent_type: 'thinker' for read-only analysis instead.",
    )
    expect(AGENT_ELIGIBILITY_REGISTRY.researcher.rejectionMessage).toBe(
      "Agent 'researcher' is read-only. Cannot write to the team mailbox. Use delegate-task for research queries instead.",
    )
    expect(AGENT_ELIGIBILITY_REGISTRY.tracker.rejectionMessage).toBe(
      "Agent 'tracker' is read-only. Cannot write to the team mailbox. Use delegate-task for codebase exploration instead.",
    )
    expect(AGENT_ELIGIBILITY_REGISTRY["spotter"].rejectionMessage).toBe(
      "Agent 'spotter' has read-only tool access. Cannot write to the team mailbox.",
    )
    expect(AGENT_ELIGIBILITY_REGISTRY.reviewer.rejectionMessage).toBe(
      "Agent 'reviewer' is read-only. Use delegate-task for pre-planning analysis instead.",
    )
    expect(AGENT_ELIGIBILITY_REGISTRY.critic.rejectionMessage).toBe(
      "Agent 'critic' is read-only. Use delegate-task for plan critique instead.",
    )
    expect(AGENT_ELIGIBILITY_REGISTRY.planner.rejectionMessage).toBe(
      "Agent 'planner' is plan-mode-only and cannot write to the team mailbox. Use category: 'strategic-analysis' or category: 'quick' instead.",
    )
    expect(CategoryMemberSchema).toBeDefined()
    expect(SubagentMemberSchema).toBeDefined()
  })
})
