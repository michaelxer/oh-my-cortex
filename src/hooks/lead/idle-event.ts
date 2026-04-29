import type { PluginInput } from "@opencode-ai/plugin"
import {
  getPlanProgress,
  getTaskSessionState,
  readWorkStateState,
  readCurrentTopLevelTask,
} from "../../features/work-state"
import { getSessionAgent } from "../../features/claude-code-session-state"
import { getLastAgentFromSession } from "./session-last-agent"
import { isSessionInWorkStateLineage } from "./workstate-session-lineage"
import { getAgentConfigKey } from "../../shared/agent-display-names"
import { log } from "../../shared/logger"
import { injectWorkStateContinuation } from "./workstate-continuation-injector"
import { HOOK_NAME } from "./hook-name"
import { resolveActiveWorkStateSession } from "./resolve-active-workstate-session"
import type { LeadHookOptions, SessionState } from "./types"

const CONTINUATION_COOLDOWN_MS = 5000
const FAILURE_BACKOFF_MS = 5 * 60 * 1000
const MAX_CONSECUTIVE_PROMPT_FAILURES = 10
const RETRY_DELAY_MS = CONTINUATION_COOLDOWN_MS + 1000

function hasRunningBackgroundTasks(sessionID: string, options?: LeadHookOptions): boolean {
  const backgroundManager = options?.backgroundManager
  return backgroundManager
    ? backgroundManager.getTasksByParentSession(sessionID).some((task: { status: string }) => task.status === "running")
    : false
}

async function injectContinuation(input: {
  ctx: PluginInput
  sessionID: string
  sessionState: SessionState
  options?: LeadHookOptions
  planName: string
  progress: { total: number; completed: number }
  agent?: string
  worktreePath?: string
}): Promise<void> {
  const remaining = input.progress.total - input.progress.completed
  if (input.sessionState.isInjectingContinuation) {
    scheduleRetry({
      ctx: input.ctx,
      sessionID: input.sessionID,
      sessionState: input.sessionState,
      options: input.options,
    })
    return
  }

  input.sessionState.isInjectingContinuation = true

  try {
    const currentWorkState = readWorkStateState(input.ctx.directory)
    const currentTask = currentWorkState
      ? readCurrentTopLevelTask(currentWorkState.active_plan)
      : null
    const preferredTaskSession = currentTask
      ? getTaskSessionState(input.ctx.directory, currentTask.key)
      : null

    if (!currentWorkState) {
      return
    }

    const canContinueSession = await canContinueTrackedWorkStateSession({
      client: input.ctx.client,
      sessionID: input.sessionID,
      sessionOrigin: currentWorkState.session_origins?.[input.sessionID],
      workstateSessionIDs: currentWorkState.session_ids,
      requiredAgent: currentWorkState.agent,
    })
    if (!canContinueSession) {
      log(`[${HOOK_NAME}] Skipped: tracked descendant agent does not match workstate agent`, {
        sessionID: input.sessionID,
        requiredAgent: currentWorkState.agent ?? "lead",
      })
      return
    }

    const result = await injectWorkStateContinuation({
      ctx: input.ctx,
      sessionID: input.sessionID,
      planName: input.planName,
      remaining,
      total: input.progress.total,
      agent: input.agent,
      worktreePath: input.worktreePath,
      preferredTaskSessionId: preferredTaskSession?.session_id,
      preferredTaskTitle: preferredTaskSession?.task_title,
      backgroundManager: input.options?.backgroundManager,
      sessionState: input.sessionState,
    })

    if (result === "injected") {
      if (input.sessionState.pendingRetryTimer) {
        clearTimeout(input.sessionState.pendingRetryTimer)
        input.sessionState.pendingRetryTimer = undefined
      }
      input.sessionState.lastContinuationInjectedAt = Date.now()
      return
    }

    if (result === "skipped_background_tasks") {
      scheduleRetry({
        ctx: input.ctx,
        sessionID: input.sessionID,
        sessionState: input.sessionState,
        options: input.options,
      })
      return
    }

    if (result === "failed") {
      scheduleRetry({
        ctx: input.ctx,
        sessionID: input.sessionID,
        sessionState: input.sessionState,
        options: input.options,
      })
    }
  } catch (error) {
    log(`[${HOOK_NAME}] Failed to inject workstate continuation`, { sessionID: input.sessionID, error })
    input.sessionState.promptFailureCount += 1
    input.sessionState.lastFailureAt = Date.now()
    scheduleRetry({
      ctx: input.ctx,
      sessionID: input.sessionID,
      sessionState: input.sessionState,
      options: input.options,
    })
  } finally {
    input.sessionState.isInjectingContinuation = false
  }
}

