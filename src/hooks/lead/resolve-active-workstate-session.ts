import type { PluginInput } from "@opencode-ai/plugin"
import { getPlanProgress, readWorkStateState } from "../../features/work-state"
import type { WorkStateState, PlanProgress } from "../../features/work-state"

export async function resolveActiveWorkStateSession(input: {
  client: PluginInput["client"]
  directory: string
  sessionID: string
}): Promise<{
  workstateState: WorkStateState
  progress: PlanProgress
  appendedSession: boolean
} | null> {
  const workstateState = readWorkStateState(input.directory)
  if (!workstateState) {
    return null
  }

  if (!workstateState.session_ids.includes(input.sessionID)) {
    return null
  }

  const progress = getPlanProgress(workstateState.active_plan)
  if (progress.isComplete) {
    return { workstateState, progress, appendedSession: false }
  }

  return { workstateState, progress, appendedSession: false }
}
