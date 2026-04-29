import type { OhMyCortexConfig } from "../config"
import type { AgentOverrides } from "../config/schema/agent-overrides"
import { getSessionAgent } from "../features/claude-code-session-state"
import { log } from "../shared"
import { getAgentConfigKey } from "../shared/agent-display-names"
import { scheduleDeferredModelOverride } from "./deepwork-db-model-override"
import { resolveValidDeepworkVariant } from "./deepwork-variant-availability"

const CODE_BLOCK = /```[\s\S]*?```/g
const INLINE_CODE = /`[^`]+`/g
const DEEPWORK_PATTERN = /\b(deepwork|dw)\b/i

export function detectDeepwork(text: string): boolean {
  const clean = text.replace(CODE_BLOCK, "").replace(INLINE_CODE, "")
  return DEEPWORK_PATTERN.test(clean)
}

function extractPromptText(parts: Array<{ type: string; text?: string }>): string {
  return parts.filter((part) => part.type === "text").map((part) => part.text || "").join("")
}

type ToastFn = {
  showToast: (o: { body: Record<string, unknown> }) => Promise<unknown>
}

function showToast(tui: unknown, title: string, message: string): void {
  const toastFn = tui as Partial<ToastFn>
  if (typeof toastFn.showToast !== "function") return
  toastFn.showToast({
    body: { title, message, variant: "warning" as const, duration: 3000 },
  }).catch(() => {})
}

export type DeepworkOverrideResult = {
  providerID?: string
  modelID?: string
  variant?: string
}

type ModelDescriptor = {
  providerID: string
  modelID: string
}

function isSameModel(current: unknown, target: ModelDescriptor): boolean {
  if (typeof current !== "object" || current === null) return false
  const currentRecord = current as Record<string, unknown>
  return currentRecord["providerID"] === target.providerID && currentRecord["modelID"] === target.modelID
}

function getMessageModel(current: unknown): ModelDescriptor | undefined {
  if (typeof current !== "object" || current === null) return undefined
  const currentRecord = current as Record<string, unknown>
  const providerID = currentRecord["providerID"]
  const modelID = currentRecord["modelID"]
  if (typeof providerID !== "string" || typeof modelID !== "string") return undefined
  return { providerID, modelID }
}

export function resolveDeepworkOverride(
  pluginConfig: OhMyCortexConfig,
  inputAgentName: string | undefined,
  output: {
    message: Record<string, unknown>
    parts: Array<{ type: string; text?: string; [key: string]: unknown }>
  },
  sessionID?: string,
): DeepworkOverrideResult | null {
  const promptText = extractPromptText(output.parts)
  if (!detectDeepwork(promptText)) return null

  const messageAgentName =
    typeof output.message["agent"] === "string" ? (output.message["agent"] as string) : undefined
  const sessionAgentName = sessionID ? getSessionAgent(sessionID) : undefined
  const rawAgentName = inputAgentName ?? messageAgentName ?? sessionAgentName
  if (!rawAgentName || !pluginConfig.agents) return null

  const agentConfigKey = getAgentConfigKey(rawAgentName)
  const agentConfig = pluginConfig.agents[agentConfigKey as keyof AgentOverrides]
  const deepworkConfig = agentConfig?.deepwork
  if (!deepworkConfig?.model && !deepworkConfig?.variant) return null

  if (!deepworkConfig.model) {
    return { variant: deepworkConfig.variant }
  }

  const modelParts = deepworkConfig.model.split("/")
  if (modelParts.length < 2) return null

  return {
    providerID: modelParts[0],
    modelID: modelParts.slice(1).join("/"),
    variant: deepworkConfig.variant,
  }
}

function applyResolvedDeepworkOverride(args: {
  override: DeepworkOverrideResult
  validatedVariant: string | undefined
  output: { message: Record<string, unknown> }
  inputAgentName: string | undefined
  tui: unknown
}): void {
  const { override, validatedVariant, output, inputAgentName, tui } = args
  if (validatedVariant) {
    output.message["variant"] = validatedVariant
    output.message["thinking"] = validatedVariant
  }

  if (!override.providerID || !override.modelID) return

  const targetModel = { providerID: override.providerID, modelID: override.modelID }
  const messageId = output.message["id"] as string | undefined
  if (isSameModel(output.message.model, targetModel)) {
    if (validatedVariant && messageId) {
      scheduleDeferredModelOverride(messageId, targetModel, validatedVariant)
      log(`[deepwork-model-override] Persist validated variant for active model: ${override.modelID}`)
      return
    }
    log(`[deepwork-model-override] Skip override; target model already active: ${override.modelID}`)
    return
  }
  if (!messageId) {
    log("[deepwork-model-override] No message ID found, falling back to direct mutation")
    output.message.model = targetModel
    return
  }

  const fromModel = (output.message.model as { modelID?: string } | undefined)?.modelID ?? "unknown"
  const agentConfigKey = getAgentConfigKey(
    inputAgentName ??
    (typeof output.message["agent"] === "string" ? (output.message["agent"] as string) : "unknown"),
  )

  scheduleDeferredModelOverride(messageId, targetModel, validatedVariant)

  log(`[deepwork-model-override] ${fromModel} -> ${override.modelID} (deferred DB)`, {
    agent: agentConfigKey,
  })

  showToast(
    tui,
    "Deepwork Model Override",
    `${fromModel} → ${override.modelID}. Maximum precision engaged.`,
  )
}

export function applyDeepworkModelOverrideOnMessage(
  pluginConfig: OhMyCortexConfig,
  inputAgentName: string | undefined,
  output: {
    message: Record<string, unknown>
    parts: Array<{ type: string; text?: string; [key: string]: unknown }>
  },
  tui: unknown,
  sessionID?: string,
  client?: unknown,
): void | Promise<void> {
  const override = resolveDeepworkOverride(pluginConfig, inputAgentName, output, sessionID)
  if (!override) return

  const currentModel = getMessageModel(output.message.model)
  const variantTargetModel = override.providerID && override.modelID
    ? { providerID: override.providerID, modelID: override.modelID }
    : currentModel

  if (!client || typeof (client as { provider?: { list?: unknown } }).provider?.list !== "function") {
    log("[deepwork-model-override] SDK validation unavailable, skipping variant override", {
      variant: override.variant,
    })
    applyResolvedDeepworkOverride({ override, validatedVariant: undefined, output, inputAgentName, tui })
    return
  }

  return resolveValidDeepworkVariant(client, variantTargetModel, override.variant)
    .then((validatedVariant) => {
      if (override.variant && !validatedVariant) {
        log("[deepwork-model-override] Skip invalid deepwork variant override", {
          variant: override.variant,
          providerID: variantTargetModel?.providerID,
          modelID: variantTargetModel?.modelID,
        })
      }

      applyResolvedDeepworkOverride({ override, validatedVariant, output, inputAgentName, tui })
    })
    .catch((error) => {
      log("[deepwork-model-override] Failed to validate deepwork variant via SDK", {
        variant: override.variant,
        error: String(error),
        providerID: variantTargetModel?.providerID,
        modelID: variantTargetModel?.modelID,
      })
      applyResolvedDeepworkOverride({ override, validatedVariant: undefined, output, inputAgentName, tui })
    })
}
