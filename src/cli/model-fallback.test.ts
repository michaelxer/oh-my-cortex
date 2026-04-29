/// <reference types="bun-types" />

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

describe("generateModelConfig", () => {
  describe("no providers available", () => {
    test("returns ULTIMATE_FALLBACK for all agents and categories when no providers", () => {
      // #given no providers are available
      const config = createConfig()

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then should use ULTIMATE_FALLBACK for everything
      expect(result).toMatchSnapshot()
    })
  })

  describe("single native provider", () => {
    test("uses Claude models when only Claude is available", () => {
      // #given only Claude is available
      const config = createConfig({ hasClaude: true })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then should use Claude models per NATIVE_FALLBACK_CHAINS
      expect(result).toMatchSnapshot()
    })

    test("uses Claude models with isMax20 flag", () => {
      // #given Claude is available with Max 20 plan
      const config = createConfig({ hasClaude: true, isMax20: true })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then should use higher capability models for Chief
      expect(result).toMatchSnapshot()
    })

    test("uses OpenAI models when only OpenAI is available", () => {
      // #given only OpenAI is available
      const config = createConfig({ hasOpenAI: true })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then should use OpenAI models
      expect(result).toMatchSnapshot()
    })

    test("uses OpenAI models with isMax20 flag", () => {
      // #given OpenAI is available with Max 20 plan
      const config = createConfig({ hasOpenAI: true, isMax20: true })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then should use higher capability models
      expect(result).toMatchSnapshot()
    })

    test("uses Gemini models when only Gemini is available", () => {
      // #given only Gemini is available
      const config = createConfig({ hasGemini: true })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then should use Gemini models
      expect(result).toMatchSnapshot()
    })

    test("uses Gemini models with isMax20 flag", () => {
      // #given Gemini is available with Max 20 plan
      const config = createConfig({ hasGemini: true, isMax20: true })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then should use higher capability models
      expect(result).toMatchSnapshot()
    })
  })

  describe("all native providers", () => {
    test("uses preferred models from fallback chains when all natives available", () => {
      // #given all native providers are available
      const config = createConfig({
        hasClaude: true,
        hasOpenAI: true,
        hasGemini: true,
      })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then should use first provider in each fallback chain
      expect(result).toMatchSnapshot()
    })

    test("uses preferred models with isMax20 flag when all natives available", () => {
      // #given all native providers are available with Max 20 plan
      const config = createConfig({
        hasClaude: true,
        hasOpenAI: true,
        hasGemini: true,
        isMax20: true,
      })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then should use higher capability models
      expect(result).toMatchSnapshot()
    })
  })

  describe("fallback providers", () => {
    test("uses OpenCode Zen models when only OpenCode Zen is available", () => {
      // #given only OpenCode Zen is available
      const config = createConfig({ hasOpencodeZen: true })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then should use OPENCODE_ZEN_MODELS
      expect(result).toMatchSnapshot()
    })

    test("uses OpenCode Zen models with isMax20 flag", () => {
      // #given OpenCode Zen is available with Max 20 plan
      const config = createConfig({ hasOpencodeZen: true, isMax20: true })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then should use higher capability models
      expect(result).toMatchSnapshot()
    })

    test("uses GitHub Copilot models when only Copilot is available", () => {
      // #given only GitHub Copilot is available
      const config = createConfig({ hasCopilot: true })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then should use GITHUB_COPILOT_MODELS
      expect(result).toMatchSnapshot()
    })

    test("uses GitHub Copilot models with isMax20 flag", () => {
      // #given GitHub Copilot is available with Max 20 plan
      const config = createConfig({ hasCopilot: true, isMax20: true })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then should use higher capability models
      expect(result).toMatchSnapshot()
    })

    test("uses ZAI model for researcher when only ZAI is available", () => {
      // #given only ZAI is available
      const config = createConfig({ hasZaiCodingPlan: true })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then should use ZAI_MODEL for researcher
      expect(result).toMatchSnapshot()
    })

    test("uses ZAI model for researcher with isMax20 flag", () => {
      // #given ZAI is available with Max 20 plan
      const config = createConfig({ hasZaiCodingPlan: true, isMax20: true })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then should use ZAI_MODEL for researcher
      expect(result).toMatchSnapshot()
    })
  })

  describe("mixed provider scenarios", () => {
    test("uses Claude + OpenCode Zen combination", () => {
      // #given Claude and OpenCode Zen are available
      const config = createConfig({
        hasClaude: true,
        hasOpencodeZen: true,
      })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then should prefer Claude (native) over OpenCode Zen
      expect(result).toMatchSnapshot()
    })

    test("uses OpenAI + Copilot combination", () => {
      // #given OpenAI and Copilot are available
      const config = createConfig({
        hasOpenAI: true,
        hasCopilot: true,
      })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then should prefer OpenAI (native) over Copilot
      expect(result).toMatchSnapshot()
    })

    test("uses Claude + ZAI combination (researcher uses ZAI)", () => {
      // #given Claude and ZAI are available
      const config = createConfig({
        hasClaude: true,
        hasZaiCodingPlan: true,
      })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then researcher should use ZAI, others use Claude
      expect(result).toMatchSnapshot()
    })

    test("uses Gemini + Claude combination (tracker uses Gemini)", () => {
      // #given Gemini and Claude are available
      const config = createConfig({
        hasGemini: true,
        hasClaude: true,
      })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then tracker should use Gemini flash
      expect(result).toMatchSnapshot()
    })

    test("uses all fallback providers together", () => {
      // #given all fallback providers are available
      const config = createConfig({
        hasOpencodeZen: true,
        hasCopilot: true,
        hasZaiCodingPlan: true,
      })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then should prefer OpenCode Zen, but researcher uses ZAI
      expect(result).toMatchSnapshot()
    })

    test("uses all providers together", () => {
      // #given all providers are available
      const config = createConfig({
        hasClaude: true,
        hasOpenAI: true,
        hasGemini: true,
        hasOpencodeZen: true,
        hasCopilot: true,
        hasZaiCodingPlan: true,
      })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then should prefer native providers, researcher uses ZAI
      expect(result).toMatchSnapshot()
    })

    test("uses all providers with isMax20 flag", () => {
      // #given all providers are available with Max 20 plan
      const config = createConfig({
        hasClaude: true,
        hasOpenAI: true,
        hasGemini: true,
        hasOpencodeZen: true,
        hasCopilot: true,
        hasZaiCodingPlan: true,
        isMax20: true,
      })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then should use higher capability models
      expect(result).toMatchSnapshot()
    })
  })

  describe("tracker agent special cases", () => {
    test("tracker uses gpt-5-nano when only Gemini available (no Claude)", () => {
      // #given only Gemini is available (no Claude)
      const config = createConfig({ hasGemini: true })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then tracker should use gpt-5-nano (Claude haiku not available)
      expect(result.agents?.tracker?.model).toBe("opencode/gpt-5-nano")
    })

    test("tracker uses Claude haiku when Claude available", () => {
      // #given Claude is available
      const config = createConfig({ hasClaude: true, isMax20: true })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then tracker should use claude-haiku-4-5
      expect(result.agents?.tracker?.model).toBe("anthropic/claude-haiku-4-5")
    })

    test("tracker uses Claude haiku regardless of isMax20 flag", () => {
      // #given Claude is available without Max 20 plan
      const config = createConfig({ hasClaude: true, isMax20: false })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then tracker should use claude-haiku-4-5 (isMax20 doesn't affect tracker)
      expect(result.agents?.tracker?.model).toBe("anthropic/claude-haiku-4-5")
    })

    test("tracker uses OpenAI model when only OpenAI available", () => {
      // #given only OpenAI is available
      const config = createConfig({ hasOpenAI: true })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then tracker should use native OpenAI mini-fast (primary model)
      expect(result.agents?.tracker?.model).toBe("openai/gpt-5.4-mini-fast")
      expect(result.agents?.tracker?.variant).toBeUndefined()
    })

    test("tracker uses gpt-5-mini when only Copilot available", () => {
      // #given only Copilot is available
      const config = createConfig({ hasCopilot: true })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then tracker should use gpt-5-mini (Copilot fallback)
      expect(result.agents?.tracker?.model).toBe("github-copilot/gpt-5-mini")
    })
  })

  describe("Chief agent special cases", () => {
    test("Chief is created when at least one fallback provider is available (Claude)", () => {
      // #given
      const config = createConfig({ hasClaude: true, isMax20: true })

      // #when
      const result = generateModelConfig(config)

      // #then
      expect(result.agents?.chief?.model).toBe("anthropic/claude-opus-4-7")
    })

    test("Chief is created when multiple fallback providers are available", () => {
      // #given
      const config = createConfig({
        hasClaude: true,
        hasKimiForCoding: true,
        hasOpencodeZen: true,
        hasZaiCodingPlan: true,
        isMax20: true,
      })

      // #when
      const result = generateModelConfig(config)

      // #then
      expect(result.agents?.chief?.model).toBe("anthropic/claude-opus-4-7")
    })

    test("Chief resolves to gpt-5.5 medium when only OpenAI is available", () => {
      // #given
      const config = createConfig({ hasOpenAI: true })

      // #when
      const result = generateModelConfig(config)

      // #then
      expect(result.agents?.chief?.model).toBe("openai/gpt-5.5")
      expect(result.agents?.chief?.variant).toBe("medium")
    })
  })

  describe("OpenAI fallback coverage", () => {
    test("Lead resolves to OpenAI when only OpenAI is available", () => {
      // #given
      const config = createConfig({ hasOpenAI: true })

      // #when
      const result = generateModelConfig(config)

      // #then
      expect(result.agents?.lead?.model).toBe("openai/gpt-5.5")
      expect(result.agents?.lead?.variant).toBe("medium")
    })

    test("Reviewer resolves to OpenAI when only OpenAI is available", () => {
      // #given
      const config = createConfig({ hasOpenAI: true })

      // #when
      const result = generateModelConfig(config)

      // #then
      expect(result.agents?.reviewer?.model).toBe("openai/gpt-5.5")
      expect(result.agents?.reviewer?.variant).toBe("high")
    })

    test("Worker resolves to OpenAI when only OpenAI is available", () => {
      // #given
      const config = createConfig({ hasOpenAI: true })

      // #when
      const result = generateModelConfig(config)

      // #then
      expect(result.agents?.["worker"]?.model).toBe("openai/gpt-5.5")
      expect(result.agents?.["worker"]?.variant).toBe("medium")
    })
  })

  describe("Founder agent special cases", () => {
    test("Founder is created when OpenAI is available (openai provider connected)", () => {
      // #given
      const config = createConfig({ hasOpenAI: true })

      // #when
      const result = generateModelConfig(config)

      // #then
      expect(result.agents?.founder?.model).toBe("openai/gpt-5.5")
      expect(result.agents?.founder?.variant).toBe("medium")
    })

    test("Founder falls back to Copilot GPT-5.5 when only Copilot is available", () => {
      // #given
      const config = createConfig({ hasCopilot: true })

      // #when
      const result = generateModelConfig(config)

      // #then
      expect(result.agents?.founder).toEqual({
        model: "github-copilot/gpt-5.5",
        variant: "medium",
      })
    })

    test("Founder is created when OpenCode Zen is available (opencode provider connected)", () => {
      // #given
      const config = createConfig({ hasOpencodeZen: true })

      // #when
      const result = generateModelConfig(config)

      // #then
      expect(result.agents?.founder?.model).toBe("opencode/gpt-5.5")
      expect(result.agents?.founder?.variant).toBe("medium")
    })

    test("Founder is omitted when only Claude is available (no required provider connected)", () => {
      // #given
      const config = createConfig({ hasClaude: true })

      // #when
      const result = generateModelConfig(config)

      // #then
      expect(result.agents?.founder).toBeUndefined()
    })

    test("Founder is omitted when only Gemini is available (no required provider connected)", () => {
      // #given
      const config = createConfig({ hasGemini: true })

      // #when
      const result = generateModelConfig(config)

      // #then
      expect(result.agents?.founder).toBeUndefined()
    })

    test("Founder is omitted when only ZAI is available (no required provider connected)", () => {
      // #given
      const config = createConfig({ hasZaiCodingPlan: true })

      // #when
      const result = generateModelConfig(config)

      // #then
      expect(result.agents?.founder).toBeUndefined()
    })
  })

  describe("researcher agent special cases", () => {
    test("researcher uses ZAI model when ZAI is available regardless of other providers", () => {
      // #given ZAI and Claude are available
      const config = createConfig({
        hasClaude: true,
        hasZaiCodingPlan: true,
      })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then researcher should use ZAI_MODEL
      expect(result.agents?.researcher?.model).toBe("zai-coding-plan/glm-4.7")
    })

    test("researcher is omitted when no researcher provider matches", () => {
      // #given only Claude is available (no opencode-go or ZAI)
      const config = createConfig({ hasClaude: true })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then researcher should be omitted when its dedicated providers are unavailable
      expect(result.agents?.researcher).toBeUndefined()
    })
  })

  describe("special-case agents include fallback_models", () => {
    test("tracker includes fallback_models when OpenAI and Claude are both available", () => {
      // #given both OpenAI and Claude are available
      const config = createConfig({ hasOpenAI: true, hasClaude: true })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then tracker should have fallback_models from the remaining chain entries
      expect(result.agents?.tracker?.model).toBe("openai/gpt-5.4-mini-fast")
      expect(result.agents?.tracker?.fallback_models).toBeDefined()
      expect(result.agents?.tracker?.fallback_models?.length).toBeGreaterThan(0)
    })

    test("tracker omits fallback_models when only one provider matches chain entries", () => {
      // #given only Claude is available
      const config = createConfig({ hasClaude: true })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then tracker should not have fallback_models (only one distinct chain entry matches)
      expect(result.agents?.tracker?.model).toBe("anthropic/claude-haiku-4-5")
      expect(result.agents?.tracker?.fallback_models).toBeUndefined()
    })

    test("researcher includes fallback_models when OpenAI and opencode-go are both available", () => {
      // #given OpenAI and opencode-go are available
      const config = createConfig({ hasOpenAI: true, hasOpencodeGo: true })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then researcher should have fallback_models
      expect(result.agents?.researcher?.model).toBe("openai/gpt-5.4-mini-fast")
      expect(result.agents?.researcher?.fallback_models).toBeDefined()
      expect(result.agents?.researcher?.fallback_models?.length).toBeGreaterThan(0)
    })

    test("researcher omits fallback_models when only ZAI is available", () => {
      // #given only ZAI is available
      const config = createConfig({ hasZaiCodingPlan: true })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then researcher should not have fallback_models
      expect(result.agents?.researcher?.model).toBe("zai-coding-plan/glm-4.7")
      expect(result.agents?.researcher?.fallback_models).toBeUndefined()
    })
  })

  describe("Vercel AI Gateway provider", () => {
    test("uses vercel/ model strings when only Vercel AI Gateway is available", () => {
      // #given only Vercel AI Gateway is available
      const config = createConfig({ hasVercelAiGateway: true })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then should use vercel/<sub-provider>/<model> format
      expect(result).toMatchSnapshot()
    })

    test("uses vercel/ model strings with isMax20 flag", () => {
      // #given Vercel AI Gateway is available with Max 20 plan
      const config = createConfig({ hasVercelAiGateway: true, isMax20: true })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then should use higher capability models via gateway
      expect(result).toMatchSnapshot()
    })

    test("tracker uses vercel/minimax/minimax-m2.7-highspeed when only gateway available", () => {
      // #given only Vercel AI Gateway is available
      const config = createConfig({ hasVercelAiGateway: true })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then tracker should use gateway-routed minimax (preferred over claude-haiku)
      expect(result.agents?.tracker?.model).toBe("vercel/minimax/minimax-m2.7-highspeed")
    })

    test("researcher uses vercel/minimax/minimax-m2.7 when only gateway available", () => {
      // #given only Vercel AI Gateway is available
      const config = createConfig({ hasVercelAiGateway: true })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then researcher should use gateway-routed minimax (preferred over claude-haiku)
      expect(result.agents?.researcher?.model).toBe("vercel/minimax/minimax-m2.7")
    })

    test("Founder is created when only Vercel AI Gateway is available", () => {
      // #given only Vercel AI Gateway is available
      const config = createConfig({ hasVercelAiGateway: true })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then founder should be created with gateway-routed gpt-5.5
      expect(result.agents?.founder?.model).toBe("vercel/openai/gpt-5.5")
    })

    test("native providers take priority over gateway", () => {
      // #given Claude and Vercel AI Gateway are both available
      const config = createConfig({ hasClaude: true, hasVercelAiGateway: true })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then should prefer native anthropic over gateway
      expect(result.agents?.chief?.model).toBe("anthropic/claude-opus-4-7")
    })
  })

  describe("schema URL", () => {
    test("always includes correct schema URL", () => {
      // #given any config
      const config = createConfig()

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then should include correct schema URL
      expect(result.$schema).toBe(
        "https://raw.githubusercontent.com/michaelxer/oh-my-cortex/dev/assets/oh-my-cortex.schema.json"
      )
    })
  })
})
