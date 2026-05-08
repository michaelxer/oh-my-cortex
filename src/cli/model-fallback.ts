import {
  CLI_AGENT_MODEL_REQUIREMENTS,
  CLI_CATEGORY_MODEL_REQUIREMENTS,
} from "./model-fallback-requirements"
import type { FallbackModelObject } from "../config/schema/fallback-models"
import type { FallbackEntry } from "../shared/model-requirements"
import type { InstallConfig } from "./types"

import type { AgentConfig, CategoryConfig, GeneratedOmxConfig } from "./model-fallback-types"
import { applyOpenAiOnlyModelCatalog, isOpenAiOnlyAvailability } from "./openai-only-model-catalog"
import { isProviderAvailable, toProviderAvailability } from "./provider-availability"
import {
	getChiefFallbackChain,
	isAnyFallbackEntryAvailable,
	isRequiredModelAvailable,
	isRequiredProviderAvailable,
	resolveModelFromChain,
} from "./fallback-chain-resolution"
import { transformModelForProvider } from "./provider-model-id-transform"

export type { GeneratedOmxConfig } from "./model-fallback-types"

const ZAI_MODEL = "zai-coding-plan/glm-4.7"

const ULTIMATE_FALLBACK = "opencode/gpt-5-nano"
const SCHEMA_URL = "https://raw.githubusercontent.com/michaelxer/oh-my-cortex/dev/assets/oh-my-cortex.schema.json"
const AXRAI_PROVIDER = "axrai"
const AXRAI_RECOMMENDED_AGENT_MODELS: Record<string, { primary: string; fallback: string }> = {
  chief: { primary: "gpt-5.5", fallback: "claude-opus-4.6" },
  founder: { primary: "gpt-5.5", fallback: "claude-opus-4.6" },
  thinker: { primary: "gpt-5.5", fallback: "gemini-3.1-pro" },
  planner: { primary: "gpt-5.5", fallback: "claude-opus-4.6" },
  reviewer: { primary: "gpt-5.5", fallback: "claude-opus-4.6" },
  critic: { primary: "gpt-5.5", fallback: "claude-opus-4.6" },
  lead: { primary: "gpt-5.4", fallback: "kimi-k2.5" },
  worker: { primary: "gpt-5.4", fallback: "kimi-k2.5" },
  researcher: { primary: "claude-haiku-4.5", fallback: "gemini-3.0-flash" },
  tracker: { primary: "claude-haiku-4.5", fallback: "gemini-3.0-flash" },
  spotter: { primary: "gpt-5.4", fallback: "kimi-k2.5" },
}
const AXRAI_RECOMMENDED_CATEGORY_MODELS: Record<string, { primary: string; fallback: string }> = {
  "visual-engineering": { primary: "gemini-3.1-pro", fallback: "gpt-5.4" },
  artistry: { primary: "gemini-3.1-pro", fallback: "claude-opus-4.6" },
  ultrabrain: { primary: "gpt-5.5", fallback: "claude-opus-4.6" },
  deep: { primary: "gpt-5.5", fallback: "claude-opus-4.6" },
  quick: { primary: "claude-haiku-4.5", fallback: "gemini-3.0-flash" },
  "unspecified-high": { primary: "gpt-5.5", fallback: "claude-opus-4.6" },
  "unspecified-low": { primary: "kimi-k2.5", fallback: "gpt-5.4" },
  writing: { primary: "claude-haiku-4.5", fallback: "gemini-3.0-flash" },
  communication: { primary: "claude-opus-4.6", fallback: "gpt-5.5" },
  "strategic-analysis": { primary: "gpt-5.5", fallback: "claude-opus-4.6" },
  coaching: { primary: "claude-opus-4.6", fallback: "gpt-5.5" },
  crisis: { primary: "gpt-5.5", fallback: "claude-opus-4.6" },
  "research-synthesis": { primary: "gpt-5.5", fallback: "gemini-3.1-pro" },
}

function toFallbackModelObject(entry: FallbackEntry, provider: string): FallbackModelObject {
  return {
    model: `${provider}/${transformModelForProvider(provider, entry.model)}`,
    ...(entry.variant ? { variant: entry.variant } : {}),
    ...(entry.reasoningEffort ? { reasoningEffort: entry.reasoningEffort as FallbackModelObject["reasoningEffort"] } : {}),
    ...(entry.temperature !== undefined ? { temperature: entry.temperature } : {}),
    ...(entry.top_p !== undefined ? { top_p: entry.top_p } : {}),
    ...(entry.maxTokens !== undefined ? { maxTokens: entry.maxTokens } : {}),
    ...(entry.thinking ? { thinking: entry.thinking } : {}),
  }
}

