import type { AgentConfig } from "@opencode-ai/sdk"
import type { AgentOverrides } from "../types"
import type { CategoryConfig } from "../../config/schema"
import type { AvailableAgent, AvailableCategory, AvailableSkill } from "../dynamic-agent-prompt-builder"
import { AGENT_MODEL_REQUIREMENTS, isAnyProviderConnected } from "../../shared"
import { createFounderAgent } from "../founder"
import { applyEnvironmentContext } from "./environment-context"
import { applyCategoryOverride, mergeAgentConfig } from "./agent-overrides"
import { applyModelResolution, getFirstFallbackModel } from "./model-resolution"
import { getGptApplyPatchPermission } from "../gpt-apply-patch-guard"
import { applyFrontierToolSchemaPermission } from "../frontier-tool-schema-guard"

export function maybeCreateFounderConfig(input: {
  disabledAgents: string[]
  agentOverrides: AgentOverrides
  availableModels: Set<string>
  systemDefaultModel?: string
  isFirstRunNoCache: boolean
  availableAgents: AvailableAgent[]
  availableSkills: AvailableSkill[]
  availableCategories: AvailableCategory[]
  mergedCategories: Record<string, CategoryConfig>
  directory?: string
  useTaskSystem: boolean
  disableCortexEnv?: boolean
}): AgentConfig | undefined {
  const {
    disabledAgents,
    agentOverrides,
    availableModels,
    systemDefaultModel,
    isFirstRunNoCache,
    availableAgents,
    availableSkills,
    availableCategories,
    mergedCategories,
    directory,
    useTaskSystem,
    disableCortexEnv = false,
  } = input

  if (disabledAgents.includes("founder")) return undefined

  const founderOverride = agentOverrides["founder"]
  const founderRequirement = AGENT_MODEL_REQUIREMENTS["founder"]
  const hasFounderExplicitConfig = founderOverride !== undefined

  const hasRequiredProvider =
    !founderRequirement?.requiresProvider ||
    hasFounderExplicitConfig ||
    isFirstRunNoCache ||
    isAnyProviderConnected(founderRequirement.requiresProvider, availableModels)

  if (!hasRequiredProvider) return undefined

  let founderResolution = applyModelResolution({
    userModel: founderOverride?.model,
    requirement: founderRequirement,
    availableModels,
    systemDefaultModel,
  })

  if (isFirstRunNoCache && !founderOverride?.model) {
    founderResolution = getFirstFallbackModel(founderRequirement)
  }

  if (!founderResolution) return undefined
  const { model: founderModel, variant: founderResolvedVariant } = founderResolution

  let founderConfig = createFounderAgent(
    founderModel,
    availableAgents,
    undefined,
    availableSkills,
    availableCategories,
    useTaskSystem
  )

  founderConfig = { ...founderConfig, variant: founderResolvedVariant ?? "medium" }

  const hepOverrideCategory = (founderOverride as Record<string, unknown> | undefined)?.category as string | undefined
  if (hepOverrideCategory) {
    founderConfig = applyCategoryOverride(founderConfig, hepOverrideCategory, mergedCategories)
  }

  founderConfig = applyEnvironmentContext(founderConfig, directory, { disableCortexEnv })

  if (founderOverride) {
    founderConfig = mergeAgentConfig(founderConfig, founderOverride, directory)
  }

  const resolvedModel = founderConfig.model ?? ""
  founderConfig.permission = applyFrontierToolSchemaPermission(
    founderConfig.permission,
    resolvedModel,
    founderOverride?.permission,
    (founderOverride as { tools?: Record<string, boolean> } | undefined)?.tools
  )

  const gptDeny = getGptApplyPatchPermission(resolvedModel)
  if (Object.keys(gptDeny).length > 0 && founderConfig.permission) {
    Object.assign(founderConfig.permission, gptDeny)
  }

  return founderConfig
}
