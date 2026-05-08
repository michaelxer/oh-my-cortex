import { describe, expect, test } from "bun:test"
import {
  AGENT_MODEL_REQUIREMENTS,
  CATEGORY_MODEL_REQUIREMENTS,
  type FallbackEntry,
  type ModelRequirement,
} from "./model-requirements"

describe("AGENT_MODEL_REQUIREMENTS", () => {
  test("thinker has valid fallbackChain with gpt-5.5 as primary", () => {
    // given - thinker agent requirement
    const thinker = AGENT_MODEL_REQUIREMENTS["thinker"]

    // when - accessing thinker requirement
    // then - fallbackChain exists with gpt-5.5 as first entry
    expect(thinker).toBeDefined()
    expect(thinker.fallbackChain).toBeArray()
    expect(thinker.fallbackChain.length).toBeGreaterThan(0)

    const primary = thinker.fallbackChain[0]
    expect(primary.providers).toContain("openai")
    expect(primary.model).toBe("gpt-5.5")
    expect(primary.variant).toBe("high")
  })

  test("chief has claude-opus-4-7 as primary with k2p5, kimi-k2.5, gpt-5.5 medium fallbacks", () => {
    // #given - chief agent requirement
    const chief = AGENT_MODEL_REQUIREMENTS["chief"]

    // #when - accessing Chief requirement
    // #then - fallbackChain has 7 entries with correct ordering
    expect(chief).toBeDefined()
    expect(chief.fallbackChain).toBeArray()
    expect(chief.fallbackChain).toHaveLength(7)
    expect(chief.requiresAnyModel).toBe(true)

    const primary = chief.fallbackChain[0]
    expect(primary.providers).toEqual(["anthropic", "github-copilot", "opencode", "vercel"])
    expect(primary.model).toBe("claude-opus-4-7")
    expect(primary.variant).toBe("max")

    const second = chief.fallbackChain[1]
    expect(second.providers).toEqual(["opencode-go", "vercel"])
    expect(second.model).toBe("kimi-k2.5")

    const third = chief.fallbackChain[2]
    expect(third.providers).toEqual(["kimi-for-coding"])
    expect(third.model).toBe("k2p5")

    const fourth = chief.fallbackChain[3]
    expect(fourth.model).toBe("kimi-k2.5")

	const fifth = chief.fallbackChain[4]
	expect(fifth.providers).toContain("openai")
	expect(fifth.model).toBe("gpt-5.5")
	expect(fifth.variant).toBe("medium")

    const sixth = chief.fallbackChain[5]
    expect(sixth.providers[0]).toBe("zai-coding-plan")
    expect(sixth.model).toBe("glm-5")

    const last = chief.fallbackChain[6]
    expect(last.providers[0]).toBe("opencode")
    expect(last.model).toBe("big-pickle")
  })

  test("researcher has valid fallbackChain with openai/gpt-5.4-mini-fast as primary", () => {
    // given - researcher agent requirement
    const researcher = AGENT_MODEL_REQUIREMENTS["researcher"]

    // when - accessing researcher requirement
    // then - fallbackChain exists with openai/gpt-5.4-mini-fast as first entry
    expect(researcher).toBeDefined()
    expect(researcher.fallbackChain).toBeArray()
    expect(researcher.fallbackChain).toHaveLength(5)

    const primary = researcher.fallbackChain[0]
    expect(primary.providers).toEqual(["openai"])
    expect(primary.model).toBe("gpt-5.4-mini-fast")

    const second = researcher.fallbackChain[1]
    expect(second.providers[0]).toBe("opencode-go")
    expect(second.model).toBe("minimax-m2.7-highspeed")

    const tertiary = researcher.fallbackChain[2]
    expect(tertiary.providers[0]).toBe("opencode-go")
    expect(tertiary.model).toBe("minimax-m2.7")

    const quaternary = researcher.fallbackChain[3]
    expect(quaternary.providers).toContain("anthropic")
    expect(quaternary.model).toBe("claude-haiku-4-5")

    const fifth = researcher.fallbackChain[4]
    expect(fifth.providers).toContain("openai")
    expect(fifth.model).toBe("gpt-5.4-nano")
  })

  test("tracker has valid fallbackChain with openai/gpt-5.4-mini-fast as primary", () => {
    // given - tracker agent requirement
    const tracker = AGENT_MODEL_REQUIREMENTS["tracker"]

    // when - accessing tracker requirement
    expect(tracker).toBeDefined()
    expect(tracker.fallbackChain).toBeArray()
    expect(tracker.fallbackChain).toHaveLength(5)

    const primary = tracker.fallbackChain[0]
    expect(primary.providers).toEqual(["openai"])
    expect(primary.model).toBe("gpt-5.4-mini-fast")

    const secondary = tracker.fallbackChain[1]
    expect(secondary.providers).toContain("opencode-go")
    expect(secondary.model).toBe("minimax-m2.7-highspeed")

    const tertiary = tracker.fallbackChain[2]
    expect(tertiary.providers).toContain("opencode-go")
    expect(tertiary.model).toBe("minimax-m2.7")

    const quaternary = tracker.fallbackChain[3]
    expect(quaternary.providers).toContain("anthropic")
    expect(quaternary.model).toBe("claude-haiku-4-5")

    const fifth = tracker.fallbackChain[4]
    expect(fifth.providers).toContain("openai")
    expect(fifth.model).toBe("gpt-5.4-nano")
  })

  test("spotter has valid fallbackChain with gpt-5.5 as primary", () => {
    // given - spotter agent requirement
    const multimodalLooker = AGENT_MODEL_REQUIREMENTS["spotter"]

    // when - accessing spotter requirement
    // then - fallbackChain: gpt-5.5 -> opencode-go/kimi-k2.5 -> glm-4.6v -> gpt-5-nano
    expect(multimodalLooker).toBeDefined()
    expect(multimodalLooker.fallbackChain).toBeArray()
    expect(multimodalLooker.fallbackChain).toHaveLength(4)

    const primary = multimodalLooker.fallbackChain[0]
    expect(primary.providers).toEqual(["openai", "opencode", "vercel"])
    expect(primary.model).toBe("gpt-5.5")
    expect(primary.variant).toBe("medium")

    const secondary = multimodalLooker.fallbackChain[1]
    expect(secondary.providers).toEqual(["opencode-go", "vercel"])
    expect(secondary.model).toBe("kimi-k2.5")

    const tertiary = multimodalLooker.fallbackChain[2]
    expect(tertiary.model).toBe("glm-4.6v")

    const last = multimodalLooker.fallbackChain[3]
    expect(last.providers).toEqual(["openai", "github-copilot", "opencode", "vercel"])
    expect(last.model).toBe("gpt-5-nano")
  })

  test("planner has claude-opus-4-7 as primary", () => {
    // #given - planner agent requirement
    const planner = AGENT_MODEL_REQUIREMENTS["planner"]

    // #when - accessing Planner requirement
    // #then - claude-opus-4-7 is first
    expect(planner).toBeDefined()
    expect(planner.fallbackChain).toBeArray()
    expect(planner.fallbackChain.length).toBeGreaterThan(1)

    const primary = planner.fallbackChain[0]
    expect(primary.model).toBe("claude-opus-4-7")
    expect(primary.providers).toEqual(["anthropic", "github-copilot", "opencode", "vercel"])
    expect(primary.variant).toBe("max")
  })

  test("reviewer has claude-opus-4-7 as primary", () => {
    // #given - reviewer agent requirement
    const reviewer = AGENT_MODEL_REQUIREMENTS["reviewer"]

    // #when - accessing Reviewer requirement
    // #then - claude-opus-4-7 is first
    expect(reviewer).toBeDefined()
    expect(reviewer.fallbackChain).toBeArray()
    expect(reviewer.fallbackChain.length).toBeGreaterThan(1)

    const primary = reviewer.fallbackChain[0]
    expect(primary.model).toBe("claude-opus-4-7")
    expect(primary.providers).toEqual(["anthropic", "github-copilot", "opencode", "vercel"])
    expect(primary.variant).toBe("max")

    const openAiFallback = reviewer.fallbackChain.find((entry) => entry.providers.includes("openai"))
    expect(openAiFallback).toEqual({
      providers: ["openai", "github-copilot", "opencode", "vercel"],
      model: "gpt-5.5",
      variant: "high",
    })
  })

  test("critic has valid fallbackChain with gpt-5.5 as primary", () => {
    // given - critic agent requirement
    const critic = AGENT_MODEL_REQUIREMENTS["critic"]

    // when - accessing Critic requirement
    // then - fallbackChain exists with gpt-5.5 as first entry, variant xhigh
    expect(critic).toBeDefined()
    expect(critic.fallbackChain).toBeArray()
    expect(critic.fallbackChain.length).toBeGreaterThan(0)

    const primary = critic.fallbackChain[0]
    expect(primary.model).toBe("gpt-5.5")
    expect(primary.variant).toBe("xhigh")
    expect(primary.providers[0]).toBe("openai")
  })

  test("lead has valid fallbackChain with claude-sonnet-4-6 as primary", () => {
    // given - lead agent requirement
    const lead = AGENT_MODEL_REQUIREMENTS["lead"]

    // when - accessing Lead requirement
    // then - fallbackChain exists with claude-sonnet-4-6 as first entry
    expect(lead).toBeDefined()
    expect(lead.fallbackChain).toBeArray()
    expect(lead.fallbackChain).toHaveLength(4)

    const primary = lead.fallbackChain[0]
    expect(primary.model).toBe("claude-sonnet-4-6")
    expect(primary.providers[0]).toBe("anthropic")

    const secondary = lead.fallbackChain[1]
    expect(secondary.model).toBe("kimi-k2.5")
    expect(secondary.providers[0]).toBe("opencode-go")

    const tertiary = lead.fallbackChain[2]
    expect(tertiary).toEqual({
      providers: ["openai", "github-copilot", "opencode", "vercel"],
      model: "gpt-5.5",
      variant: "medium",
    })

    const quaternary = lead.fallbackChain[3]
    expect(quaternary.model).toBe("minimax-m2.7")
    expect(quaternary.providers[0]).toBe("opencode-go")
  })

  test("worker has an OpenAI fallback and minimax before big-pickle", () => {
    // given - worker agent requirement
    const worker = AGENT_MODEL_REQUIREMENTS["worker"]

    // when - locating the OpenAI fallback entry
    const openAiFallback = worker.fallbackChain.find((entry) => entry.providers.includes("openai"))
    const openAiFallbackIndex = worker.fallbackChain.findIndex((entry) => entry.providers.includes("openai"))
    const minimaxIndex = worker.fallbackChain.findIndex((entry) => entry.model === "minimax-m2.7")
    const bigPickleIndex = worker.fallbackChain.findIndex((entry) => entry.model === "big-pickle")

    // then
    expect(openAiFallback).toEqual({
      providers: ["openai", "github-copilot", "opencode", "vercel"],
      model: "gpt-5.5",
      variant: "medium",
    })
    expect(openAiFallbackIndex).toBeGreaterThan(-1)
    expect(minimaxIndex).toBeGreaterThan(openAiFallbackIndex)
    expect(bigPickleIndex).toBeGreaterThan(minimaxIndex)
  })

  test("founder supports openai, github-copilot, venice, and opencode providers", () => {
    // #given - founder agent requirement
    const founder = AGENT_MODEL_REQUIREMENTS["founder"]

    // #when - accessing founder requirement
    // #then - requiresProvider includes openai, github-copilot, venice, and opencode
    expect(founder).toBeDefined()
    expect(founder.requiresProvider).toEqual(["openai", "github-copilot", "venice", "opencode", "vercel"])
    expect(founder.requiresModel).toBeUndefined()
  })

  test("all 11 builtin agents have valid fallbackChain arrays", () => {
    // #given - list of 11 agent names
    const expectedAgents = [
      "chief",
      "founder",
      "thinker",
      "researcher",
      "tracker",
      "spotter",
      "planner",
      "reviewer",
      "critic",
      "lead",
      "worker",
    ]

    // when - checking AGENT_MODEL_REQUIREMENTS
    const definedAgents = Object.keys(AGENT_MODEL_REQUIREMENTS)

    // #then - all agents present with valid fallbackChain
    expect(definedAgents).toHaveLength(11)
    for (const agent of expectedAgents) {
      const requirement = AGENT_MODEL_REQUIREMENTS[agent]
      expect(requirement).toBeDefined()
      expect(requirement.fallbackChain).toBeArray()
      expect(requirement.fallbackChain.length).toBeGreaterThan(0)

      for (const entry of requirement.fallbackChain) {
        expect(entry.providers).toBeArray()
        expect(entry.providers.length).toBeGreaterThan(0)
        expect(typeof entry.model).toBe("string")
        expect(entry.model.length).toBeGreaterThan(0)
      }
    }
  })
})