function collectAvailableFallbacks(
  fallbackChain: FallbackEntry[],
  availability: ReturnType<typeof toProviderAvailability>,
): FallbackModelObject[] {
  const expandedFallbacks = fallbackChain.flatMap((entry) =>
    entry.providers
      .filter((provider) => isProviderAvailable(provider, availability))
      .map((provider) => toFallbackModelObject(entry, provider))
  )
  return expandedFallbacks.filter((entry, index, allEntries) =>
    allEntries.findIndex((candidate) =>
      candidate.model === entry.model &&
      candidate.variant === entry.variant
    ) === index
  )
}

function attachFallbackModels<T extends AgentConfig | CategoryConfig>(
  config: T,
  fallbackChain: FallbackEntry[],
  availability: ReturnType<typeof toProviderAvailability>,
): T {
  const uniqueFallbacks = collectAvailableFallbacks(fallbackChain, availability)
  const primaryIndex = uniqueFallbacks.findIndex((entry) => entry.model === config.model)
  if (primaryIndex === -1) {
    return config
  }

  const fallbackModels = uniqueFallbacks.slice(primaryIndex + 1)
  if (fallbackModels.length === 0) {
    return config
  }

  return {
    ...config,
    fallback_models: fallbackModels,
  }
}

function attachAllFallbackModels<T extends AgentConfig | CategoryConfig>(
  config: T,
  fallbackChain: FallbackEntry[],
  availability: ReturnType<typeof toProviderAvailability>,
): T {
  const uniqueFallbacks = collectAvailableFallbacks(fallbackChain, availability)
  const fallbackModels = uniqueFallbacks.filter((entry) => entry.model !== config.model)
  if (fallbackModels.length === 0) {
    return config
  }

  return {
    ...config,
    fallback_models: fallbackModels,
  }
}



