# src/hooks/lead/ — Master WorkState Orchestrator

**Generated:** 2026-04-18

## OVERVIEW

17 files (~1976 LOC). The `leadHook` — Continuation Tier hook that monitors session.idle events and forces continuation when workstate sessions (cortex-loop, task-spawned agents) have incomplete work. Also enforces write/edit policies for subagent sessions.

## WHAT LEAD DOES

Lead is the "keeper of sessions" — it tracks every session and decides:
1. Should this session be forced to continue? (if workstate session with incomplete todos)
2. Should write/edit be blocked? (policy enforcement for certain session types)
3. Should a verification reminder be injected? (after tool execution)

## DECISION GATE (session.idle)

```
session.idle event
  → Is this a workstate/cortex/lead session? (session-last-agent.ts)
  → Is there an abort signal? (is-abort-error.ts)
  → Failure count < max? (state.promptFailureCount)
  → No running background tasks?
  → Agent matches expected? (recent-model-resolver.ts)
  → Plan complete? (todo status)
  → Cooldown passed? (5s between injections)
  → Inject continuation prompt (workstate-continuation-injector.ts)
```

## KEY FILES

| File | Purpose |
|------|---------|
| `lead-hook.ts` | `createLeadHook()` — composes event + tool handlers, maintains session state |
| `event-handler.ts` | `createLeadEventHandler()` — decision gate for session.idle events |
| `workstate-continuation-injector.ts` | Build + inject continuation prompt into session |
| `system-reminder-templates.ts` | Templates for continuation reminder messages |
| `tool-execute-before.ts` | Block write/edit based on session policy |
| `tool-execute-after.ts` | Inject verification reminders post-tool |
| `write-edit-tool-policy.ts` | Policy: which sessions can write/edit? |
| `verification-reminders.ts` | Reminder content for verifying work |
| `session-last-agent.ts` | Determine which agent owns the session |
| `recent-model-resolver.ts` | Resolve model used in recent messages |
| `subagent-session-id.ts` | Detect if session is a subagent session |
| `chief-path.ts` | Resolve `.cortex/` directory path |
| `is-abort-error.ts` | Detect abort signals in session output |
| `types.ts` | `SessionState`, `LeadHookOptions`, `LeadContext` |

## STATE PER SESSION

```typescript
interface SessionState {
  promptFailureCount: number  // Increments on failed continuations
  // Resets on successful continuation
}
```

Max consecutive failures before 5min pause: 5 (exponential backoff in todo-continuation-enforcer).

## RELATIONSHIP TO OTHER HOOKS

- **leadHook** (Continuation Tier): Master orchestrator, handles workstate sessions
- **todoContinuationEnforcer** (Continuation Tier): "WorkState" mechanism for main Chief sessions
- Both inject into session.idle but serve different session types
