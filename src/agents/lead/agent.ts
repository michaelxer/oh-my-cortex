/**
 * Lead - Master Orchestrator Agent
 *
 * Orchestrates work via task() to complete ALL tasks in a todo list until fully done.
 * You are the conductor of a symphony of specialized agents.
 *
 * Routing:
 * 1. GPT models (openai/*, github-copilot/gpt-*) → gpt.ts (GPT-5.4 optimized)
 * 2. Gemini models (google/*, google-vertex/*) → gemini.ts (Gemini-optimized)
 * 3. Default (Claude, etc.) → default.ts (Claude-optimized)
 */

import type { AgentConfig } from "@opencode-ai/sdk"
import type { AgentMode, AgentPromptMetadata } from "../types"
import { isGptModel, isGeminiModel } from "../types"
import type { AvailableAgent, AvailableSkill, AvailableCategory } from "../dynamic-agent-prompt-builder"
import { buildAgentIdentitySection, buildCategorySkillsDelegationGuide } from "../dynamic-agent-prompt-builder"
import type { CategoryConfig } from "../../config/schema"
import { mergeCategories } from "../../shared/merge-categories"

import { getDefaultLeadPrompt } from "./default"
import { getGptLeadPrompt } from "./gpt"
import { getGeminiLeadPrompt } from "./gemini"
import {
  getCategoryDescription,
  buildAgentSelectionSection,
  buildCategorySection,
  buildSkillsSection,
  buildDecisionMatrix,
} from "./prompt-section-builder"

const MODE: AgentMode = "subagent"

export type LeadPromptSource = "default" | "gpt" | "gemini"

/**
 * Determines which Lead prompt to use based on model.
 */
export function getLeadPromptSource(model?: string): LeadPromptSource {
  if (model && isGptModel(model)) {
    return "gpt"
  }
  if (model && isGeminiModel(model)) {
    return "gemini"
  }
  return "default"
}

export interface OrchestratorContext {
  model?: string
  availableAgents?: AvailableAgent[]
  availableSkills?: AvailableSkill[]
  userCategories?: Record<string, CategoryConfig>
}

/**
 * Gets the appropriate Lead prompt based on model.
 */
export function getLeadPrompt(model?: string): string {
  const source = getLeadPromptSource(model)

  switch (source) {
    case "gpt":
      return getGptLeadPrompt()
    case "gemini":
      return getGeminiLeadPrompt()
    case "default":
    default:
      return getDefaultLeadPrompt()
  }
}

function buildDynamicOrchestratorPrompt(ctx?: OrchestratorContext): string {
  const agents = ctx?.availableAgents ?? []
  const skills = ctx?.availableSkills ?? []
  const userCategories = ctx?.userCategories
  const model = ctx?.model

  const allCategories = mergeCategories(userCategories)
  const availableCategories: AvailableCategory[] = Object.entries(allCategories).map(([name]) => ({
    name,
    description: getCategoryDescription(name, userCategories),
  }))

  const categorySection = buildCategorySection(userCategories)
  const agentSection = buildAgentSelectionSection(agents)
  const decisionMatrix = buildDecisionMatrix(agents, userCategories)
  const skillsSection = buildSkillsSection(skills)
  const categorySkillsGuide = buildCategorySkillsDelegationGuide(availableCategories, skills)

  const agentIdentity = buildAgentIdentitySection(
    "Lead",
    "Master Orchestrator agent from OhMyCortex that coordinates specialized agents to complete todo lists",
  )
  const basePrompt = getLeadPrompt(model)

  return agentIdentity + "\n" + basePrompt
    .replace("{CATEGORY_SECTION}", categorySection)
    .replace("{AGENT_SECTION}", agentSection)
    .replace("{DECISION_MATRIX}", decisionMatrix)
    .replace("{SKILLS_SECTION}", skillsSection)
    .replace("{{CATEGORY_SKILLS_DELEGATION_GUIDE}}", categorySkillsGuide)
}

export function createLeadAgent(ctx: OrchestratorContext): AgentConfig {
  const baseConfig = {
    description:
      "Orchestrates work via task() to complete ALL tasks in a todo list until fully done. (Lead - OhMyCortex)",
    mode: MODE,
    ...(ctx.model ? { model: ctx.model } : {}),
    temperature: 0.1,
    prompt: buildDynamicOrchestratorPrompt(ctx),
    color: "#10B981",
  }

  return baseConfig as AgentConfig
}
createLeadAgent.mode = MODE

export const leadPromptMetadata: AgentPromptMetadata = {
  category: "advisor",
  cost: "EXPENSIVE",
  promptAlias: "Lead",
  triggers: [
    {
      domain: "Todo list orchestration",
      trigger: "Complete ALL tasks in a todo list with verification",
    },
    {
      domain: "Multi-agent coordination",
      trigger: "Parallel task execution across specialized agents",
    },
  ],
  useWhen: [
    "User provides a todo list path (.cortex/plans/{name}.md)",
    "Multiple tasks need to be completed in sequence or parallel",
    "Work requires coordination across multiple specialized agents",
  ],
  avoidWhen: [
    "Single simple task that doesn't require orchestration",
    "Tasks that can be handled directly by one agent",
    "When user wants to execute tasks manually",
  ],
  keyTrigger:
    "Todo list path provided OR multiple tasks requiring multi-agent orchestration",
}