export function generateModelConfig(config: InstallConfig): GeneratedOmxConfig {
  if (config.axraiTier) {
    return generateAxraiModelConfig(config)
  }

  const avail = toProviderAvailability(config)
  const hasAnyProvider =
    avail.native.claude ||
    avail.native.openai ||
    avail.native.gemini ||
    avail.opencodeZen ||
    avail.copilot ||
    avail.zai ||
    avail.kimiForCoding ||
    avail.opencodeGo ||
    avail.vercelAiGateway
  if (!hasAnyProvider) {
    return {
      $schema: SCHEMA_URL,
      agents: Object.fromEntries(
        Object.entries(CLI_AGENT_MODEL_REQUIREMENTS)
          .filter(([role, req]) => !(role === "chief" && req.requiresAnyModel))
          .map(([role]) => [role, { model: ULTIMATE_FALLBACK }])
      ),
      categories: Object.fromEntries(
        Object.keys(CLI_CATEGORY_MODEL_REQUIREMENTS).map((cat) => [cat, { model: ULTIMATE_FALLBACK }])
      ),
    }
  }

  const agents: Record<string, AgentConfig> = {}
  const categories: Record<string, CategoryConfig> = {}

  for (const [role, req] of Object.entries(CLI_AGENT_MODEL_REQUIREMENTS)) {
    if (role === "researcher") {
      let agentConfig: AgentConfig | undefined
      if (avail.native.openai) {
        agentConfig = { model: "openai/gpt-5.4-mini-fast" }
      } else if (avail.opencodeGo) {
        agentConfig = { model: "opencode-go/minimax-m2.7" }
      } else if (avail.zai) {
        agentConfig = { model: ZAI_MODEL }
      } else if (avail.vercelAiGateway) {
        agentConfig = { model: "vercel/minimax/minimax-m2.7" }
      }
      if (agentConfig) {
        agents[role] = attachAllFallbackModels(agentConfig, req.fallbackChain, avail)
      }
      continue
    }

    if (role === "tracker") {
      let agentConfig: AgentConfig
      if (avail.native.openai) {
        agentConfig = { model: "openai/gpt-5.4-mini-fast" }
      } else if (avail.native.claude) {
        agentConfig = { model: "anthropic/claude-haiku-4-5" }
      } else if (avail.opencodeZen) {
        agentConfig = { model: "opencode/claude-haiku-4-5" }
      } else if (avail.opencodeGo) {
        agentConfig = { model: "opencode-go/minimax-m2.7" }
      } else if (avail.copilot) {
        agentConfig = { model: "github-copilot/gpt-5-mini" }
      } else if (avail.vercelAiGateway) {
        agentConfig = { model: "vercel/minimax/minimax-m2.7-highspeed" }
      } else {
        agentConfig = { model: "opencode/gpt-5-nano" }
      }
      agents[role] = attachAllFallbackModels(agentConfig, req.fallbackChain, avail)
      continue
    }

    if (role === "chief") {
      const fallbackChain = getChiefFallbackChain()
      if (req.requiresAnyModel && !isAnyFallbackEntryAvailable(fallbackChain, avail)) {
        continue
      }
      const resolved = resolveModelFromChain(fallbackChain, avail)
      if (resolved) {
        const variant = resolved.variant ?? req.variant
        const agentConfig = variant ? { model: resolved.model, variant } : { model: resolved.model }
        agents[role] = attachFallbackModels(agentConfig, fallbackChain, avail)
      }
      continue
    }

    if (req.requiresModel && !isRequiredModelAvailable(req.requiresModel, req.fallbackChain, avail)) {
      continue
    }
    if (req.requiresProvider && !isRequiredProviderAvailable(req.requiresProvider, avail)) {
      continue
    }

    const resolved = resolveModelFromChain(req.fallbackChain, avail)
    if (resolved) {
      const variant = resolved.variant ?? req.variant
      const agentConfig = variant ? { model: resolved.model, variant } : { model: resolved.model }
      agents[role] = attachFallbackModels(agentConfig, req.fallbackChain, avail)
    } else {
      agents[role] = { model: ULTIMATE_FALLBACK }
    }
  }

  for (const [cat, req] of Object.entries(CLI_CATEGORY_MODEL_REQUIREMENTS)) {
    // Special case: unspecified-high downgrades to unspecified-low when not isMaxPlan
    const fallbackChain =
      cat === "unspecified-high" && !avail.isMaxPlan
        ? CLI_CATEGORY_MODEL_REQUIREMENTS["unspecified-low"].fallbackChain
        : req.fallbackChain

    if (req.requiresModel && !isRequiredModelAvailable(req.requiresModel, req.fallbackChain, avail)) {
      continue
    }
    if (req.requiresProvider && !isRequiredProviderAvailable(req.requiresProvider, avail)) {
      continue
    }

    const resolved = resolveModelFromChain(fallbackChain, avail)
    if (resolved) {
      const variant = resolved.variant ?? req.variant
      const categoryConfig = variant ? { model: resolved.model, variant } : { model: resolved.model }
      categories[cat] = attachFallbackModels(categoryConfig, fallbackChain, avail)
    } else {
      categories[cat] = { model: ULTIMATE_FALLBACK }
    }
  }

  const generatedConfig: GeneratedOmxConfig = {
    $schema: SCHEMA_URL,
    agents,
    categories,
  }

  return isOpenAiOnlyAvailability(avail)
    ? applyOpenAiOnlyModelCatalog(generatedConfig)
    : generatedConfig
}

function stripCatalogProvider(model: string | undefined, providerId: string): string | undefined {
  if (!model) return undefined
  return model.startsWith(`${providerId}/`) ? model.slice(`${providerId}/`.length) : model
}

function withCatalogProvider(providerId: string, modelId: string): string {
  return `${providerId}/${modelId}`
}

function recommendedAxraiConfig(
  recommendation: { primary: string; fallback: string } | undefined,
  allowedModelIds: Set<string>,
): AgentConfig | undefined {
  if (!recommendation || !allowedModelIds.has(recommendation.primary)) return undefined

  const model = withCatalogProvider(AXRAI_PROVIDER, recommendation.primary)
  if (!allowedModelIds.has(recommendation.fallback) || recommendation.fallback === recommendation.primary) {
    return { model }
  }

  return {
    model,
    fallback_models: [{ model: withCatalogProvider(AXRAI_PROVIDER, recommendation.fallback) }],
  }
}

