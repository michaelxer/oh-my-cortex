# src/hooks/cortex-loop/ — Self-Referential Dev Loop

**Generated:** 2026-04-11

## OVERVIEW

14 files (~1687 LOC). The `cortexLoop` Session Tier hook — powers the `/cortex-loop` command. Iterates a development loop until the agent emits `<promise>DONE</promise>` or max iterations reached.

## LOOP LIFECYCLE

```
/cortex-loop → startLoop(sessionID, prompt, options)
  → loopState.startLoop() → persists state to .cortex/cortex-loop.local.md
  → session.idle events → createCortexLoopEventHandler()
    → completionPromiseDetector: scan output for <promise>DONE</promise>
    → if not done: inject continuation prompt → loop
    → if done or maxIterations: cancelLoop()
```

## KEY FILES

| File | Purpose |
|------|---------|
| `cortex-loop-hook.ts` | `createCortexLoopHook()` — composes controller + recovery + event handler |
| `cortex-loop-event-handler.ts` | `createCortexLoopEventHandler()` — handles session.idle, drives loop |
| `loop-state-controller.ts` | State CRUD: startLoop, cancelLoop, getState, persist to disk |
| `loop-session-recovery.ts` | Recover from crashed/interrupted loop sessions |
| `completion-promise-detector.ts` | Scan session transcript for `<promise>DONE</promise>` |
| `continuation-prompt-builder.ts` | Build continuation message for next iteration |
| `continuation-prompt-injector.ts` | Inject built prompt into active session |
| `storage.ts` | Read/write `.cortex/cortex-loop.local.md` state file |
| `message-storage-directory.ts` | Temp dir for prompt injection |
| `with-timeout.ts` | API call wrapper with timeout (default 5000ms) |
| `types.ts` | `CortexLoopState`, `CortexLoopOptions`, loop iteration types |

## STATE FILE

```
.cortex/cortex-loop.local.md  (gitignored)
  → sessionID, prompt, iteration count, maxIterations, completionPromise, deepwork flag
```

## OPTIONS

```typescript
startLoop(sessionID, prompt, {
  maxIterations?: number  // Default from config (default: 100)
  completionPromise?: string  // Custom "done" signal (default: "<promise>DONE</promise>")
  deepwork?: boolean  // Enable deepwork mode for iterations
})
```

## EXPORTED INTERFACE

```typescript
interface CortexLoopHook {
  event: (input) => Promise<void>  // session.idle handler
  startLoop: (sessionID, prompt, options?) => boolean
  cancelLoop: (sessionID) => boolean
  getState: () => CortexLoopState | null
}
```
