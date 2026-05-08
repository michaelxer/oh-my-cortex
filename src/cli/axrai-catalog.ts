import type { AxraiTier } from "./types"

export const AXRAI_CATALOG_URL = "https://api.axrai.app/v1/models.json"
export const AXRAI_OWNER_CATALOG_URL = "https://api.axrai.app/v1/catalog"
export const AXRAI_BASE_URL = "https://api.axrai.app/v1"

type UnknownRecord = Record<string, unknown>

export interface AxraiTierConfig {
  tier: AxraiTier
  modelIds: string[]
  providerId: string
  primaryModel: string
  smallModel: string
  openCodeConfig: UnknownRecord
}

function isRecord(value: unknown): value is UnknownRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function cloneRecord(value: UnknownRecord): UnknownRecord {
  return structuredClone(value) as UnknownRecord
}

function stripAxraiProvider(model: string): string {
  return model.startsWith("axrai/") ? model.slice("axrai/".length) : model
}

function getAxraiProviderConfig(config: UnknownRecord): UnknownRecord {
  const provider = config.provider
  const axraiProvider = isRecord(provider) ? provider.axrai : undefined
  if (!isRecord(axraiProvider)) {
    throw new Error("Missing axrAI provider config")
  }
  return axraiProvider
}

function getModelIdsFromConfig(config: UnknownRecord): string[] {
  const axraiProvider = getAxraiProviderConfig(config)
  const models = axraiProvider.models
  if (!isRecord(models)) return []
  return Object.keys(models).filter((id) => id.length > 0)
}

function removeAxraiApiKeyOption(config: UnknownRecord): UnknownRecord {
  const cloned = cloneRecord(config)
  const provider = cloned.provider
  if (!isRecord(provider)) return cloned
  const axraiProvider = provider.axrai
  if (!isRecord(axraiProvider)) return cloned
  if (isRecord(axraiProvider.options)) {
    delete axraiProvider.options.apiKey
  }
  return cloned
}

function validateAxraiProviderConfig(config: UnknownRecord): void {
  const axraiProvider = getAxraiProviderConfig(config)
  const options = axraiProvider.options
  const baseURL = isRecord(options) ? options.baseURL : undefined
  if (baseURL !== AXRAI_BASE_URL) {
    throw new Error("Unexpected axrAI baseURL")
  }
}

function validateSelectedModels(
  modelIds: string[],
  primaryModel: unknown,
  smallModel: unknown,
  label: string,
): { primaryModel: string; smallModel: string } {
  if (typeof primaryModel !== "string" || !primaryModel.startsWith("axrai/")) {
    throw new Error(`Missing axrAI primary model for ${label}`)
  }
  if (typeof smallModel !== "string" || !smallModel.startsWith("axrai/")) {
    throw new Error(`Missing axrAI small model for ${label}`)
  }
  if (!modelIds.includes(stripAxraiProvider(primaryModel)) || !modelIds.includes(stripAxraiProvider(smallModel))) {
    throw new Error(`axrAI ${label} OpenCode models are not present in model_ids`)
  }
  return { primaryModel, smallModel }
}

export async function fetchAxraiCatalog(): Promise<UnknownRecord> {
  const res = await fetch(AXRAI_CATALOG_URL)
  if (!res.ok) {
    throw new Error(`Failed to fetch axrAI catalog: ${res.status}`)
  }

  const catalog = await res.json()
  if (!isRecord(catalog) || catalog.object !== "axrai.model_catalog") {
    throw new Error("Invalid axrAI catalog response")
  }

  return catalog
}

export async function fetchAxraiOwnerCatalog(ownerKey = process.env.AXRAI_API_KEY): Promise<UnknownRecord> {
  if (!ownerKey) {
    throw new Error("AXR owner API key is missing or invalid.")
  }

  const res = await fetch(AXRAI_OWNER_CATALOG_URL, {
    headers: {
      Authorization: `Bearer ${ownerKey}`,
    },
  })

  if (res.status === 401) {
    throw new Error("AXR owner API key is missing or invalid.")
  }
  if (res.status === 403) {
    throw new Error("This AXR key does not have access to the requested catalog.")
  }
  if (!res.ok) {
    throw new Error(`Failed to fetch axrAI owner catalog: ${res.status}`)
  }

  const catalog = await res.json()
  if (!isRecord(catalog) || catalog.object !== "axrai.model_catalog") {
    throw new Error("Invalid axrAI owner catalog response")
  }

  return catalog
}

