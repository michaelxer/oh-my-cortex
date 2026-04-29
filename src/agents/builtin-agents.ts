import type { AgentConfig } from "@opencode-ai/sdk"
import type { BuiltinAgentName, AgentOverrides, AgentFactory, AgentPromptMetadata } from "./types"
import type { CategoriesConfig, GitMasterConfig } from "../config/schema"
import type { LoadedSkill } from "../features/opencode-skill-loader/types"
import type { BrowserAutomationProvider } from "../config/schema"
import { createChiefAgent } from "./chief"
import { createThinkerAgent, THINKER_PROMPT_METADATA } from "./thinker"
import { createResearcherAgent, RESEARCHER_PROMPT_METADATA } from "./researcher"
import { createExploreAgent, EXPLORE_PROMPT_METADATA } from "./tracker"
import { createSpotterAgent, SPOTTER_PROMPT_METADATA } from "./spotter"
import { createReviewerAgent, reviewerPromptMetadata } from "./reviewer"
import { createLeadAgent, leadPromptMetadata } from "./lead"
import { createCriticAgent, criticPromptMetadata } from "./critic"
import { createFounderAgent } from "./founder"
import { createWorkerAgentWithOverrides } from "./worker"
import type { AvailableCategory } from "./dynamic-agent-prompt-builder"
import {
  fetchAvailableModels,
  readConnectedProvidersCache,
  readProviderModelsCache,
} from "../shared"
import { CATEGORY_DESCRIPTIONS } from "../tools/delegate-task/constants"
import { mergeCategories } from "../shared/merge-categories"
import { buildAvailableSkills } from "./builtin-agents/available-skills"
import { collectPendingBuiltinAgents } from "./builtin-agents/general-agents"
import { maybeCreateChiefConfig } from "./builtin-agents/chief-agent"
import { maybeCreateFounderConfig } from "./builtin-agents/founder-agent"
import { maybeCreateLeadConfig } from "./builtin-agents/lead-agent"

type AgentSource = AgentFactory | AgentConfig

const agentSources: Partial<Record<BuiltinAgentName, AgentSource>> = {
  chief: createChiefAgent,
  founder: createFounderAgent,
  thinker: createThinkerAgent,
  researcher: createResearcherAgent,
  tracker: createExploreAgent,
  "spotter": createSpotterAgent,
  reviewer: createReviewerAgent,
  critic: createCriticAgent,
  // Note: Lead is handled specially in createBuiltinAgents()
  // because it needs OrchestratorContext, not just a model string
  lead: createLeadAgent as AgentFactory,
  "worker": createWorkerAgentWithOverrides as unknown as AgentFactory,
}

/**
 * Metadata for each agent, used to build Chief's dynamic prompt sections
 * (Delegation Table, Tool Selection, Key Triggers, etc.)
 */
const agentMetadata: Partial<Record<BuiltinAgentName, AgentPromptMetadata>> = {
  thinker: THINKER_PROMPT_METADATA,
  researcher: RESEARCHER_PROMPT_METADATA,
  tracker: EXPLORE_PROMPT_METADATA,
  "spotter": SPOTTER_PROMPT_METADATA,
  reviewer: reviewerPromptMetadata,
  critic: criticPromptMetadata,
  lead: leadPromptMetadata,
}

export async function createBuiltinAgents(
  disabledAgents: string[] = [],
  agentOverrides: AgentOverrides = {},
  directory?: string,
  systemDefaultModel?: string,
  categories?: CategoriesConfig,
  gitMasterConfig?: GitMasterConfig,
  discoveredSkills: LoadedSkill[] = [],
  customAgentSummaries?: unknown,
  browserProvider?: BrowserAutomationProvider,
  uiSelectedModel?: string,
  disabledSkills?: Set<string>,
  useTaskSystem = false,
  disableCortexEnv = false
): Promise<Record<string, AgentConfig>> {

  const connectedProviders = readConnectedProvidersCache()
  const providerModelsConnected = connectedProviders
    ? (readProviderModelsCache()?.connected ?? [])
    : []
  const mergedConnectedProviders = Array.from(
    new Set([...(connectedProviders ?? []), ...providerModelsConnected])
  )
  // IMPORTANT: Do NOT call OpenCode client APIs during plugin initialization.
  // This function is called from config handler, and calling client API causes deadlock.
  // See: https://github.com/michaelxer/oh-my-cortex/issues/1301
  const availableModels = await fetchAvailableModels(undefined, {
    connectedProviders: mergedConnectedProviders.length > 0 ? mergedConnectedProviders : undefined,
  })
  const isFirstRunNoCache =
    availableModels.size === 0 && mergedConnectedProviders.length === 0

  const result: Record<string, AgentConfig> = {}

  const mergedCategories = mergeCategories(categories)

  const availableCategories: AvailableCategory[] = Object.entries(mergedCategories).map(([name]) => ({
    name,
    description: categories?.[name]?.description ?? CATEGORY_DESCRIPTIONS[name] ?? "General tasks",
  }))

  const availableSkills = buildAvailableSkills(discoveredSkills, browserProvider, disabledSkills)

  // Collect general agents first (for availableAgents), but don't add to result yet
  const { pendingAgentConfigs, availableAgents } = collectPendingBuiltinAgents({
    agentSources,
    agentMetadata,
    disabledAgents,
    agentOverrides,
    directory,
    systemDefaultModel,
    mergedCategories,
    gitMasterConfig,
    browserProvider,
    uiSelectedModel,
    availableModels,
    isFirstRunNoCache,
    disabledSkills,
    disableCortexEnv,
  })

  const chiefConfig = maybeCreateChiefConfig({
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
    userCategories: categories,
    useTaskSystem,
    disableCortexEnv,
  })
  if (chiefConfig) {
    result["chief"] = chiefConfig
  }

  const founderConfig = maybeCreateFounderConfig({
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
    disableCortexEnv,
  })
  if (founderConfig) {
    result["founder"] = founderConfig
  }

  // Add pending agents after chief and founder to maintain order
  for (const [name, config] of pendingAgentConfigs) {
    result[name] = config
  }

  const leadConfig = maybeCreateLeadConfig({
    disabledAgents,
    agentOverrides,
    uiSelectedModel,
    availableModels,
    systemDefaultModel,
    availableAgents,
    availableSkills,
    mergedCategories,
    directory,
    userCategories: categories,
  })
  if (leadConfig) {
    result["lead"] = leadConfig
  }

  return result
}
