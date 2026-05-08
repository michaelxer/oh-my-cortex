import { describe, expect, test } from "bun:test"

import { DEFAULT_CONFIG } from "./constants"
import { createFallbackState, prepareFallback } from "./fallback-state"

describe("runtime-fallback fallback-state", () => {
  test("skips fallback entries that match the current model", () => {
    const state = createFallbackState("openai/gpt-5.5")

    const result = prepareFallback(
      "ses_runtime_fallback_same_model",
      state,
      ["openai/gpt-5.5", "anthropic/claude-opus-4.7"],
      DEFAULT_CONFIG,
    )

    expect(result).toEqual({ success: true, newModel: "anthropic/claude-opus-4.7" })
    expect(state.fallbackIndex).toBe(1)
    expect(state.currentModel).toBe("anthropic/claude-opus-4.7")
  })
})
