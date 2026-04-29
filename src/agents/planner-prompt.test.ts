import { describe, test, expect } from "bun:test"
import { PLANNER_SYSTEM_PROMPT } from "./planner"
import { PLANNER_GPT_SYSTEM_PROMPT } from "./planner/gpt"
import { PLANNER_GEMINI_SYSTEM_PROMPT } from "./planner/gemini"

describe("PLANNER_SYSTEM_PROMPT Critic invocation policy", () => {
  test("should direct providing ONLY the file path string when invoking Critic", () => {
    //#given
    const prompt = PLANNER_SYSTEM_PROMPT

    //#when / #then
    expect(prompt.toLowerCase()).toMatch(/critic.*only.*path|path.*only.*critic/)
  })

  test("should forbid wrapping Critic invocation in explanations or markdown", () => {
    //#given
    const prompt = PLANNER_SYSTEM_PROMPT

    //#when / #then
    expect(prompt.toLowerCase()).toMatch(/not.*wrap|no.*explanation|no.*markdown/)
  })
})

describe("PLANNER_SYSTEM_PROMPT zero human intervention", () => {
  test("should enforce universal zero human intervention rule", () => {
    //#given
    const prompt = PLANNER_SYSTEM_PROMPT

    //#when
    const lowerPrompt = prompt.toLowerCase()

    //#then
    expect(lowerPrompt).toContain("zero human intervention")
    expect(lowerPrompt).toContain("forbidden")
    expect(lowerPrompt).toMatch(/user manually tests|사용자가 직접 테스트/)
  })

  test("should require agent-executed QA scenarios as mandatory for all tasks", () => {
    //#given
    const prompt = PLANNER_SYSTEM_PROMPT

    //#when
    const lowerPrompt = prompt.toLowerCase()

    //#then
    expect(lowerPrompt).toContain("agent-executed qa scenarios")
    expect(lowerPrompt).toMatch(/mandatory.*all tasks|all tasks.*mandatory/)
  })

  test("should not contain ambiguous 'manual QA' terminology", () => {
    //#given
    const prompt = PLANNER_SYSTEM_PROMPT

    //#when / #then
    expect(prompt).not.toMatch(/manual QA procedures/i)
    expect(prompt).not.toMatch(/manual verification procedures/i)
    expect(prompt).not.toMatch(/Manual-only/i)
  })

  test("should require per-scenario format with detailed structure", () => {
    //#given
    const prompt = PLANNER_SYSTEM_PROMPT

    //#when
    const lowerPrompt = prompt.toLowerCase()

    //#then
    expect(lowerPrompt).toContain("preconditions")
    expect(lowerPrompt).toContain("failure indicators")
    expect(lowerPrompt).toContain("evidence")
    expect(prompt).toMatch(/negative/i)
  })

  test("should require QA scenario adequacy in self-review checklist", () => {
    //#given
    const prompt = PLANNER_SYSTEM_PROMPT

    //#when
    const lowerPrompt = prompt.toLowerCase()

    //#then
    expect(lowerPrompt).toMatch(/every task has agent-executed qa scenarios/)
    expect(lowerPrompt).toMatch(/happy-path and negative/)
    expect(lowerPrompt).toMatch(/zero acceptance criteria require human/)
  })
})

describe("Planner prompts anti-duplication coverage", () => {
  test("all variants should include anti-duplication rules for delegated exploration", () => {
    // given
    const prompts = [
      PLANNER_SYSTEM_PROMPT,
      PLANNER_GPT_SYSTEM_PROMPT,
      PLANNER_GEMINI_SYSTEM_PROMPT,
    ]

    // when / then
    for (const prompt of prompts) {
      expect(prompt).toContain("<Anti_Duplication>")
      expect(prompt).toContain("Anti-Duplication Rule")
      expect(prompt).toContain("DO NOT perform the same search yourself")
      expect(prompt).toContain("non-overlapping work")
    }
  })
})
