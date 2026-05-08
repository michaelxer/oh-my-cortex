/**
 * Team mode keyword detector.
 *
 * Triggers when the user explicitly invokes team-mode work.
 */

export const TEAM_PATTERN = /\bteam[\s_-]?mode\b/i

export const TEAM_MESSAGE = `[team-mode]
Team mode reference detected. If the user wants team-mode work, MUST orchestrate via team_* tools (team_create -> team_task_create + team_send_message). NEVER substitute with delegate_task - it is not equivalent.

If team_* tools are unavailable, instruct the user to set team_mode.enabled=true in oh-my-cortex.jsonc and restart OpenCode.`