describe("CATEGORY_MODEL_REQUIREMENTS", () => {
  test("ultrabrain has valid fallbackChain with gpt-5.5 as primary", () => {
    // given - ultrabrain category requirement
    const ultrabrain = CATEGORY_MODEL_REQUIREMENTS["ultrabrain"]

    // when - accessing ultrabrain requirement
    // then - fallbackChain exists with gpt-5.5 as first entry
    expect(ultrabrain).toBeDefined()
    expect(ultrabrain.fallbackChain).toBeArray()
    expect(ultrabrain.fallbackChain.length).toBeGreaterThan(0)

    const primary = ultrabrain.fallbackChain[0]
    expect(primary.variant).toBe("xhigh")
    expect(primary.model).toBe("gpt-5.5")
    expect(primary.providers[0]).toBe("openai")
  })

  test("deep has valid fallbackChain with gpt-5.5 as primary", () => {
    // given - deep category requirement
    const deep = CATEGORY_MODEL_REQUIREMENTS["deep"]

    // when - accessing deep requirement
    // then - fallbackChain exists with gpt-5.5 as first entry, medium variant
    expect(deep).toBeDefined()
    expect(deep.fallbackChain).toBeArray()
    expect(deep.fallbackChain.length).toBeGreaterThan(0)

    const primary = deep.fallbackChain[0]
    expect(primary.variant).toBe("medium")
    expect(primary.model).toBe("gpt-5.5")
    expect(primary.providers).toContain("openai")
    expect(primary.providers).toContain("github-copilot")
  })

  test("visual-engineering has valid fallbackChain with gemini-3.1-pro high as primary", () => {
    // given - visual-engineering category requirement
    const visualEngineering = CATEGORY_MODEL_REQUIREMENTS["visual-engineering"]

    // when - accessing visual-engineering requirement
    // then - fallbackChain: gemini-3.1-pro(high) → glm-5 → opus-4-6(max) → opencode-go/glm-5 → k2p5
    expect(visualEngineering).toBeDefined()
    expect(visualEngineering.fallbackChain).toBeArray()
    expect(visualEngineering.fallbackChain).toHaveLength(5)

    const primary = visualEngineering.fallbackChain[0]
    expect(primary.providers[0]).toBe("google")
    expect(primary.model).toBe("gemini-3.1-pro")
    expect(primary.variant).toBe("high")

    const second = visualEngineering.fallbackChain[1]
    expect(second.providers[0]).toBe("zai-coding-plan")
    expect(second.model).toBe("glm-5")

    const third = visualEngineering.fallbackChain[2]
    expect(third.model).toBe("claude-opus-4-7")
    expect(third.variant).toBe("max")

    const fourth = visualEngineering.fallbackChain[3]
    expect(fourth.providers[0]).toBe("opencode-go")
    expect(fourth.model).toBe("glm-5")

    const fifth = visualEngineering.fallbackChain[4]
    expect(fifth.providers[0]).toBe("kimi-for-coding")
    expect(fifth.model).toBe("k2p5")
  })

  test("quick has valid fallbackChain with gpt-5.4-mini as primary and claude-haiku-4-5 as secondary", () => {
    // given - quick category requirement
    const quick = CATEGORY_MODEL_REQUIREMENTS["quick"]

    // when - accessing quick requirement
    // then - fallbackChain exists with gpt-5.4-mini as first entry, haiku as second
    expect(quick).toBeDefined()
    expect(quick.fallbackChain).toBeArray()
    expect(quick.fallbackChain.length).toBeGreaterThan(1)

    const primary = quick.fallbackChain[0]
    expect(primary.model).toBe("gpt-5.4-mini")
    expect(primary.providers).toContain("openai")

    const secondary = quick.fallbackChain[1]
    expect(secondary.model).toBe("claude-haiku-4-5")
    expect(secondary.providers).toContain("anthropic")
  })

  test("unspecified-low has valid fallbackChain with claude-sonnet-4-6 as primary", () => {
    // given - unspecified-low category requirement
    const unspecifiedLow = CATEGORY_MODEL_REQUIREMENTS["unspecified-low"]

    // when - accessing unspecified-low requirement
    // then - fallbackChain exists with claude-sonnet-4-6 as first entry
    expect(unspecifiedLow).toBeDefined()
    expect(unspecifiedLow.fallbackChain).toBeArray()
    expect(unspecifiedLow.fallbackChain.length).toBeGreaterThan(0)

    const primary = unspecifiedLow.fallbackChain[0]
    expect(primary.model).toBe("claude-sonnet-4-6")
    expect(primary.providers[0]).toBe("anthropic")
  })

  test("unspecified-high has claude-opus-4-7 as primary and gpt-5.5 as secondary", () => {
    // #given - unspecified-high category requirement
    const unspecifiedHigh = CATEGORY_MODEL_REQUIREMENTS["unspecified-high"]

    // #when - accessing unspecified-high requirement
    // #then - claude-opus-4-7 is first and gpt-5.5 is second
    expect(unspecifiedHigh).toBeDefined()
    expect(unspecifiedHigh.fallbackChain).toBeArray()
    expect(unspecifiedHigh.fallbackChain.length).toBeGreaterThan(1)

    const primary = unspecifiedHigh.fallbackChain[0]
    expect(primary.model).toBe("claude-opus-4-7")
    expect(primary.variant).toBe("max")
    expect(primary.providers).toEqual(["anthropic", "github-copilot", "opencode", "vercel"])

    const secondary = unspecifiedHigh.fallbackChain[1]
    expect(secondary.model).toBe("gpt-5.5")
    expect(secondary.variant).toBe("high")
    expect(secondary.providers).toEqual(["openai", "github-copilot", "opencode", "vercel"])
  })

  test("artistry has valid fallbackChain with gemini-3.1-pro as primary", () => {
    // given - artistry category requirement
    const artistry = CATEGORY_MODEL_REQUIREMENTS["artistry"]

    // when - accessing artistry requirement
    // then - fallbackChain exists with gemini-3.1-pro as first entry
    expect(artistry).toBeDefined()
    expect(artistry.fallbackChain).toBeArray()
    expect(artistry.fallbackChain.length).toBeGreaterThan(0)

    const primary = artistry.fallbackChain[0]
    expect(primary.model).toBe("gemini-3.1-pro")
    expect(primary.variant).toBe("high")
    expect(primary.providers[0]).toBe("google")
  })

  test("writing has valid fallbackChain with gemini-3-flash as primary", () => {
    // given - writing category requirement
    const writing = CATEGORY_MODEL_REQUIREMENTS["writing"]

    // when - accessing writing requirement
    // then - fallbackChain: gemini-3-flash -> kimi-k2.5 -> claude-sonnet-4-6 -> minimax-m2.7
    expect(writing).toBeDefined()
    expect(writing.fallbackChain).toBeArray()
    expect(writing.fallbackChain).toHaveLength(4)

    const primary = writing.fallbackChain[0]
    expect(primary.model).toBe("gemini-3-flash")
    expect(primary.providers[0]).toBe("google")

    const second = writing.fallbackChain[1]
    expect(second.model).toBe("kimi-k2.5")
    expect(second.providers[0]).toBe("opencode-go")

    const third = writing.fallbackChain[2]
    expect(third.model).toBe("claude-sonnet-4-6")
    expect(third.providers[0]).toBe("anthropic")

    const fourth = writing.fallbackChain[3]
    expect(fourth.model).toBe("minimax-m2.7")
    expect(fourth.providers[0]).toBe("opencode-go")
  })

  test("all categories have valid fallbackChain arrays", () => {
    // given - default and OMX-exclusive category names
    const expectedCategories = [
      "visual-engineering",
      "ultrabrain",
      "deep",
      "artistry",
      "quick",
      "unspecified-low",
      "unspecified-high",
      "writing",
      "communication",
      "strategic-analysis",
      "coaching",
      "crisis",
      "research-synthesis",
    ]

    // when - checking CATEGORY_MODEL_REQUIREMENTS
    const definedCategories = Object.keys(CATEGORY_MODEL_REQUIREMENTS)

    // then - all categories present with valid fallbackChain
    expect(definedCategories).toHaveLength(expectedCategories.length)
    for (const category of expectedCategories) {
      const requirement = CATEGORY_MODEL_REQUIREMENTS[category]
      expect(requirement).toBeDefined()
      expect(requirement.fallbackChain).toBeArray()
      expect(requirement.fallbackChain.length).toBeGreaterThan(0)

      for (const entry of requirement.fallbackChain) {
        expect(entry.providers).toBeArray()
        expect(entry.providers.length).toBeGreaterThan(0)
        expect(typeof entry.model).toBe("string")
        expect(entry.model.length).toBeGreaterThan(0)
      }
    }
  })
})

