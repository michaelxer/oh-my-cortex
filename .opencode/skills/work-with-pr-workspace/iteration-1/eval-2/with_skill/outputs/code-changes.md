# Code Changes

## File 1: `src/features/work-state/storage.ts`

**Change**: Add `worktree_path` sanitization in `readWorkStateState()`

```typescript
// BEFORE (lines 29-32):
    if (!Array.isArray(parsed.session_ids)) {
      parsed.session_ids = []
    }
    return parsed as WorkStateState

// AFTER:
    if (!Array.isArray(parsed.session_ids)) {
      parsed.session_ids = []
    }
    if (parsed.worktree_path !== undefined && typeof parsed.worktree_path !== "string") {
      parsed.worktree_path = undefined
    }
    return parsed as WorkStateState
```

**Rationale**: `readWorkStateState` casts raw `JSON.parse()` output as `WorkStateState` without validating individual fields. When workstate.json has `"worktree_path": null` (valid JSON from manual edits, corrupted state, or external tools), the runtime type is `null` but TypeScript type says `string | undefined`. This sanitization ensures downstream code always gets the correct type.

---

## File 2: `src/hooks/lead/idle-event.ts`

**Change**: Add defensive string type guard before passing `worktree_path` to continuation functions.

```typescript
// BEFORE (lines 83-88 in scheduleRetry):
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

// AFTER:
      await injectContinuation({
        ctx,
        sessionID,
        sessionState,
        options,
        planName: currentWorkState.plan_name,
        progress: currentProgress,
        agent: currentWorkState.agent,
        worktreePath: typeof currentWorkState.worktree_path === "string" ? currentWorkState.worktree_path : undefined,
      })
```

```typescript
// BEFORE (lines 184-188 in handleLeadSessionIdle):
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

// AFTER:
  await injectContinuation({
    ctx,
    sessionID,
    sessionState,
    options,
    planName: workstateState.plan_name,
    progress,
    agent: workstateState.agent,
    worktreePath: typeof workstateState.worktree_path === "string" ? workstateState.worktree_path : undefined,
  })
```

**Rationale**: Belt-and-suspenders defense. Even though `readWorkStateState` now sanitizes, direct `writeWorkStateState` calls elsewhere could still produce invalid state. The `typeof` check is zero-cost and prevents any possibility of `null` or non-string values leaking through.

---

## File 3: `src/hooks/lead/index.test.ts`

**Change**: Add test cases for missing `worktree_path` scenarios within the existing `session.idle handler` describe block.

```typescript
    test("should inject continuation when workstate.json has no worktree_path field", async () => {
      // given - workstate state WITHOUT worktree_path
      const planPath = join(TEST_DIR, "test-plan.md")
      writeFileSync(planPath, "# Plan\n- [ ] Task 1\n- [x] Task 2")

      const state: WorkStateState = {
        active_plan: planPath,
        started_at: "2026-01-02T10:00:00Z",
        session_ids: [MAIN_SESSION_ID],
        plan_name: "test-plan",
      }
      writeWorkStateState(TEST_DIR, state)

      const readState = readWorkStateState(TEST_DIR)
      expect(readState?.worktree_path).toBeUndefined()

      const mockInput = createMockPluginInput()
      const hook = createLeadHook(mockInput)

      // when
      await hook.handler({
        event: {
          type: "session.idle",
          properties: { sessionID: MAIN_SESSION_ID },
        },
      })

      // then - continuation injected, no worktree context in prompt
      expect(mockInput._promptMock).toHaveBeenCalled()
      const callArgs = mockInput._promptMock.mock.calls[0][0]
      expect(callArgs.body.parts[0].text).not.toContain("[Worktree:")
      expect(callArgs.body.parts[0].text).toContain("1 remaining")
    })

    test("should handle workstate.json with worktree_path: null without crashing", async () => {
      // given - manually write workstate.json with worktree_path: null (corrupted state)
      const planPath = join(TEST_DIR, "test-plan.md")
      writeFileSync(planPath, "# Plan\n- [ ] Task 1\n- [x] Task 2")

      const workstatePath = join(CHIEF_DIR, "workstate.json")
      writeFileSync(workstatePath, JSON.stringify({
        active_plan: planPath,
        started_at: "2026-01-02T10:00:00Z",
        session_ids: [MAIN_SESSION_ID],
        plan_name: "test-plan",
        worktree_path: null,
      }, null, 2))

      const mockInput = createMockPluginInput()
      const hook = createLeadHook(mockInput)

      // when
      await hook.handler({
        event: {
          type: "session.idle",
          properties: { sessionID: MAIN_SESSION_ID },
        },
      })

      // then - should inject continuation without crash, no "[Worktree: null]"
      expect(mockInput._promptMock).toHaveBeenCalled()
      const callArgs = mockInput._promptMock.mock.calls[0][0]
      expect(callArgs.body.parts[0].text).not.toContain("[Worktree: null]")
      expect(callArgs.body.parts[0].text).not.toContain("[Worktree: undefined]")
    })
```

---

## File 4: `src/features/work-state/storage.test.ts` (addition to existing)

**Change**: Add `readWorkStateState` sanitization test.

```typescript
  describe("#given workstate.json with worktree_path: null", () => {
    test("#then readWorkStateState should sanitize null to undefined", () => {
      // given
      const workstatePath = join(TEST_DIR, ".cortex", "workstate.json")
      writeFileSync(workstatePath, JSON.stringify({
        active_plan: "/path/to/plan.md",
        started_at: "2026-01-02T10:00:00Z",
        session_ids: ["session-1"],
        plan_name: "test-plan",
        worktree_path: null,
      }, null, 2))

      // when
      const state = readWorkStateState(TEST_DIR)

      // then
      expect(state).not.toBeNull()
      expect(state!.worktree_path).toBeUndefined()
    })

    test("#then readWorkStateState should preserve valid worktree_path string", () => {
      // given
      const workstatePath = join(TEST_DIR, ".cortex", "workstate.json")
      writeFileSync(workstatePath, JSON.stringify({
        active_plan: "/path/to/plan.md",
        started_at: "2026-01-02T10:00:00Z",
        session_ids: ["session-1"],
        plan_name: "test-plan",
        worktree_path: "/valid/worktree/path",
      }, null, 2))

      // when
      const state = readWorkStateState(TEST_DIR)

      // then
      expect(state?.worktree_path).toBe("/valid/worktree/path")
    })
  })
```
