import * as p from "@clack/prompts"
import type { Option } from "@clack/prompts"
import color from "picocolors"
import type {
  AxraiTier,
  BooleanArg,
  ClaudeSubscription,
  DetectedConfig,
  InstallConfig,
} from "./types"
import type { GeneratedOmxConfig } from "./model-fallback-types"
import { detectedToInitialValues } from "./install-validators"
import { fetchAxraiCatalog, fetchAxraiOwnerCatalog, getAxraiOpenCodeConfig } from "./axrai-catalog"

async function selectOrCancel<TValue extends Readonly<string | boolean | number>>(params: {
  message: string
  options: Option<TValue>[]
  initialValue: TValue
}): Promise<TValue | null> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) return null

  const value = await p.select<TValue>({
    message: params.message,
    options: params.options,
    initialValue: params.initialValue,
  })
  if (p.isCancel(value)) {
    p.cancel("Installation cancelled.")
    return null
  }
  return value as TValue
}

async function passwordOrCancel(params: {
  message: string
}): Promise<string | null> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) return null

  const value = await p.password({
    message: params.message,
  })
  if (p.isCancel(value)) {
    p.cancel("Installation cancelled.")
    return null
  }
  return String(value).trim()
}

export async function promptInstallConfig(detected: DetectedConfig): Promise<InstallConfig | null> {
  const initial = detectedToInitialValues(detected)

  const usesAxrai = await selectOrCancel<BooleanArg>({
    message: "Are you a Mettle community member with an active AXR AI subscription plan? AXR AI is optional.",
    options: [
      { value: "yes", label: "Yes", hint: "Use AXR AI Trial, Pro, or Owner catalog setup" },
      { value: "no", label: "No", hint: "Continue normal provider setup for general users" },
    ],
    initialValue: "no",
  })
  if (!usesAxrai) return null

  if (usesAxrai === "yes") {
    const axraiTier = await selectOrCancel<AxraiTier | "none">({
      message: "What is your AXR AI subscription plan?",
      options: [
        { value: "trial", label: "Trial / Pilot", hint: "Use only models listed for the AXR AI Trial tier" },
        { value: "pro", label: "Pro / Core / Builder / Scale", hint: "Use only models listed for the AXR AI Pro tier" },
        { value: "owner", label: "Owner / Full Access", hint: "Use authenticated owner catalog from AXRAI_API_KEY" },
        { value: "none", label: "Sorry, I don't have an AXR AI plan", hint: "Continue normal provider setup" },
      ],
      initialValue: "trial",
    })
    if (!axraiTier) return null

    if (axraiTier !== "none") {
      try {
        let ownerKey = process.env.AXRAI_API_KEY
        if (axraiTier === "owner" && !ownerKey) {
          ownerKey = await passwordOrCancel({
            message: "AXR owner API key (not saved; used once to fetch catalog)",
          }) ?? undefined
        }
        const catalog = axraiTier === "owner"
          ? await fetchAxraiOwnerCatalog(ownerKey)
          : await fetchAxraiCatalog()
        const axrai = getAxraiOpenCodeConfig(catalog, axraiTier)
        return {
          hasClaude: false,
          isMax20: false,
          hasOpenAI: false,
          hasGemini: false,
          hasCopilot: false,
          hasOpencodeZen: false,
          hasZaiCodingPlan: false,
          hasKimiForCoding: false,
          hasOpencodeGo: false,
          hasVercelAiGateway: false,
          axraiTier,
          axraiModelIds: axrai.modelIds,
          axraiOpenCodeConfig: axrai.openCodeConfig,
          axraiPrimaryModel: axrai.primaryModel,
          axraiSmallModel: axrai.smallModel,
        }
      } catch (err) {
        p.log.error(err instanceof Error ? err.message : "Failed to configure AXR AI from the live catalog")
        p.note(
          "Check your internet connection, verify your AXR AI plan, or choose normal provider setup.",
          "AXR AI setup failed",
        )
        return null
      }
    }
  }

  const claude = await selectOrCancel<ClaudeSubscription>({
    message: "Do you have a Claude Pro/Max subscription?",
    options: [
      { value: "no", label: "No", hint: "Will use opencode/big-pickle as fallback" },
      { value: "yes", label: "Yes (standard)", hint: "Claude Opus 4.5 for orchestration" },
      { value: "max20", label: "Yes (max20 mode)", hint: "Full power with Claude Sonnet 4.6 for Researcher" },
    ],
    initialValue: initial.claude,
  })
  if (!claude) return null

  const openai = await selectOrCancel({
    message: "Do you have an OpenAI/ChatGPT Plus subscription?",
    options: [
      { value: "no", label: "No", hint: "Thinker will use fallback models" },
      { value: "yes", label: "Yes", hint: "GPT-5.4 for Thinker (high-IQ debugging)" },
    ],
    initialValue: initial.openai,
  })
  if (!openai) return null

  const gemini = await selectOrCancel({
    message: "Will you integrate Google Gemini?",
    options: [
      { value: "no", label: "No", hint: "Frontend/docs agents will use fallback" },
      { value: "yes", label: "Yes", hint: "Beautiful UI generation with Gemini 3.1 Pro" },
    ],
    initialValue: initial.gemini,
  })
  if (!gemini) return null

  const copilot = await selectOrCancel({
    message: "Do you have a GitHub Copilot subscription?",
    options: [
      { value: "no", label: "No", hint: "Only native providers will be used" },
      { value: "yes", label: "Yes", hint: "Fallback option when native providers unavailable" },
    ],
    initialValue: initial.copilot,
  })
  if (!copilot) return null

  const opencodeZen = await selectOrCancel({
    message: "Do you have access to OpenCode Zen (opencode/ models)?",
    options: [
      { value: "no", label: "No", hint: "Will use other configured providers" },
      { value: "yes", label: "Yes", hint: "opencode/claude-opus-4-7, opencode/gpt-5.5, etc." },
    ],
    initialValue: initial.opencodeZen,
  })
  if (!opencodeZen) return null

  const zaiCodingPlan = await selectOrCancel({
    message: "Do you have a Z.ai Coding Plan subscription?",
    options: [
      { value: "no", label: "No", hint: "Will use other configured providers" },
      { value: "yes", label: "Yes", hint: "Fallback for Researcher and Spotter" },
    ],
    initialValue: initial.zaiCodingPlan,
  })
  if (!zaiCodingPlan) return null

  const kimiForCoding = await selectOrCancel({
    message: "Do you have a Kimi For Coding subscription?",
    options: [
      { value: "no", label: "No", hint: "Will use other configured providers" },
      { value: "yes", label: "Yes", hint: "Kimi K2.5 for Chief/Planner fallback" },
    ],
    initialValue: initial.kimiForCoding,
})
  if (!kimiForCoding) return null

  const opencodeGo = await selectOrCancel({
    message: "Do you have an OpenCode Go subscription?",
    options: [
      { value: "no", label: "No", hint: "Will use other configured providers" },
      { value: "yes", label: "Yes", hint: "OpenCode Go for quick tasks" },
    ],
    initialValue: initial.opencodeGo,
  })
  if (!opencodeGo) return null

  const vercelAiGateway = await selectOrCancel({
    message: "Do you have a Vercel AI Gateway API key?",
    options: [
      { value: "no", label: "No", hint: "Will use other configured providers" },
      { value: "yes", label: "Yes", hint: "Universal proxy for OpenAI, Anthropic, Google, etc." },
    ],
    initialValue: initial.vercelAiGateway,
  })
  if (!vercelAiGateway) return null

  return {
    hasClaude: claude !== "no",
    isMax20: claude === "max20",
    hasOpenAI: openai === "yes",
    hasGemini: gemini === "yes",
    hasCopilot: copilot === "yes",
    hasOpencodeZen: opencodeZen === "yes",
    hasZaiCodingPlan: zaiCodingPlan === "yes",
    hasKimiForCoding: kimiForCoding === "yes",
    hasOpencodeGo: opencodeGo === "yes",
    hasVercelAiGateway: vercelAiGateway === "yes",
  }
}

