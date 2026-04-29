## Summary

- Fix crash in lead hook when `workstate.json` is missing `worktree_path` (or other required fields) by hardening `readWorkStateState()` validation
- Wrap the unprotected `setTimeout` retry callback in `idle-event.ts` with try/catch to prevent unhandled promise rejections
- Add defensive type guard in `getPlanProgress()` to prevent `existsSync(undefined)` TypeError

## Context

When `workstate.json` is malformed or manually edited to omit fields, `readWorkStateState()` returns an object cast as `WorkStateState` without validating required fields. Downstream callers like `getPlanProgress(workstateState.active_plan)` then pass `undefined` to `existsSync()`, which throws a TypeError. This crash is especially dangerous in the `setTimeout` retry callback in `idle-event.ts`, where the error becomes an unhandled promise rejection.

## Changes

### `src/features/work-state/storage.ts`
- `readWorkStateState()`: Validate `active_plan` and `plan_name` are strings (return `null` if not)
- `readWorkStateState()`: Strip `worktree_path` if present but not a string type
- `getPlanProgress()`: Add `typeof planPath !== "string"` guard before `existsSync`

### `src/hooks/lead/idle-event.ts`
- Wrap `scheduleRetry` setTimeout async callback body in try/catch

### Tests
- `src/features/work-state/storage.test.ts`: 5 new tests for missing/malformed fields
- `src/hooks/lead/index.test.ts`: 2 new tests for worktree_path presence/absence in continuation prompt