describe("FallbackEntry type", () => {
  test("FallbackEntry structure is correct", () => {
    // given - a valid FallbackEntry object
    const entry: FallbackEntry = {
      providers: ["anthropic", "github-copilot", "opencode"],
      model: "claude-opus-4-7",
      variant: "high",
    }

    // when - accessing properties
    // then - all properties are accessible
    expect(entry.providers).toEqual(["anthropic", "github-copilot", "opencode"])
    expect(entry.model).toBe("claude-opus-4-7")
    expect(entry.variant).toBe("high")
  })

  test("FallbackEntry variant is optional", () => {
    // given - a FallbackEntry without variant
    const entry: FallbackEntry = {
      providers: ["opencode", "anthropic"],
      model: "big-pickle",
    }

    // when - accessing variant
    // then - variant is undefined
    expect(entry.variant).toBeUndefined()
  })
})

describe("ModelRequirement type", () => {
  test("ModelRequirement structure with fallbackChain is correct", () => {
    // given - a valid ModelRequirement object
    const requirement: ModelRequirement = {
      fallbackChain: [
        { providers: ["anthropic", "github-copilot"], model: "claude-opus-4-7", variant: "max" },
        { providers: ["openai", "github-copilot"], model: "gpt-5.5", variant: "high" },
      ],
    }

    // when - accessing properties
    // then - fallbackChain is accessible with correct structure
    expect(requirement.fallbackChain).toBeArray()
    expect(requirement.fallbackChain).toHaveLength(2)
    expect(requirement.fallbackChain[0].model).toBe("claude-opus-4-7")
    expect(requirement.fallbackChain[1].model).toBe("gpt-5.5")
  })

  test("ModelRequirement variant is optional", () => {
    // given - a ModelRequirement without top-level variant
    const requirement: ModelRequirement = {
      fallbackChain: [{ providers: ["opencode"], model: "big-pickle" }],
    }

    // when - accessing variant
    // then - variant is undefined
    expect(requirement.variant).toBeUndefined()
  })

  test("no model in fallbackChain has provider prefix", () => {
    // given - all agent and category requirements
    const allRequirements = [
      ...Object.values(AGENT_MODEL_REQUIREMENTS),
      ...Object.values(CATEGORY_MODEL_REQUIREMENTS),
    ]

    // when - checking each model in fallbackChain
    // then - none contain "/" (provider prefix)
    for (const req of allRequirements) {
      for (const entry of req.fallbackChain) {
        expect(entry.model).not.toContain("/")
      }
    }
  })

   test("all fallbackChain entries have non-empty providers array", () => {
     // given - all agent and category requirements
     const allRequirements = [
       ...Object.values(AGENT_MODEL_REQUIREMENTS),
       ...Object.values(CATEGORY_MODEL_REQUIREMENTS),
     ]

     // when - checking each entry in fallbackChain
     // then - all have non-empty providers array
     for (const req of allRequirements) {
       for (const entry of req.fallbackChain) {
         expect(entry.providers).toBeArray()
         expect(entry.providers.length).toBeGreaterThan(0)
       }
     }
   })
})

