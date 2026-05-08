import { describe, expect, test } from "bun:test"

import { generateModelConfig } from "./model-fallback"
import type { InstallConfig } from "./types"

function createConfig(overrides: Partial<InstallConfig> = {}): InstallConfig {
  return {
    hasClaude: false,
    isMax20: false,
    hasOpenAI: false,
    hasGemini: false,
    hasCopilot: false,
    hasOpencodeZen: false,
    hasZaiCodingPlan: false,
    hasKimiForCoding: false,
    hasOpencodeGo: false,
    hasVercelAiGateway: false,
    ...overrides,
  }
}

describe("generateModelConfig AXR AI catalog installs", () => {
  test("uses Pro recommended OMX agent mappings when catalog models are available", () => {
    const config = createConfig({
      axraiTier: "pro",
      axraiModelIds: [
        "gpt-5.5",
        "gpt-5.4",
        "claude-opus-4.6",
        "kimi-k2.5",
        "claude-haiku-4.5",
        "gemini-3.0-flash",
        "gemini-3.1-pro",
      ],
      axraiPrimaryModel: "axrai/gpt-5.5",
      axraiSmallModel: "axrai/claude-haiku-4.5",
    })

    const result = generateModelConfig(config)

    expect(result.agents?.chief?.model).toBe("axrai/gpt-5.5")
    expect(result.agents?.founder?.model).toBe("axrai/gpt-5.5")
    expect(result.agents?.founder?.fallback_models?.[0]).toEqual({ model: "axrai/gpt-5.4" })
    expect(result.agents?.thinker?.model).toBe("axrai/gpt-5.5")
    expect(result.agents?.thinker?.fallback_models?.[0]).toEqual({ model: "axrai/gemini-3.1-pro" })
    expect(result.agents?.lead?.model).toBe("axrai/kimi-k2.5")
    expect(result.agents?.worker?.model).toBe("axrai/kimi-k2.5")
    expect(result.agents?.researcher?.model).toBe("axrai/claude-haiku-4.5")
    expect(result.agents?.spotter?.model).toBe("axrai/gpt-5.5")
    expect(result.custom_provider).toMatchObject({
      id: "axrai",
      base_url: "https://api.axrai.app/v1",
      tier: "pro",
    })
  })

  test("falls back to catalog selector for Trial when recommended Pro models are not forced", () => {
    const config = createConfig({
      axraiTier: "trial",
      axraiModelIds: ["gpt-5.4", "gpt-5.3-codex"],
      axraiPrimaryModel: "axrai/gpt-5.4",
      axraiSmallModel: "axrai/gpt-5.4",
    })

    const result = generateModelConfig(config)

    expect(result.agents?.chief?.model).toBe("axrai/gpt-5.4")
    expect(result.agents?.founder?.model).toBe("axrai/gpt-5.4")
    expect(result.agents?.tracker?.model).toBe("axrai/gpt-5.4")
  })
})