const AGENT_LABELS: Record<string, string> = {
  chief: "Chief — Main orchestrator",
  founder: "Founder — Autonomous deep worker",
  thinker: "Thinker — All-domain consultant",
  researcher: "Researcher — Knowledge finder",
  tracker: "Tracker — Codebase explorer",
  planner: "Planner — Strategic interviewer",
  reviewer: "Reviewer — Gap finder",
  critic: "Critic — Quality gate",
  lead: "Lead — Project manager",
  worker: "Worker — Task executor",
  spotter: "Spotter — Visual analyst",
}

function extractModelShortName(modelId: string): string {
  const parts = modelId.split("/")
  return parts.length > 1 ? parts[1] : modelId
}

/**
 * After showing the auto-configured agent-model table, ask the user
 * if they want to swap any agent's model. Supports upgrading (rich user
 * has a stronger model) or downgrading (budget user wants cheaper models).
 *
 * Returns the modified config, or the original if no changes were made.
 */
export async function promptModelCustomization(
  generatedConfig: GeneratedOmxConfig,
): Promise<GeneratedOmxConfig> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) return generatedConfig
  if (!generatedConfig.agents) return generatedConfig

  const wantToCustomize = await p.confirm({
    message: "Would you like to change any agent's model?",
    initialValue: false,
  })

  if (p.isCancel(wantToCustomize) || !wantToCustomize) {
    return generatedConfig
  }

  const modifiedConfig = {
    ...generatedConfig,
    agents: { ...generatedConfig.agents },
  }

  let keepEditing = true

  while (keepEditing) {
    const agentEntries = Object.entries(modifiedConfig.agents ?? {})
    const agentOptions: Option<string>[] = agentEntries.map(([key, config]) => {
      const currentModel = extractModelShortName(config.model)
      const variant = config.variant ? ` (${config.variant})` : ""
      const label = AGENT_LABELS[key] ?? key
      return {
        value: key,
        label: `${label}`,
        hint: `current: ${currentModel}${variant}`,
      }
    })

    agentOptions.push({
      value: "__done__",
      label: color.green("Done — no more changes"),
      hint: "save and continue",
    })

    const selectedAgent = await p.select<string>({
      message: "Which agent do you want to change?",
      options: agentOptions,
    })

    if (p.isCancel(selectedAgent) || selectedAgent === "__done__") {
      keepEditing = false
      break
    }

    const currentConfig = modifiedConfig.agents?.[selectedAgent]
    if (!currentConfig) continue

    const currentModel = currentConfig.model
    const currentVariant = currentConfig.variant

    p.log.info(
      `${color.bold(selectedAgent)} is currently using ${color.cyan(extractModelShortName(currentModel))}` +
      (currentVariant ? ` ${color.dim(`(${currentVariant})`)}` : ""),
    )

    const newModel = await p.text({
      message: `Enter the new model ID for ${color.bold(selectedAgent)}:`,
      placeholder: `e.g. openai/gpt-5.5-pro, anthropic/claude-opus-4-7, ${currentModel}`,
      validate: (value) => {
        if (!value.trim()) return "Model ID cannot be empty"
        return undefined
      },
    })

    if (p.isCancel(newModel)) {
      keepEditing = false
      break
    }

    const newVariant = await p.select<string>({
      message: `Set reasoning effort for ${color.bold(selectedAgent)}:`,
      options: [
        { value: "__none__", label: "Default", hint: "no variant" },
        { value: "low", label: "Low", hint: "fast, less reasoning" },
        { value: "medium", label: "Medium", hint: "balanced" },
        { value: "high", label: "High", hint: "more reasoning" },
        { value: "xhigh", label: "Extra High", hint: "maximum reasoning" },
        { value: "max", label: "Max", hint: "highest available" },
      ],
      initialValue: currentVariant ?? "__none__",
    })

    if (p.isCancel(newVariant)) {
      keepEditing = false
      break
    }

    modifiedConfig.agents[selectedAgent] = {
      ...currentConfig,
      model: (newModel as string).trim(),
      ...(newVariant !== "__none__" ? { variant: newVariant } : {}),
    }

    // Remove variant key if user selected "Default"
    if (newVariant === "__none__" && modifiedConfig.agents[selectedAgent].variant) {
      delete modifiedConfig.agents[selectedAgent].variant
    }

    p.log.success(
      `${color.bold(selectedAgent)} ${color.dim("→")} ${color.cyan(extractModelShortName((newModel as string).trim()))}` +
      (newVariant !== "__none__" ? ` ${color.dim(`(${newVariant})`)}` : ""),
    )
  }

  return modifiedConfig
}
