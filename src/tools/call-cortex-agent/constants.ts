export const ALLOWED_AGENTS = [
  "tracker",
  "researcher",
  "thinker",
  "founder",
  "reviewer",
  "critic",
  "spotter",
] as const

export const CALL_OMX_AGENT_DESCRIPTION = `Spawn tracker/researcher agent or custom agents. run_in_background REQUIRED (true=async with task_id, false=sync).

Built-in agents:
{agents}

Custom agents registered via user or project agent directories are also supported.

Pass \`session_id=<id>\` to continue previous agent with full context. Nested subagent depth is tracked automatically and blocked past the configured limit. Prompts MUST be in English. Use \`background_output\` for async results.`
