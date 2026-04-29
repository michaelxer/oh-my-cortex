import { describe, it, expect } from "bun:test"
import { getPlannerPrompt } from "./system-prompt"

describe("getPlannerPrompt", () => {
  describe("#given question tool is not disabled", () => {
    describe("#when generating prompt", () => {
      it("#then should include Question tool references", () => {
        const prompt = getPlannerPrompt(undefined, [])

        expect(prompt).toContain("Question({")
      })
    })
  })

  describe("#given question tool is disabled via disabled_tools", () => {
    describe("#when generating prompt", () => {
      it("#then should strip Question tool code examples", () => {
        const prompt = getPlannerPrompt(undefined, ["question"])

        expect(prompt).not.toContain("Question({")
      })
    })

    describe("#when disabled_tools includes question among other tools", () => {
      it("#then should strip Question tool code examples", () => {
        const prompt = getPlannerPrompt(undefined, ["todowrite", "question", "interactive_bash"])

        expect(prompt).not.toContain("Question({")
      })
    })
  })

  describe("#given no disabled_tools provided", () => {
    describe("#when generating prompt with undefined", () => {
      it("#then should include Question tool references", () => {
        const prompt = getPlannerPrompt(undefined, undefined)

        expect(prompt).toContain("Question({")
      })
    })
  })
})
