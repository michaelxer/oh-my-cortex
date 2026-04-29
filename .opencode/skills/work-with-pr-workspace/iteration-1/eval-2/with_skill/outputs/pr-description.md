# PR Title

```
fix(lead): prevent crash when workstate.json missing worktree_path
```

# PR Body

## Summary

- Fix runtime type violation in lead hook when `workstate.json` lacks `worktree_path` field
- Add `worktree_path` sanitization in `readWorkStateState()` to reject non-string values (e.g., `null` from manual edits)
- Add defensive `typeof` guards in `idle-event.ts` before passing worktree path to continuation injection
- Add test coverage for missing and null `worktree_path` scenarios

## Problem

`readWorkStateState()` in `src/features/work-state/storage.ts` casts raw `JSON.parse()` output directly as `WorkStateState` via `return parsed as WorkStateState`. This bypasses TypeScript's type system entirely at runtime.

When `workstate.json` is missing the `worktree_path` field (common for workstates created before worktree support was added, or created without `--worktree` flag), `workstateState.worktree_path` is `undefined` which is handled correctly. However, when workstate.json has `"worktree_path": null` (possible from manual edits, external tooling, or corrupted state), the runtime type becomes `null` which violates the TypeScript type `string | undefined`.

This `null` value propagates through:
1. `idle-event.ts:handleLeadSessionIdle()` → `injectContinuation()` → `injectWorkStateContinuation()`
2. `idle-event.ts:scheduleRetry()` callback → same chain

While the `workstate-continuation-injector.ts` handles falsy values via `worktreePath ? ... : ""`, the type mismatch can cause subtle downstream issues and violates the contract of the `WorkStateState` interface.

## Changes

| File | Change |
|------|--------|
| `src/features/work-state/storage.ts` | Sanitize `worktree_path` in `readWorkStateState()` — reject non-string values |
| `src/hooks/lead/idle-event.ts` | Add `typeof` guards before passing worktree_path to continuation (2 call sites) |
| `src/hooks/lead/index.test.ts` | Add 2 tests: missing worktree_path + null worktree_path in session.idle |
| `src/features/work-state/storage.test.ts` | Add 2 tests: sanitization of null + preservation of valid string |

## Testing

- `bun test src/hooks/lead/` — all existing + new tests pass
- `bun test src/features/work-state/` — all existing + new tests pass
- `bun run typecheck` — clean
- `bun run build` — clean