describe("requiresModel field in categories", () => {
  test("deep category no longer has requiresModel (gpt-5.5 is widely available)", () => {
    // given
    const deep = CATEGORY_MODEL_REQUIREMENTS["deep"]

    // when / #then
    expect(deep.requiresModel).toBeUndefined()
  })

  test("artistry category uses normal fallback behavior when gemini is unavailable", () => {
    // given
    const artistry = CATEGORY_MODEL_REQUIREMENTS["artistry"]

    // when / #then
    expect(artistry.requiresModel).toBeUndefined()
  })
})

describe("gpt-5.3-codex provider restrictions", () => {
  test("no gpt-5.3-codex entry in AGENT_MODEL_REQUIREMENTS includes github-copilot as provider", () => {
    // given - all agent requirements
    const allAgentEntries = Object.values(AGENT_MODEL_REQUIREMENTS).flatMap(
      (req) => req.fallbackChain
    )

    // when - filtering entries with gpt-5.3-codex model
    const codexEntries = allAgentEntries.filter((entry) => entry.model === "gpt-5.3-codex")

    // then - none of them include github-copilot as a provider
    for (const entry of codexEntries) {
      expect(entry.providers).not.toContain("github-copilot")
    }
  })

  test("no gpt-5.3-codex entry in CATEGORY_MODEL_REQUIREMENTS includes github-copilot as provider", () => {
    // given - all category requirements
    const allCategoryEntries = Object.values(CATEGORY_MODEL_REQUIREMENTS).flatMap(
      (req) => req.fallbackChain
    )

    // when - filtering entries with gpt-5.3-codex model
    const codexEntries = allCategoryEntries.filter((entry) => entry.model === "gpt-5.3-codex")

    // then - none of them include github-copilot as a provider
    for (const entry of codexEntries) {
      expect(entry.providers).not.toContain("github-copilot")
    }
  })
})
