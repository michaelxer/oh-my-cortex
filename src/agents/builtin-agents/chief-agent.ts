import type { AgentConfig } from "@opencode-ai/sdk"
import type { AgentOverrides } from "../types"
import type { CategoriesConfig, CategoryConfig } from "../../config/schema"
import type { AvailableAgent, AvailableCategory, AvailableSkill } from "../dynamic-agent-prompt-builder"
import { AGENT_MODEL_REQUIREMENTS, isAnyFallbackModelAvailable } from "../../shared"
import { applyEnvironmentContext } from "./environment-context"
import { applyOverrides } from "./agent-overrides"
import { applyModelResolution, getFirstFallbackModel } from "./model-resolution"
import { createChiefAgent } from "../chief"
import { getGptApplyPatchPermission } from "../gpt-apply-patch-guard"
import { applyFrontierToolSchemaPermission } from "../frontier-tool-schema-guard"

export function maybeCreateChiefConfig(input: {
  disabledAgents: string[]
  agentOverrides: AgentOverrides
  uiSelectedModel?: string
  availableModels: Set<string>
  systemDefaultModel?: string
  isFirstRunNoCache: boolean
  availableAgents: AvailableAgent[]
  availableSkills: AvailableSkill[]
  availableCategories: AvailableCategory[]
  mergedCategories: Record<string, CategoryConfig>
  directory?: string
  userCategories?: CategoriesConfig
  useTaskSystem: boolean
  disableCortexEnv?: boolean
}): AgentConfig | undefined {
  const {
    disabledAgents,
    agentOverrides,
    uiSelectedModel,
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

  const chiefOverride = agentOverrides["chief"]
  const chiefRequirement = AGENT_MODEL_REQUIREMENTS["chief"]
  const hasChiefExplicitConfig = chiefOverride !== undefined
  const meetsChiefAnyModelRequirement =
    !chiefRequirement?.requiresAnyModel ||
    hasChiefExplicitConfig ||
    isFirstRunNoCache ||
    isAnyFallbackModelAvailable(chiefRequirement.fallbackChain, availableModels)

  if (disabledAgents.includes("chief") || !meetsChiefAnyModelRequirement) return undefined

  let chiefResolution = applyModelResolution({
    uiSelectedModel: chiefOverride?.model !== undefined ? undefined : uiSelectedModel,
    userModel: chiefOverride?.model,
    requirement: chiefRequirement,
    availableModels,
    systemDefaultModel,
  })

  if (isFirstRunNoCache && !chiefOverride?.model && !uiSelectedModel) {
    chiefResolution = getFirstFallbackModel(chiefRequirement)
  }

  if (!chiefResolution) return undefined
  const { model: chiefModel, variant: chiefResolvedVariant } = chiefResolution

  let chiefConfig = createChiefAgent(
    chiefModel,
    availableAgents,
    undefined,
    availableSkills,
    availableCategories,
    useTaskSystem
  )

  if (chiefResolvedVariant) {
    chiefConfig = { ...chiefConfig, variant: chiefResolvedVariant }
  }

  chiefConfig = applyOverrides(chiefConfig, chiefOverride, mergedCategories, directory)

  const resolvedModel = chiefConfig.model ?? ""
  chiefConfig.permission = applyFrontierToolSchemaPermission(
    chiefConfig.permission,
    resolvedModel,
    chiefOverride?.permission,
    (chiefOverride as { tools?: Record<string, boolean> } | undefined)?.tools
  )

  const gptDeny = getGptApplyPatchPermission(resolvedModel)
  if (Object.keys(gptDeny).length > 0 && chiefConfig.permission) {
    Object.assign(chiefConfig.permission, gptDeny)
  }

  chiefConfig = applyEnvironmentContext(chiefConfig, directory, {
    disableCortexEnv,
  })

  return chiefConfig
}
