import { getAgentConfigKey } from "./agent-display-names"

/**
 * Set of all OMX agent config keys.
 * Used to determine whether a given agent belongs to this plugin,
 * preventing cross-contamination when running alongside OmO or OMC.
 */
const OMX_AGENT_KEYS = new Set([
  "chief",
  "founder",
  "thinker",
  "researcher",
  "tracker",
  "planner",
  "reviewer",
  "critic",
  "lead",
  "worker",
  "spotter",
])

/**
 * Check whether an agent name belongs to OMX.
 * Accepts display names, config keys, or mixed-case variants.
 *
 * Use this in hooks to skip execution when the active agent
 * belongs to another plugin (OmO, OMC, or user-defined agents).
 *
 * @param agentName - Agent name from session context (display name or config key)
 * @returns true if the agent is an OMX agent
 */
export function isOmxAgent(agentName: string | undefined): boolean {
  if (!agentName) return false
  return OMX_AGENT_KEYS.has(getAgentConfigKey(agentName))
}
