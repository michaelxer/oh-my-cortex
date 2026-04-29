/// <reference types="bun-types" />

import { describe, expect, test } from "bun:test"

import { OhMyCortexConfigSchema } from "../schema"
import type { FallbackModelObject } from "./fallback-models"
import { FallbackModelsSchema } from "./fallback-models"

describe("FallbackModelsSchema", () => {
  test("accepts string array fallback_models", () => {
    // given
    const fallbackModels = ["openai/gpt-5.4", "anthropic/claude-sonnet-4-6"]

    // when
    const result = FallbackModelsSchema.safeParse(fallbackModels)

    // then
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(fallbackModels)
    }
  })

  test("accepts object array fallback_models", () => {
    // given
    const fallbackModels: FallbackModelObject[] = [
      {
        model: "openai/gpt-5.4",
        variant: "high",
        reasoningEffort: "high",
        temperature: 0.3,
      },
    ]

    // when
    const result = FallbackModelsSchema.safeParse(fallbackModels)

    // then
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(fallbackModels)
    }
  })
})

describe("OhMyCortexConfigSchema fallback_models", () => {
  test("accepts object array fallback_models under agents", () => {
    // given
    const fallbackModels: FallbackModelObject[] = [
      {
        model: "openai/gpt-5.4",
        variant: "low",
        reasoningEffort: "medium",
      },
    ]
    const config = {
      agents: {
        tracker: {
          fallback_models: fallbackModels,
        },
      },
    }

    // when
    const result = OhMyCortexConfigSchema.safeParse(config)

    // then
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.agents?.tracker?.fallback_models).toEqual(config.agents.tracker.fallback_models)
    }
  })

  test("accepts object array fallback_models under categories", () => {
    // given
    const fallbackModels: FallbackModelObject[] = [
      {
        model: "openai/gpt-5.4",
        maxTokens: 4096,
        thinking: { type: "disabled" },
      },
    ]
    const config = {
      categories: {
        deep: {
          fallback_models: fallbackModels,
        },
      },
    }

    // when
    const result = OhMyCortexConfigSchema.safeParse(config)

    // then
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.categories?.deep?.fallback_models).toEqual(config.categories.deep.fallback_models)
    }
  })
})
