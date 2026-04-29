import type { PluginInput } from "@opencode-ai/plugin"
import { createLeadEventHandler } from "./event-handler"
import { createToolExecuteAfterHandler } from "./tool-execute-after"
import { createToolExecuteBeforeHandler } from "./tool-execute-before"
import type { LeadHookOptions, PendingTaskRef, SessionState } from "./types"

export function createLeadHook(ctx: PluginInput, options?: LeadHookOptions) {
  const sessions = new Map<string, SessionState>()
  const pendingFilePaths = new Map<string, string>()
  const pendingTaskRefs = new Map<string, PendingTaskRef>()
  const autoCommit = options?.autoCommit ?? true

  function getState(sessionID: string): SessionState {
    let state = sessions.get(sessionID)
    if (!state) {
      state = { promptFailureCount: 0 }
      sessions.set(sessionID, state)
    }
    return state
  }

  return {
    handler: createLeadEventHandler({ ctx, options, sessions, getState }),
    "tool.execute.before": createToolExecuteBeforeHandler({ ctx, pendingFilePaths, pendingTaskRefs }),
    "tool.execute.after": createToolExecuteAfterHandler({ ctx, pendingFilePaths, pendingTaskRefs, autoCommit, getState }),
  }
}