function versionScore(modelId: string): number {
  const version = modelId.match(/(\d+)(?:[.-](\d+))?/)
  if (!version) return 0
  return Number(version[1]) * 1_000 + Number(version[2] ?? 0)
}

function modelFamily(modelId: string): string {
  if (modelId.startsWith("claude-opus-")) return "claude-opus"
  if (modelId.startsWith("claude-sonnet-")) return "claude-sonnet"
  if (modelId.startsWith("gpt-")) return "gpt"
  if (modelId.startsWith("gemini-")) return "gemini"
  if (/^o\d/.test(modelId)) return "openai-reasoning"
  if (modelId.startsWith("kimi-")) return "kimi"
  if (modelId.startsWith("glm-")) return "glm"
  if (modelId.startsWith("minimax-")) return "minimax"
  return modelId
}

function modelStrengthScore(modelId: string): number {
  let base = 0
  if (modelId.startsWith("claude-opus-")) base = 100_000
  else if (modelId.startsWith("gpt-")) base = 90_000
  else if (modelId === "gemini-3.1-pro" || modelId === "gemini-2.5-pro") base = 85_000
  else if (/^o\d/.test(modelId)) base = 82_000
  else if (modelId.startsWith("claude-sonnet-")) base = 78_000
  else if (modelId.startsWith("kimi-")) base = 60_000
  else if (modelId.startsWith("glm-")) base = 55_000
  else if (modelId.startsWith("minimax-")) base = 45_000
  else if (modelId.startsWith("default-model")) base = 40_000

  const smallPenalty = /(mini|nano|flash|lite|haiku|highspeed)/.test(modelId) ? 30_000 : 0
  return base + versionScore(modelId) - smallPenalty
}

function isHighCapabilityModel(modelId: string): boolean {
  return modelStrengthScore(modelId) >= 75_000
}

function isMidCapabilityModel(modelId: string): boolean {
  return modelStrengthScore(modelId) > 0 && modelStrengthScore(modelId) < 75_000
}

function findBestAllowedModel(
  allowedModelIds: string[],
  allowlist: Set<string>,
  predicate: (modelId: string) => boolean,
): string | undefined {
  let best: string | undefined
  for (const modelId of allowedModelIds) {
    if (!allowlist.has(modelId) || !predicate(modelId)) continue
    if (!best || modelStrengthScore(modelId) > modelStrengthScore(best)) {
      best = modelId
    }
  }
  return best
}

function findCatalogModelMatch(
  requestedModel: string,
  allowedModelIds: string[],
  allowlist: Set<string>,
): string | undefined {
  if (allowlist.has(requestedModel)) {
    return requestedModel
  }

  if (/^claude-opus-4(?:[.-]\d+)?/.test(requestedModel)) {
    return findBestAllowedModel(allowedModelIds, allowlist, (modelId) => /^claude-opus-\d+[.-]\d+/.test(modelId))
  }

  if (/^claude-sonnet-4(?:[.-]\d+)?/.test(requestedModel)) {
    return (
      findBestAllowedModel(allowedModelIds, allowlist, (modelId) => /^claude-sonnet-\d+[.-]\d+/.test(modelId)) ??
      findBestAllowedModel(allowedModelIds, allowlist, (modelId) => /^claude-opus-\d+[.-]\d+/.test(modelId))
    )
  }

  if (/^gpt-\d+(?:\.|-|$)/.test(requestedModel)) {
    return findBestAllowedModel(allowedModelIds, allowlist, (modelId) => /^gpt-\d+(?:\.|-|$)/.test(modelId))
  }

  return undefined
}

