import { describe, test, expect } from "bun:test"
import { LEAD_SYSTEM_PROMPT } from "./default"
import { LEAD_GPT_SYSTEM_PROMPT } from "./gpt"
import { LEAD_GEMINI_SYSTEM_PROMPT } from "./gemini"

describe("LEAD prompt checkbox enforcement", () => {
  describe("default prompt", () => {
    test("plan should NOT be marked (READ ONLY)", () => {
      // given
      const prompt = LEAD_SYSTEM_PROMPT

      // when / then
      expect(prompt).not.toMatch(/\(READ ONLY\)/)
    })

    test("plan description should include EDIT for checkboxes", () => {
      // given
      const prompt = LEAD_SYSTEM_PROMPT
      const lowerPrompt = prompt.toLowerCase()

      // when / then
      expect(lowerPrompt).toMatch(/edit.*checkbox|checkbox.*edit/)
    })

    test("boundaries should include exception for editing .cortex/plans/*.md checkboxes", () => {
      // given
      const prompt = LEAD_SYSTEM_PROMPT
      const lowerPrompt = prompt.toLowerCase()

      // when / then
      expect(lowerPrompt).toMatch(/\.cortex\/plans\/\*\.md/)
      expect(lowerPrompt).toMatch(/checkbox/)
    })

    test("prompt should include POST-DELEGATION RULE", () => {
      // given
      const prompt = LEAD_SYSTEM_PROMPT
      const lowerPrompt = prompt.toLowerCase()

      // when / then
      expect(lowerPrompt).toMatch(/post-delegation/)
    })

    test("prompt should include MUST NOT call a new task() before", () => {
      // given
      const prompt = LEAD_SYSTEM_PROMPT
      const lowerPrompt = prompt.toLowerCase()

      // when / then
      expect(lowerPrompt).toMatch(/must not.*call.*new.*task/)
    })

    test("default prompt should NOT reference .cortex/tasks/", () => {
      // given
      const prompt = LEAD_SYSTEM_PROMPT

      // when / then
      expect(prompt).not.toMatch(/\.cortex\/tasks\//)
    })
  })

  describe("GPT prompt", () => {
    test("plan should NOT be marked (READ ONLY)", () => {
      // given
      const prompt = LEAD_GPT_SYSTEM_PROMPT

      // when / then
      expect(prompt).not.toMatch(/\(READ ONLY\)/)
    })

    test("plan description should include EDIT for checkboxes", () => {
      // given
      const prompt = LEAD_GPT_SYSTEM_PROMPT
      const lowerPrompt = prompt.toLowerCase()

      // when / then
      expect(lowerPrompt).toMatch(/edit.*checkbox|checkbox.*edit/)
    })

    test("boundaries should include exception for editing .cortex/plans/*.md checkboxes", () => {
      // given
      const prompt = LEAD_GPT_SYSTEM_PROMPT
      const lowerPrompt = prompt.toLowerCase()

      // when / then
      expect(lowerPrompt).toMatch(/\.cortex\/plans\/\*\.md/)
      expect(lowerPrompt).toMatch(/checkbox/)
    })

    test("prompt should include POST-DELEGATION RULE", () => {
      // given
      const prompt = LEAD_GPT_SYSTEM_PROMPT
      const lowerPrompt = prompt.toLowerCase()

      // when / then
      expect(lowerPrompt).toMatch(/post-delegation/)
    })

    test("prompt should include MUST NOT call a new task() before", () => {
      // given
      const prompt = LEAD_GPT_SYSTEM_PROMPT
      const lowerPrompt = prompt.toLowerCase()

      // when / then
      expect(lowerPrompt).toMatch(/must not.*call.*new.*task/)
    })
  })

  describe("Gemini prompt", () => {
    test("plan should NOT be marked (READ ONLY)", () => {
      // given
      const prompt = LEAD_GEMINI_SYSTEM_PROMPT

      // when / then
      expect(prompt).not.toMatch(/\(READ ONLY\)/)
    })

    test("plan description should include EDIT for checkboxes", () => {
      // given
      const prompt = LEAD_GEMINI_SYSTEM_PROMPT
      const lowerPrompt = prompt.toLowerCase()

      // when / then
      expect(lowerPrompt).toMatch(/edit.*checkbox|checkbox.*edit/)
    })

    test("boundaries should include exception for editing .cortex/plans/*.md checkboxes", () => {
      // given
      const prompt = LEAD_GEMINI_SYSTEM_PROMPT
      const lowerPrompt = prompt.toLowerCase()

      // when / then
      expect(lowerPrompt).toMatch(/\.cortex\/plans\/\*\.md/)
      expect(lowerPrompt).toMatch(/checkbox/)
    })

    test("prompt should include POST-DELEGATION RULE", () => {
      // given
      const prompt = LEAD_GEMINI_SYSTEM_PROMPT
      const lowerPrompt = prompt.toLowerCase()

      // when / then
      expect(lowerPrompt).toMatch(/post-delegation/)
    })

    test("prompt should include MUST NOT call a new task() before", () => {
      // given
      const prompt = LEAD_GEMINI_SYSTEM_PROMPT
      const lowerPrompt = prompt.toLowerCase()

      // when / then
      expect(lowerPrompt).toMatch(/must not.*call.*new.*task/)
    })
  })
})
