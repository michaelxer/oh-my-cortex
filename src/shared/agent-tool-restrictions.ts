import { stripInvisibleAgentCharacters } from "./agent-display-names"

/**
 * Agent tool restrictions for session.prompt calls.
 * OpenCode SDK's session.prompt `tools` parameter expects boolean values.
 * true = tool allowed, false = tool denied.
 *
 * CROSS-PLUGIN ISOLATION: When OMX runs alongside OmO or OMC, those plugins
 * register `call_omo_agent` as a tool. OMX agents must never call it, or they
 * would accidentally spawn OmO/OMC subagents (Oracle, Librarian, etc.) instead
 * of OMX subagents (Thinker, Researcher, etc.). Every OMX agent that has tool
 * access denies `call_omo_agent` explicitly.
 */

/**
 * Tools from other plugins that OMX agents must never invoke.
 * Prevents cross-plugin agent spawning when running alongside OmO/OMC.
 */
const FOREIGN_AGENT_TOOLS: Record<string, boolean> = {
  call_omo_agent: false,
}

const EXPLORATION_AGENT_DENYLIST: Record<string, boolean> = {
  write: false,
  edit: false,
  task: false,
  call_cortex_agent: false,
  ...FOREIGN_AGENT_TOOLS,
}

const AGENT_RESTRICTIONS: Record<string, Record<string, boolean>> = {
  chief: {
    ...FOREIGN_AGENT_TOOLS,
  },

  founder: {
    ...FOREIGN_AGENT_TOOLS,
  },

  tracker: EXPLORATION_AGENT_DENYLIST,

  researcher: EXPLORATION_AGENT_DENYLIST,

  thinker: {
    write: false,
    edit: false,
    task: false,
    call_cortex_agent: false,
    ...FOREIGN_AGENT_TOOLS,
  },

  reviewer: {
    write: false,
    edit: false,
    task: false,
    ...FOREIGN_AGENT_TOOLS,
  },

  critic: {
    write: false,
    edit: false,
    task: false,
    ...FOREIGN_AGENT_TOOLS,
  },

  lead: {
    ...FOREIGN_AGENT_TOOLS,
  },

  "spotter": {
    read: true,
  },

  "worker": {
    task: false,
    ...FOREIGN_AGENT_TOOLS,
  },
}

export function getAgentToolRestrictions(agentName: string): Record<string, boolean> {
  // Custom/unknown agents get no restrictions (empty object), matching Claude Code's
  // trust model where project-registered agents retain full tool access including bash.
  const stripped = stripInvisibleAgentCharacters(agentName)
  return AGENT_RESTRICTIONS[stripped]
    ?? Object.entries(AGENT_RESTRICTIONS).find(([key]) => key.toLowerCase() === stripped.toLowerCase())?.[1]
    ?? {}
}

export function hasAgentToolRestrictions(agentName: string): boolean {
  const restrictions = getAgentToolRestrictions(agentName)
  return Object.keys(restrictions).length > 0
}
