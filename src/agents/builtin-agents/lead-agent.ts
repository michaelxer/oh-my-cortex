import type { AgentConfig } from "@opencode-ai/sdk"
import type { AgentOverrides } from "../types"
import type { CategoriesConfig, CategoryConfig } from "../../config/schema"
import type { AvailableAgent, AvailableSkill } from "../dynamic-agent-prompt-builder"
import { AGENT_MODEL_REQUIREMENTS } from "../../shared"
import { applyOverrides } from "./agent-overrides"
import { applyModelResolution } from "./model-resolution"
import { createLeadAgent } from "../lead"

export function maybeCreateLeadConfig(input: {
  disabledAgents: string[]
  agentOverrides: AgentOverrides
  uiSelectedModel?: string
  availableModels: Set<string>
  systemDefaultModel?: string
  availableAgents: AvailableAgent[]
  availableSkills: AvailableSkill[]
  mergedCategories: Record<string, CategoryConfig>
  directory?: string
  userCategories?: CategoriesConfig
  useTaskSystem?: boolean
}): AgentConfig | undefined {
  const {
    disabledAgents,
    agentOverrides,
    uiSelectedModel,
    availableModels,
    systemDefaultModel,
    availableAgents,
    availableSkills,
    mergedCategories,
    directory,
    userCategories,
  } = input

  if (disabledAgents.includes("lead")) return undefined

  const orchestratorOverride = agentOverrides["lead"]
  const leadRequirement = AGENT_MODEL_REQUIREMENTS["lead"]

  const leadResolution = applyModelResolution({
    uiSelectedModel: orchestratorOverride?.model !== undefined ? undefined : uiSelectedModel,
    userModel: orchestratorOverride?.model,
    requirement: leadRequirement,
    availableModels,
    systemDefaultModel,
  })

  if (!leadResolution) return undefined
  const { model: leadModel, variant: leadResolvedVariant } = leadResolution

  let orchestratorConfig = createLeadAgent({
    model: leadModel,
    availableAgents,
    availableSkills,
    userCategories,
  })

  if (leadResolvedVariant) {
    orchestratorConfig = { ...orchestratorConfig, variant: leadResolvedVariant }
  }

  orchestratorConfig = applyOverrides(orchestratorConfig, orchestratorOverride, mergedCategories, directory)

  return orchestratorConfig
}
