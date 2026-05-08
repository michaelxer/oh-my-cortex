import { getAgentDisplayName } from "../../shared/agent-display-names"
import type { InstallConfig } from "../types"
import { generateOmxConfig } from "./generate-omx-config"
import { deepMergeRecord } from "./deep-merge-record"

const AGENT_ROLES: Record<string, { description: string; mode: "primary" | "subagent"; order: number }> = {
  chief: { description: "OMX orchestrator and main conversation agent", mode: "primary", order: 1 },
  founder: { description: "Autonomous deep worker for end-to-end execution", mode: "primary", order: 2 },
  thinker: { description: "Read-only all-domain consultant", mode: "subagent", order: 3 },
  researcher: { description: "External docs, source, and reference researcher", mode: "subagent", order: 4 },
  tracker: { description: "Fast codebase exploration and pattern tracker", mode: "subagent", order: 5 },
  planner: { description: "Strategic plan builder", mode: "subagent", order: 6 },
  reviewer: { description: "Plan gap finder and ambiguity reviewer", mode: "subagent", order: 7 },
  critic: { description: "Ruthless plan and quality critic", mode: "subagent", order: 8 },
  lead: { description: "Plan executor and task orchestrator", mode: "subagent", order: 9 },
  worker: { description: "Scoped implementation worker", mode: "subagent", order: 10 },
  spotter: { description: "Visual, image, and PDF analyst", mode: "subagent", order: 11 },
}

const VISIBLE_AGENT_FALLBACK_MODEL = "opencode/gpt-5-nano"

type GeneratedAgentConfig = {
  model?: string
  variant?: string
  fallback_models?: unknown
}

function createVisibleAgentEntry(agentKey: string, modelConfig: GeneratedAgentConfig): Record<string, unknown> {
  const role = AGENT_ROLES[agentKey] ?? {
    description: "OMX agent",
    mode: "subagent" as const,
    order: 99,
  }
  const displayName = getAgentDisplayName(agentKey)

  return {
    name: displayName,
    description: `${role.description} (installed by oh-my-cortex)`,
    mode: role.mode,
    model: modelConfig.model,
    variant: modelConfig.variant,
    fallback_models: modelConfig.fallback_models,
    order: role.order,
    prompt:
      `You are ${displayName}. The oh-my-cortex plugin supplies your full runtime prompt, tools, hooks, and permissions. ` +
      "Use this visible OpenCode entry for model selection and UI discovery.",
  }
}

export async function generateOpenCodeInstallConfig(
  installConfig: InstallConfig,
): Promise<Record<string, unknown>> {
  const pluginConfig = generateOmxConfig(installConfig) as {
    agents?: Record<string, GeneratedAgentConfig>
  }
  const agentEntries = Object.fromEntries(
    Object.keys(AGENT_ROLES).map((agentKey) => [
      getAgentDisplayName(agentKey),
      createVisibleAgentEntry(
        agentKey,
        pluginConfig.agents?.[agentKey] ?? { model: VISIBLE_AGENT_FALLBACK_MODEL },
      ),
    ]),
  )

  const visibleConfig = {
    default_agent: getAgentDisplayName("chief"),
    agent: agentEntries,
    mcp: {
      websearch: {
        type: "remote",
        url: process.env.EXA_API_KEY
          ? `https://mcp.exa.ai/mcp?tools=web_search_exa&exaApiKey=${encodeURIComponent(process.env.EXA_API_KEY)}`
          : "https://mcp.exa.ai/mcp?tools=web_search_exa",
        enabled: true,
        ...(process.env.EXA_API_KEY ? { headers: { "x-api-key": process.env.EXA_API_KEY } } : {}),
        oauth: false,
      },
      context7: {
        type: "remote",
        url: "https://mcp.context7.com/mcp",
        enabled: true,
        ...(process.env.CONTEXT7_API_KEY ? { headers: { Authorization: `Bearer ${process.env.CONTEXT7_API_KEY}` } } : {}),
        oauth: false,
      },
      grep_app: {
        type: "remote",
        url: "https://mcp.grep.app",
        enabled: true,
        oauth: false,
      },
    },
  }

  return deepMergeRecord(
    deepMergeRecord({}, installConfig.axraiOpenCodeConfig ?? {}),
    visibleConfig,
  )
}
