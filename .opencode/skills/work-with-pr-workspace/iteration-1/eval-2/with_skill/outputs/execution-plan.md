# Execution Plan — Fix lead hook crash on missing worktree_path

## Phase 0: Setup

1. **Create worktree from origin/dev**:
   ```bash
   git fetch origin dev
   git worktree add ../omx-wt/fix-lead-worktree-path-crash origin/dev
   ```
2. **Create feature branch**:
   ```bash
   cd ../omx-wt/fix-lead-worktree-path-crash
   git checkout -b fix/lead-worktree-path-crash
   ```

## Phase 1: Implement

### Step 1: Fix `readWorkStateState()` in `src/features/work-state/storage.ts`
- Add `worktree_path` sanitization after JSON parse
- Ensure `worktree_path` is `string | undefined`, never `null` or other types
- This is the root cause: raw `JSON.parse` + `as WorkStateState` cast allows type violations at runtime

### Step 2: Add defensive guard in `src/hooks/lead/idle-event.ts`
- Before passing `workstateState.worktree_path` to `injectContinuation`, validate it's a string
- Apply same guard in the `scheduleRetry` callback (line 86)
- Ensures even if `readWorkStateState` is bypassed, the idle handler won't crash

### Step 3: Add test coverage in `src/hooks/lead/index.test.ts`
- Add test: workstate.json without `worktree_path` field → session.idle works
- Add test: workstate.json with `worktree_path: null` → session.idle works (no `[Worktree: null]` in prompt)
- Add test: `readWorkStateState` sanitizes `null` worktree_path to `undefined`
- Follow existing given/when/then test pattern

### Step 4: Local validation
```bash
bun run typecheck
bun test src/hooks/lead/
bun test src/features/work-state/
bun run build
```

### Step 5: Atomic commit
```bash
git add src/features/work-state/storage.ts src/hooks/lead/idle-event.ts src/hooks/lead/index.test.ts
git commit -m "fix(lead): prevent crash when workstate.json missing worktree_path field

readWorkStateState() performs unsafe cast of parsed JSON as WorkStateState.
When worktree_path is absent or null in workstate.json, downstream code
in idle-event.ts could receive null where string|undefined is expected.

- Sanitize worktree_path in readWorkStateState (reject non-string values)
- Add defensive typeof check in idle-event before passing to continuation
- Add test coverage for missing and null worktree_path scenarios"
```

## Phase 2: PR Creation

```bash
git push -u origin fix/lead-worktree-path-crash
gh pr create \
  --base dev \
  --title "fix(lead): prevent crash when workstate.json missing worktree_path" \
  --body-file /tmp/pull-request-lead-worktree-fix.md
```

## Phase 3: Verify Loop

- **Gate A (CI)**: `gh pr checks --watch` — wait for all checks green
- **Gate B (review-work)**: Run 5-agent review (Thinker goal, Thinker quality, Thinker security, QA execution, context mining)
- **Gate C (Cubic)**: Wait for cubic-dev-ai[bot] to respond "No issues found"
- On any failure: fix-commit-push, re-enter verify loop

## Phase 4: Merge

```bash
gh pr merge --squash --delete-branch
git worktree remove ../omx-wt/fix-lead-worktree-path-crash
```