function scheduleRetry(input: {
  ctx: PluginInput
  sessionID: string
  sessionState: SessionState
  options?: LeadHookOptions
}): void {
  const { ctx, sessionID, sessionState, options } = input
  if (sessionState.pendingRetryTimer) {
    return
  }

  sessionState.pendingRetryTimer = setTimeout(async () => {
    sessionState.pendingRetryTimer = undefined

    if (sessionState.promptFailureCount >= MAX_CONSECUTIVE_PROMPT_FAILURES) return
    if (sessionState.waitingForFinalWaveApproval) return

    const now = Date.now()
    if (
      sessionState.lastContinuationInjectedAt
      && now - sessionState.lastContinuationInjectedAt < CONTINUATION_COOLDOWN_MS
    ) {
      return
    }

    const currentWorkState = readWorkStateState(ctx.directory)
    if (!currentWorkState) return
    if (!currentWorkState.session_ids?.includes(sessionID)) return

    const currentProgress = getPlanProgress(currentWorkState.active_plan)
    if (currentProgress.isComplete) return
    if (options?.isContinuationStopped?.(sessionID)) return
    const canContinueSession = await canContinueTrackedWorkStateSession({
      client: ctx.client,
      sessionID,
      sessionOrigin: currentWorkState.session_origins?.[sessionID],
      workstateSessionIDs: currentWorkState.session_ids,
      requiredAgent: currentWorkState.agent,
    })
    if (!canContinueSession) return
    if (hasRunningBackgroundTasks(sessionID, options)) {
      scheduleRetry({ ctx, sessionID, sessionState, options })
      return
    }

    await injectContinuation({
      ctx,
      sessionID,
      sessionState,
      options,
      planName: currentWorkState.plan_name,
      progress: currentProgress,
      agent: currentWorkState.agent,
      worktreePath: currentWorkState.worktree_path,
    })
  }, RETRY_DELAY_MS)
}

