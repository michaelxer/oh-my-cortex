import { getPlanProgress, readWorkStateState } from "../../features/work-state"
import { getSessionAgent } from "../../features/claude-code-session-state"
import {
  getActiveContinuationMarkerReason,
  isContinuationMarkerActive,
  readContinuationMarker,
} from "../../features/run-continuation-state"
import { isSessionInWorkStateLineage } from "../../hooks/lead/workstate-session-lineage"
import { getLastAgentFromSession } from "../../hooks/lead/session-last-agent"
import { getAgentConfigKey } from "../../shared/agent-display-names"
import { readState as readCortexLoopState } from "../../hooks/cortex-loop/storage"
import type { RunContext } from "./types"

export interface ContinuationState {
  hasActiveWorkState: boolean
  hasActiveCortexLoop: boolean
  hasHookMarker: boolean
  hasTodoHookMarker: boolean
  hasActiveHookMarker: boolean
  activeHookMarkerReason: string | null
}

export async function getContinuationState(
  directory: string,
  sessionID: string,
  client?: RunContext["client"],
): Promise<ContinuationState> {
  const marker = readContinuationMarker(directory, sessionID)

  return {
    hasActiveWorkState: await hasActiveWorkStateContinuation(directory, sessionID, client),
    hasActiveCortexLoop: hasActiveCortexLoopContinuation(directory, sessionID),
    hasHookMarker: marker !== null,
    hasTodoHookMarker: marker?.sources.todo !== undefined,
    hasActiveHookMarker: isContinuationMarkerActive(marker),
    activeHookMarkerReason: getActiveContinuationMarkerReason(marker),
  }
}

async function hasActiveWorkStateContinuation(
  directory: string,
  sessionID: string,
  client?: RunContext["client"],
): Promise<boolean> {
  const workstate = readWorkStateState(directory)
  if (!workstate) return false

  const progress = getPlanProgress(workstate.active_plan)
  if (progress.isComplete) return false
  if (!client) return false

  const isTrackedSession = workstate.session_ids.includes(sessionID)
  const sessionOrigin = workstate.session_origins?.[sessionID]
  if (!isTrackedSession) {
    return false
  }

  const isTrackedDescendant = await isTrackedDescendantSession(client, sessionID, workstate.session_ids)

  if (isTrackedSession && sessionOrigin === "direct") {
    return true
  }

  if (isTrackedSession && sessionOrigin !== "direct" && !isTrackedDescendant) {
    return false
  }

  const sessionAgent = await getLastAgentFromSession(sessionID, client)
    ?? getSessionAgent(sessionID)
  if (!sessionAgent) {
    return false
  }

  const requiredAgentKey = getAgentConfigKey(workstate.agent ?? "lead")
  const sessionAgentKey = getAgentConfigKey(sessionAgent)
  if (
    sessionAgentKey !== requiredAgentKey
    && !(requiredAgentKey === getAgentConfigKey("lead") && sessionAgentKey === getAgentConfigKey("chief"))
  ) {
    return false
  }

  return isTrackedSession || isTrackedDescendant
}

async function isTrackedDescendantSession(
  client: RunContext["client"],
  sessionID: string,
  trackedSessionIDs: string[],
): Promise<boolean> {
  const ancestorSessionIDs = trackedSessionIDs.filter((trackedSessionID) => trackedSessionID !== sessionID)
  if (ancestorSessionIDs.length === 0) {
    return false
  }

  return isSessionInWorkStateLineage({
    client,
    sessionID,
    workstateSessionIDs: ancestorSessionIDs,
  })
}

function hasActiveCortexLoopContinuation(directory: string, sessionID: string): boolean {
  const state = readCortexLoopState(directory)
  if (!state || !state.active) return false

  if (state.session_id && state.session_id !== sessionID) {
    return false
  }

  return true
}
