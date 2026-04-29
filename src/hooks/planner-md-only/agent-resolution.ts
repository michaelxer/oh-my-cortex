import type { PluginInput } from "@opencode-ai/plugin"

import { findNearestMessageWithFields, findFirstMessageWithAgent } from "../../features/hook-message-injector"
import {
  findFirstMessageWithAgentFromSDK,
  findNearestMessageWithFieldsFromSDK,
} from "../../features/hook-message-injector"
import { getSessionAgent } from "../../features/claude-code-session-state"
import { readWorkStateState } from "../../features/work-state"
import { getMessageDir } from "../../shared/opencode-message-dir"
import { isSqliteBackend } from "../../shared/opencode-storage-detection"

type OpencodeClient = PluginInput["client"]

function isCompactionAgent(agent: string): boolean {
  return agent.toLowerCase() === "compaction"
}

async function getAgentFromMessageFiles(
  sessionID: string,
  client?: OpencodeClient
): Promise<string | undefined> {
  if (isSqliteBackend() && client) {
    const firstAgent = await findFirstMessageWithAgentFromSDK(client, sessionID)
    if (firstAgent && !isCompactionAgent(firstAgent)) return firstAgent

    const nearest = await findNearestMessageWithFieldsFromSDK(client, sessionID)
    if (nearest?.agent && !isCompactionAgent(nearest.agent)) return nearest.agent
    return undefined
  }

  const messageDir = getMessageDir(sessionID)
  if (!messageDir) return undefined
  const firstAgent = findFirstMessageWithAgent(messageDir)
  if (firstAgent && !isCompactionAgent(firstAgent)) return firstAgent
  const nearestAgent = findNearestMessageWithFields(messageDir)?.agent
  if (nearestAgent && !isCompactionAgent(nearestAgent)) return nearestAgent
  return undefined
}

/**
 * Get the effective agent for the session.
 * Priority order:
 * 1. In-memory session agent (most recent, set by /start-work)
 * 2. WorkState state agent (persisted across restarts, fixes #927)
 * 3. Message files (fallback for sessions without workstate state)
 *
 * This fixes issue #927 where after interruption:
 * - In-memory map is cleared (process restart)
 * - Message files return "planner" (oldest message from /plan)
 * - But workstate.json has agent: "lead" (set by /start-work)
 */
export async function getAgentFromSession(
  sessionID: string,
  directory: string,
  client?: OpencodeClient
): Promise<string | undefined> {
  // Check in-memory first (current session)
  const memoryAgent = getSessionAgent(sessionID)
  if (memoryAgent) return memoryAgent

  // Check workstate state (persisted across restarts) - fixes #927
  const workstateState = readWorkStateState(directory)
  if (workstateState?.session_ids?.includes(sessionID) && workstateState.agent) {
    return workstateState.agent
  }

  // Fallback to message files
  return await getAgentFromMessageFiles(sessionID, client)
}
