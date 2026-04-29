# Execution Plan: Fix Lead Hook Crash on Missing worktree_path

## Bug Analysis

### Root Cause

`readWorkStateState()` in `src/features/work-state/storage.ts` performs minimal validation when parsing `workstate.json`:

```typescript
const parsed = JSON.parse(content)
if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null
if (!Array.isArray(parsed.session_ids)) parsed.session_ids = []
return parsed as WorkStateState  // <-- unsafe cast, no field validation
```

It validates `session_ids` but NOT `active_plan`, `plan_name`, or `worktree_path`. This means a malformed `workstate.json` (e.g., `{}` or missing key fields) passes through and downstream code crashes.

### Crash Path

1. `workstate.json` is written without required fields (manual edit, corruption, partial write)
2. `readWorkStateState()` returns it as `WorkStateState` with `active_plan: undefined`
3. Multiple call sites pass `workstateState.active_plan` to `getPlanProgress(planPath: string)`:
   - `src/hooks/lead/idle-event.ts:72` (inside `setTimeout` callback - unhandled rejection!)
   - `src/hooks/lead/resolve-active-workstate-session.ts:21`
   - `src/hooks/lead/tool-execute-after.ts:74`
4. `getPlanProgress()` calls `existsSync(undefined)` which throws: `TypeError: The "path" argument must be of type string`

### worktree_path-Specific Issues

When `worktree_path` field is missing from `workstate.json`:
- The `idle-event.ts` `scheduleRetry` setTimeout callback (lines 62-88) has NO try/catch. An unhandled promise rejection from the async callback crashes the process.
- `readWorkStateState()` returns `worktree_path: undefined` which itself is handled in `workstate-continuation-injector.ts` (line 42 uses truthiness check), but the surrounding code in the setTimeout lacks error protection.

### Secondary Issue: Unhandled Promise in setTimeout

In `idle-event.ts` lines 62-88:
```typescript
sessionState.pendingRetryTimer = setTimeout(async () => {
  // ... no try/catch wrapper
  const currentWorkState = readWorkStateState(ctx.directory)
  const currentProgress = getPlanProgress(currentWorkState.active_plan)  // CRASH if active_plan undefined
  // ...
}, RETRY_DELAY_MS)
```

The async callback creates a floating promise. Any thrown error becomes an unhandled rejection.

---

## Step-by-Step Plan

### Step 1: Harden `readWorkStateState()` validation
**File:** `src/features/work-state/storage.ts`

- After the `session_ids` fix, add validation for `active_plan` and `plan_name` (required fields)
- Validate `worktree_path` is either `undefined` or a string (not `null`, not a number)
- Return `null` for workstate states with missing required fields

### Step 2: Add try/catch in setTimeout callback
**File:** `src/hooks/lead/idle-event.ts`

- Wrap the `setTimeout` async callback body in try/catch
- Log errors with the lead hook logger

### Step 3: Add defensive guard in `getPlanProgress`
**File:** `src/features/work-state/storage.ts`

- Add early return for non-string `planPath` argument

### Step 4: Add tests
**Files:**
- `src/features/work-state/storage.test.ts` - test missing/malformed fields
- `src/hooks/lead/index.test.ts` - test lead hook with workstate missing worktree_path

### Step 5: Run CI checks
```bash
bun run typecheck
bun test src/features/work-state/storage.test.ts
bun test src/hooks/lead/index.test.ts
bun test  # full suite
```

### Step 6: Create PR
- Branch: `fix/lead-hook-missing-worktree-path`
- Target: `dev`
- Run CI and verify passes