export async function handleLeadSessionIdle(input: {
  ctx: PluginInput
  options?: LeadHookOptions
  getState: (sessionID: string) => SessionState
  sessionID: string
}): Promise<void> {
  const { ctx, options, getState, sessionID } = input

  log(`[${HOOK_NAME}] session.idle`, { sessionID })

  const activeWorkStateSession = await resolveActiveWorkStateSession({
    client: ctx.client,
    directory: ctx.directory,
    sessionID,
  })
  if (!activeWorkStateSession) {
    log(`[${HOOK_NAME}] Skipped: session not registered in active workstate`, { sessionID })
    return
  }

  const { workstateState, progress, appendedSession } = activeWorkStateSession
  if (progress.isComplete) {
    log(`[${HOOK_NAME}] WorkState complete`, { sessionID, plan: workstateState.plan_name })
    return
  }

  if (appendedSession) {
    log(`[${HOOK_NAME}] Appended subagent session to workstate during idle`, {
      sessionID,
      plan: workstateState.plan_name,
    })
  }

  const canContinueSession = await canContinueTrackedWorkStateSession({
    client: ctx.client,
    sessionID,
    sessionOrigin: workstateState.session_origins?.[sessionID],
    workstateSessionIDs: workstateState.session_ids,
    requiredAgent: workstateState.agent,
  })
  if (!canContinueSession) {
    log(`[${HOOK_NAME}] Skipped: tracked descendant agent does not match workstate agent`, {
      sessionID,
      requiredAgent: workstateState.agent ?? "lead",
    })
    return
  }

  const sessionState = getState(sessionID)
  const now = Date.now()

  if (sessionState.waitingForFinalWaveApproval) {
    log(`[${HOOK_NAME}] Skipped: waiting for explicit final-wave approval`, { sessionID })
    return
  }

  if (sessionState.lastEventWasAbortError) {
    sessionState.lastEventWasAbortError = false
    log(`[${HOOK_NAME}] Skipped: abort error immediately before idle`, { sessionID })
    return
  }

  if (sessionState.promptFailureCount >= MAX_CONSECUTIVE_PROMPT_FAILURES) {
    const timeSinceLastFailure =
      sessionState.lastFailureAt !== undefined ? now - sessionState.lastFailureAt : Number.POSITIVE_INFINITY
    if (timeSinceLastFailure < FAILURE_BACKOFF_MS) {
      log(`[${HOOK_NAME}] Skipped: continuation in backoff after repeated failures`, {
        sessionID,
        promptFailureCount: sessionState.promptFailureCount,
        backoffRemaining: FAILURE_BACKOFF_MS - timeSinceLastFailure,
      })
      return
    }

    sessionState.promptFailureCount = 0
    sessionState.lastFailureAt = undefined
  }

  if (hasRunningBackgroundTasks(sessionID, options)) {
    scheduleRetry({ ctx, sessionID, sessionState, options })
    log(`[${HOOK_NAME}] Skipped: background tasks running`, { sessionID })
    return
  }

  if (options?.isContinuationStopped?.(sessionID)) {
    log(`[${HOOK_NAME}] Skipped: continuation stopped for session`, { sessionID })
    return
  }

  if (sessionState.lastContinuationInjectedAt && now - sessionState.lastContinuationInjectedAt < CONTINUATION_COOLDOWN_MS) {
    scheduleRetry({ ctx, sessionID, sessionState, options })
    log(`[${HOOK_NAME}] Skipped: continuation cooldown active`, {
      sessionID,
      cooldownRemaining: CONTINUATION_COOLDOWN_MS - (now - sessionState.lastContinuationInjectedAt),
      pendingRetry: !!sessionState.pendingRetryTimer,
    })
    return
  }

  await injectContinuation({
    ctx,
    sessionID,
    sessionState,
    options,
    planName: workstateState.plan_name,
    progress,
    agent: workstateState.agent,
    worktreePath: workstateState.worktree_path,
  })
}

async function canContinueTrackedWorkStateSession(input: {
  client: PluginInput["client"]
  sessionID: string
  sessionOrigin?: "direct" | "appended"
  workstateSessionIDs: string[]
  requiredAgent?: string
}): Promise<boolean> {
  const ancestorSessionIDs = input.workstateSessionIDs.filter((trackedSessionID) => trackedSessionID !== input.sessionID)
  if (ancestorSessionIDs.length === 0) {
    return true
  }

  const isTrackedDescendant = await isSessionInWorkStateLineage({
    client: input.client,
    sessionID: input.sessionID,
    workstateSessionIDs: ancestorSessionIDs,
  })
  if (input.sessionOrigin === "direct") {
    return true
  }

  if (!isTrackedDescendant) {
    return false
  }

  const sessionAgent = await getLastAgentFromSession(input.sessionID, input.client)
    ?? getSessionAgent(input.sessionID)
  if (!sessionAgent) {
    return false
  }

  const requiredAgentKey = getAgentConfigKey(input.requiredAgent ?? "lead")
  const sessionAgentKey = getAgentConfigKey(sessionAgent)
  return sessionAgentKey === requiredAgentKey
    || (requiredAgentKey === getAgentConfigKey("lead") && sessionAgentKey === getAgentConfigKey("chief"))
}