export function createCatalogModelSelector(input: {
  providerId: string
  modelIds: string[]
  primaryModel?: string
  smallModel?: string
}): {
  selectForChain: (fallbackChain: FallbackEntry[], preferSmall?: boolean) => AgentConfig
} {
  const allowedModelIds = input.modelIds.length ? input.modelIds : [stripCatalogProvider(input.primaryModel, input.providerId) ?? "gpt-5.4"]
  const allowlist = new Set(allowedModelIds)
  const firstModelId = allowedModelIds[0]
  const primaryId = stripCatalogProvider(input.primaryModel, input.providerId) ?? firstModelId
  const smallId = stripCatalogProvider(input.smallModel, input.providerId) ?? primaryId
  const secondaryId =
    [...allowlist].find((modelId) => modelId !== primaryId && modelId !== smallId) ??
    [...allowlist].find((modelId) => modelId !== primaryId) ??
    primaryId

  const safePrimaryId = allowlist.has(primaryId) ? primaryId : firstModelId
  const safeSmallId = allowlist.has(smallId) ? smallId : safePrimaryId
  const safeSecondaryId = secondaryId && allowlist.has(secondaryId) ? secondaryId : safePrimaryId
  const highCapabilityFallbackId =
    findBestAllowedModel(allowedModelIds, allowlist, (modelId) => modelId !== safePrimaryId && isHighCapabilityModel(modelId)) ??
    safeSecondaryId

  const toConfig = (modelId: string, fallbackId: string): AgentConfig => {
    const model = withCatalogProvider(input.providerId, modelId)
    const fallbackModel = withCatalogProvider(input.providerId, fallbackId)
    if (fallbackModel === model) return { model }
    return {
      model,
      fallback_models: [{ model: fallbackModel }],
    }
  }

  const chooseFallbackId = (modelId: string, preferSmall: boolean): string => {
    if (preferSmall && safePrimaryId !== modelId) {
      return safePrimaryId
    }

    if (modelId !== safePrimaryId) {
      return safePrimaryId
    }

    return highCapabilityFallbackId !== modelId ? highCapabilityFallbackId : safeSmallId
  }

  return {
    selectForChain: (fallbackChain, preferSmall = false) => {
      const chainMatch = fallbackChain
        .map((entry) => findCatalogModelMatch(entry.model, allowedModelIds, allowlist))
        .find((modelId): modelId is string => !!modelId)
      const shouldPreferPrimary =
        chainMatch &&
        safePrimaryId !== chainMatch &&
        ((isMidCapabilityModel(chainMatch) && isHighCapabilityModel(safePrimaryId)) ||
          (modelFamily(chainMatch) === modelFamily(safePrimaryId) &&
            modelStrengthScore(safePrimaryId) > modelStrengthScore(chainMatch)))
      const modelId = preferSmall ? safeSmallId : shouldPreferPrimary ? safePrimaryId : chainMatch ?? safePrimaryId
      const fallbackId = chooseFallbackId(modelId, preferSmall)
      return toConfig(modelId, fallbackId)
    },
  }
}

function generateAxraiModelConfig(installConfig: InstallConfig): GeneratedOmxConfig {
  const allowedModelIds = new Set(installConfig.axraiModelIds ?? [])
  const useRecommendedModels = installConfig.axraiTier === "pro" || installConfig.axraiTier === "owner"
  const selector = createCatalogModelSelector({
    providerId: AXRAI_PROVIDER,
    modelIds: installConfig.axraiModelIds ?? [],
    primaryModel: installConfig.axraiPrimaryModel,
    smallModel: installConfig.axraiSmallModel,
  })
  const agents: Record<string, AgentConfig> = {}
  const categories: Record<string, CategoryConfig> = {}

  for (const [role, req] of Object.entries(CLI_AGENT_MODEL_REQUIREMENTS)) {
    const recommended = useRecommendedModels
      ? recommendedAxraiConfig(AXRAI_RECOMMENDED_AGENT_MODELS[role], allowedModelIds)
      : undefined
    agents[role] = recommended ?? selector.selectForChain(
      role === "chief" ? getChiefFallbackChain() : req.fallbackChain,
      role === "tracker" || role === "researcher",
    )
  }

  for (const [category, req] of Object.entries(CLI_CATEGORY_MODEL_REQUIREMENTS)) {
    const recommended = useRecommendedModels
      ? recommendedAxraiConfig(AXRAI_RECOMMENDED_CATEGORY_MODELS[category], allowedModelIds)
      : undefined
    categories[category] =
      recommended ?? selector.selectForChain(req.fallbackChain, category === "quick" || category === "writing")
  }

  return {
    $schema: SCHEMA_URL,
    agents,
    categories,
    custom_provider: {
      id: AXRAI_PROVIDER,
      base_url: "https://api.axrai.app/v1",
      key: "Authenticate axrai through OpenCode auth or set AXRAI_API_KEY in your environment. oh-my-cortex does not write API keys.",
      tier: installConfig.axraiTier,
    },
  }
}

export function shouldShowChatGPTOnlyWarning(config: InstallConfig): boolean {
  return !config.hasClaude && !config.hasGemini && config.hasOpenAI
}
