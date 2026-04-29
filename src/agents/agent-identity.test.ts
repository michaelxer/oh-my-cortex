/// <reference types="bun-types" />

import { describe, it, expect } from "bun:test"
import { buildAgentIdentitySection } from "./dynamic-agent-core-sections"
import { createChiefAgent } from "./chief"
import { createFounderAgent } from "./founder"
import { mergeAgentConfig } from "./builtin-agents/agent-overrides"

describe("buildAgentIdentitySection", () => {
  describe("#given an agent name and role description", () => {
    describe("#when building the identity section", () => {
      it("#then includes the agent name prominently", () => {
        const result = buildAgentIdentitySection("Chief", "Powerful AI orchestrator from OhMyCortex")

        expect(result).toContain("Chief")
      })

      it("#then includes the role description", () => {
        const result = buildAgentIdentitySection("Chief", "Powerful AI orchestrator from OhMyCortex")

        expect(result).toContain("Powerful AI orchestrator from OhMyCortex")
      })

      it("#then wraps content in an identity XML tag", () => {
        const result = buildAgentIdentitySection("Founder", "Autonomous deep worker")

        expect(result).toContain("<agent-identity>")
        expect(result).toContain("</agent-identity>")
      })

      it("#then explicitly states this identity overrides any prior identity", () => {
        const result = buildAgentIdentitySection("Chief", "Powerful AI orchestrator from OhMyCortex")

        expect(result).toMatch(/override|supersede|replace|disregard|instead of/i)
      })
    })
  })

  describe("#given different agent names", () => {
    describe("#when building identity for each", () => {
      it("#then each identity section contains the correct agent name", () => {
        const chief = buildAgentIdentitySection("Chief", "AI orchestrator")
        const founder = buildAgentIdentitySection("Founder", "Autonomous deep worker")
        const thinker = buildAgentIdentitySection("Thinker", "Strategic advisor")

        expect(chief).toContain("Chief")
        expect(chief).not.toContain("Founder")
        expect(founder).toContain("Founder")
        expect(founder).not.toContain("Chief")
        expect(thinker).toContain("Thinker")
      })
    })
  })
})

describe("Chief prompt identity", () => {
  describe("#given a Chief agent created with default model", () => {
    describe("#when checking the prompt", () => {
      it("#then contains the agent identity section with override directive", () => {
        const config = createChiefAgent("anthropic/claude-opus-4-7")

        expect(config.prompt).toContain("<agent-identity>")
        expect(config.prompt).toContain("Chief")
        expect(config.prompt).toContain("</agent-identity>")
      })

      it("#then identity section appears before the Role section", () => {
        const config = createChiefAgent("anthropic/claude-opus-4-7")
        const prompt = config.prompt ?? ""
        const identityIndex = prompt.indexOf("<agent-identity>")
        const roleIndex = prompt.indexOf("<Role>")

        expect(identityIndex).toBeGreaterThanOrEqual(0)
        expect(roleIndex).toBeGreaterThan(identityIndex)
      })
    })
  })

  describe("#given a Chief agent created with GPT-5.4 model", () => {
    describe("#when checking the prompt", () => {
      it("#then contains the agent identity section", () => {
        const config = createChiefAgent("openai/gpt-5.4")

        expect(config.prompt).toContain("<agent-identity>")
        expect(config.prompt).toContain("Chief")
        expect(config.prompt).toContain("</agent-identity>")
      })
    })
  })
})

describe("Founder prompt identity", () => {
  describe("#given a Founder agent created with GPT model", () => {
    describe("#when checking the prompt", () => {
      it("#then contains the agent identity section", () => {
        const config = createFounderAgent("openai/gpt-5.4")

        expect(config.prompt).toContain("<agent-identity>")
        expect(config.prompt).toContain("Founder")
        expect(config.prompt).toContain("</agent-identity>")
      })

      it("#then identity section appears at the start of the prompt", () => {
        const config = createFounderAgent("openai/gpt-5.4")
        const prompt = config.prompt ?? ""
        const identityIndex = prompt.indexOf("<agent-identity>")

        expect(identityIndex).toBe(0)
      })
    })
  })
})

describe("Agent identity preservation through overrides", () => {
  describe("#given a Chief agent with prompt_append override", () => {
    describe("#when merging the override", () => {
      it("#then identity section is preserved in the merged prompt", () => {
        const baseConfig = createChiefAgent("anthropic/claude-opus-4-7")
        const merged = mergeAgentConfig(baseConfig, { prompt_append: "Extra instructions here" })

        expect(merged.prompt).toContain("<agent-identity>")
        expect(merged.prompt).toContain("Chief")
        expect(merged.prompt).toContain("</agent-identity>")
        expect(merged.prompt).toContain("Extra instructions here")
      })
    })
  })

  describe("#given a Chief agent with model override only", () => {
    describe("#when merging the override", () => {
      it("#then identity section is preserved unchanged", () => {
        const baseConfig = createChiefAgent("anthropic/claude-opus-4-7")
        const merged = mergeAgentConfig(baseConfig, { model: "openai/gpt-5.4" })

        expect(merged.prompt).toContain("<agent-identity>")
        expect(merged.prompt).toContain("Chief")
        expect(merged.prompt).toContain("</agent-identity>")
      })
    })
  })
})
