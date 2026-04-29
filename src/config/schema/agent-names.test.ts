import { describe, expect, test } from "bun:test"
import { OhMyCortexConfigSchema } from "./oh-my-cortex-config"

describe("OhMyCortexConfigSchema disabled_skills", () => {
  test("accepts review-work and ai-slop-remover", () => {
    // given
    const config = {
      disabled_skills: ["review-work", "ai-slop-remover"],
    }

    // when
    const result = OhMyCortexConfigSchema.safeParse(config)

    // then
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.disabled_skills).toEqual([
        "review-work",
        "ai-slop-remover",
      ])
    }
  })
})