export function getAxraiOpenCodeConfig(catalog: UnknownRecord, tier: AxraiTier): AxraiTierConfig {
  if (tier === "owner") {
    return getAxraiOwnerOpenCodeConfig(catalog)
  }

  const tiers = catalog.tiers
  if (!isRecord(tiers)) {
    throw new Error("Missing axrAI tiers")
  }

  const tierCatalog = tiers[tier]
  if (!isRecord(tierCatalog)) {
    throw new Error(`Missing axrAI tier: ${tier}`)
  }

  const modelIds = tierCatalog.model_ids
  if (!Array.isArray(modelIds) || modelIds.length === 0 || !modelIds.every((id) => typeof id === "string" && id.length > 0)) {
    throw new Error(`axrAI tier ${tier} has no models`)
  }

  const opencode = tierCatalog.opencode
  if (!isRecord(opencode)) {
    throw new Error(`Missing axrAI OpenCode config for tier: ${tier}`)
  }

  const config = opencode.config
  if (!isRecord(config)) {
    throw new Error(`Missing axrAI OpenCode config for tier: ${tier}`)
  }

  validateAxraiProviderConfig(config)

  const providerId = opencode.provider_id
  const primaryModel = opencode.model ?? config.model
  const smallModel = opencode.small_model ?? config.small_model ?? primaryModel
  if (providerId !== "axrai") {
    throw new Error("Unexpected axrAI provider id")
  }
  const selected = validateSelectedModels(modelIds, primaryModel, smallModel, `tier ${tier}`)

  return {
    tier,
    modelIds: [...modelIds],
    providerId,
    primaryModel: selected.primaryModel,
    smallModel: selected.smallModel,
    openCodeConfig: removeAxraiApiKeyOption(config),
  }
}

export function getAxraiOwnerOpenCodeConfig(catalog: UnknownRecord): AxraiTierConfig {
  if (catalog.object !== "axrai.model_catalog") {
    throw new Error("Invalid axrAI owner catalog response")
  }
  if (catalog.access_type !== "owner" || catalog.key_type !== "owner") {
    throw new Error("AXR catalog response is not Owner / Full Access")
  }

  const tiers = catalog.tiers
  if (!isRecord(tiers) || !isRecord(tiers.plus) || !isRecord(tiers.trial) || !isRecord(tiers.pro)) {
    throw new Error("Missing axrAI owner tiers")
  }

  const opencode = catalog.opencode
  if (!isRecord(opencode)) {
    throw new Error("Missing axrAI Owner OpenCode config")
  }

  const config = opencode.config
  if (!isRecord(config)) {
    throw new Error("Missing axrAI Owner OpenCode config")
  }

  validateAxraiProviderConfig(config)

  const providerId = opencode.provider_id ?? "axrai"
  if (providerId !== "axrai") {
    throw new Error("Unexpected axrAI provider id")
  }

  const catalogModelIds = catalog.model_ids
  const modelIds =
    Array.isArray(catalogModelIds) && catalogModelIds.every((id) => typeof id === "string" && id.length > 0)
      ? [...catalogModelIds]
      : getModelIdsFromConfig(config)
  if (modelIds.length === 0) {
    throw new Error("axrAI Owner catalog has no models")
  }

  const primaryModel = opencode.model ?? config.model
  const smallModel = opencode.small_model ?? config.small_model ?? primaryModel
  const selected = validateSelectedModels(modelIds, primaryModel, smallModel, "Owner / Full Access")

  return {
    tier: "owner",
    modelIds,
    providerId,
    primaryModel: selected.primaryModel,
    smallModel: selected.smallModel,
    openCodeConfig: removeAxraiApiKeyOption(config),
  }
}
