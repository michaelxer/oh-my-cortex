# Verification Strategy

## 1. Unit Tests (Direct Verification)

### work-state storage tests
```bash
bun test src/features/work-state/storage.test.ts
```

Verify:
- `readWorkStateState()` returns `null` when `active_plan` missing
- `readWorkStateState()` returns `null` when `plan_name` missing
- `readWorkStateState()` strips non-string `worktree_path` (e.g., `null`)
- `readWorkStateState()` preserves valid string `worktree_path`
- `getPlanProgress(undefined)` returns safe default without crashing
- Existing tests still pass (session_ids defaults, empty object, etc.)

### lead hook tests
```bash
bun test src/hooks/lead/index.test.ts
```

Verify:
- session.idle handler works with workstate state missing `worktree_path` (no crash, prompt injected)
- session.idle handler includes `[Worktree: ...]` context when `worktree_path` IS present
- All 30+ existing tests still pass

### lead idle-event lineage tests
```bash
bun test src/hooks/lead/idle-event-lineage.test.ts
```

Verify existing lineage tests unaffected.

### start-work hook tests
```bash
bun test src/hooks/start-work/index.test.ts
```

Verify worktree-related start-work tests still pass (these create workstate states with/without `worktree_path`).

## 2. Type Safety

```bash
bun run typecheck
```

Verify zero new TypeScript errors. The changes are purely additive runtime guards that align with existing types (`worktree_path?: string`).

## 3. LSP Diagnostics on Changed Files

```
lsp_diagnostics on:
  - src/features/work-state/storage.ts
  - src/hooks/lead/idle-event.ts
```

Verify zero errors/warnings.

## 4. Full Test Suite

```bash
bun test
```

Verify no regressions across the entire codebase.

## 5. Build

```bash
bun run build
```

Verify build succeeds.

## 6. Manual Smoke Test (Reproduction)

To manually verify the fix:

```bash
# Create a malformed workstate.json (missing worktree_path)
mkdir -p .cortex
echo '{"active_plan": ".cortex/plans/test.md", "plan_name": "test", "session_ids": ["ses-1"]}' > .cortex/workstate.json

# Create a plan file
mkdir -p .cortex/plans
echo '# Plan\n- [ ] Task 1' > .cortex/plans/test.md

# Start opencode - lead hook should NOT crash when session.idle fires
# Verify /tmp/oh-my-cortex.log shows normal continuation behavior
```

Also test the extreme case:
```bash
# workstate.json with no required fields
echo '{}' > .cortex/workstate.json

# After fix: readWorkStateState returns null, lead hook gracefully skips
```

## 7. CI Pipeline

After pushing the branch, verify:
- `ci.yml` workflow passes: tests (split: mock-heavy isolated + batch), typecheck, build
- No new lint warnings

## 8. Edge Cases Covered

| Scenario | Expected Behavior |
|----------|-------------------|
| `workstate.json` = `{}` | `readWorkStateState` returns `null` |
| `workstate.json` missing `active_plan` | `readWorkStateState` returns `null` |
| `workstate.json` missing `plan_name` | `readWorkStateState` returns `null` |
| `workstate.json` has `worktree_path: null` | Field stripped, returned as `undefined` |
| `workstate.json` has `worktree_path: 42` | Field stripped, returned as `undefined` |
| `workstate.json` has no `worktree_path` | Works normally, no crash |
| `workstate.json` has valid `worktree_path` | Preserved, included in continuation prompt |
| setTimeout retry with corrupted workstate.json | Error caught and logged, no process crash |
| `getPlanProgress(undefined)` | Returns `{ total: 0, completed: 0, isComplete: true }` |
