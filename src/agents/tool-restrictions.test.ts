/// <reference types="bun-types" />

import { describe, test, expect } from "bun:test"
import { createThinkerAgent } from "./thinker"
import { createResearcherAgent } from "./researcher"
import { createExploreAgent } from "./tracker"
import { createCriticAgent } from "./critic"
import { createReviewerAgent } from "./reviewer"
import { createLeadAgent } from "./lead"
import { createChiefAgent } from "./chief"
import { createFounderAgent } from "./founder"

const TEST_MODEL = "anthropic/claude-sonnet-4-5"

describe("read-only agent tool restrictions", () => {
  const FILE_WRITE_TOOLS = ["write", "edit", "apply_patch"]

  describe("Thinker", () => {
    test("denies all file-writing tools", () => {
      // given
      const agent = createThinkerAgent(TEST_MODEL)

      // when
      const permission = agent.permission as Record<string, string>

      // then
      for (const tool of FILE_WRITE_TOOLS) {
        expect(permission[tool]).toBe("deny")
      }
    })

    test("denies task but allows call_cortex_agent for research", () => {
      // given
      const agent = createThinkerAgent(TEST_MODEL)

      // when
      const permission = agent.permission as Record<string, string>

      // then
      expect(permission["task"]).toBe("deny")
      expect(permission["call_cortex_agent"]).toBeUndefined()
    })
  })

  describe("Researcher", () => {
    test("denies all file-writing tools", () => {
      // given
      const agent = createResearcherAgent(TEST_MODEL)

      // when
      const permission = agent.permission as Record<string, string>

      // then
      for (const tool of FILE_WRITE_TOOLS) {
        expect(permission[tool]).toBe("deny")
      }
    })
  })

  describe("Tracker", () => {
    test("denies all file-writing tools", () => {
      // given
      const agent = createExploreAgent(TEST_MODEL)

      // when
      const permission = agent.permission as Record<string, string>

      // then
      for (const tool of FILE_WRITE_TOOLS) {
        expect(permission[tool]).toBe("deny")
      }
    })
  })

  describe("Critic", () => {
    test("denies all file-writing tools", () => {
      // given
      const agent = createCriticAgent(TEST_MODEL)

      // when
      const permission = agent.permission as Record<string, string>

      // then
      for (const tool of FILE_WRITE_TOOLS) {
        expect(permission[tool]).toBe("deny")
      }
    })
  })

  describe("Reviewer", () => {
    test("denies all file-writing tools", () => {
      // given
      const agent = createReviewerAgent(TEST_MODEL)

      // when
      const permission = agent.permission as Record<string, string>

      // then
      for (const tool of FILE_WRITE_TOOLS) {
        expect(permission[tool]).toBe("deny")
      }
    })
  })

  describe("Lead", () => {
    test("allows delegation tools for orchestration", () => {
      // given
      const agent = createLeadAgent({ model: TEST_MODEL })

      // when
      const permission = (agent.permission ?? {}) as Record<string, string>

      // then
      expect(permission["task"]).toBeUndefined()
      expect(permission["call_cortex_agent"]).toBeUndefined()
    })
  })

  describe("Chief GPT variants", () => {
    test("deny apply_patch for GPT models but not Claude models", () => {
      // given
      const gpt54Agent = createChiefAgent("openai/gpt-5.4")
      const gptGenericAgent = createChiefAgent("openai/gpt-5.2")
      const claudeAgent = createChiefAgent(TEST_MODEL)

      // when
      const gpt54Permission = (gpt54Agent.permission ?? {}) as Record<string, string>
      const gptGenericPermission = (gptGenericAgent.permission ?? {}) as Record<string, string>
      const claudePermission = (claudeAgent.permission ?? {}) as Record<string, string>

      // then
      expect(gpt54Permission["apply_patch"]).toBe("deny")
      expect(gptGenericPermission["apply_patch"]).toBe("deny")
      expect(claudePermission["apply_patch"]).toBeUndefined()
    })
  })

  describe("Chief and Founder frontier tool schema restrictions", () => {
    test("deny grep and glob for Opus 4.7 and GPT 5.5 models", () => {
      // given
      const frontierAgents = [
        createChiefAgent("anthropic/claude-opus-4-7"),
        createChiefAgent("anthropic/claude-opus-4.7"),
        createChiefAgent("openai/gpt-5.5"),
        createFounderAgent("anthropic/claude-opus-4-7"),
        createFounderAgent("anthropic/claude-opus-4.7"),
        createFounderAgent("openai/gpt-5.5"),
      ]

      // when
      const permissions = frontierAgents.map(
        (agent) => (agent.permission ?? {}) as Record<string, string>,
      )

      // then
      for (const permission of permissions) {
        expect(permission.grep).toBe("deny")
        expect(permission.glob).toBe("deny")
      }
    })

    test("keeps grep and glob available for other models", () => {
      // given
      const otherAgents = [
        createChiefAgent("anthropic/claude-sonnet-4-5"),
        createChiefAgent("openai/gpt-5.4"),
        createFounderAgent("openai/gpt-5.4"),
      ]

      // when
      const permissions = otherAgents.map(
        (agent) => (agent.permission ?? {}) as Record<string, string>,
      )

      // then
      for (const permission of permissions) {
        expect(permission.grep).toBeUndefined()
        expect(permission.glob).toBeUndefined()
      }
    })
  })
})
