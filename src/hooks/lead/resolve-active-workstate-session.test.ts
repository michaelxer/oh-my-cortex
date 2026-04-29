import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { randomUUID } from "node:crypto"
import { clearWorkStateState, writeWorkStateState } from "../../features/work-state"
import { resolveActiveWorkStateSession } from "./resolve-active-workstate-session"

describe("resolveActiveWorkStateSession", () => {
  let testDirectory = ""

  beforeEach(() => {
    testDirectory = join(tmpdir(), `resolve-active-workstate-${randomUUID()}`)
    if (!existsSync(testDirectory)) {
      mkdirSync(testDirectory, { recursive: true })
    }
    clearWorkStateState(testDirectory)
  })

  afterEach(() => {
    clearWorkStateState(testDirectory)
    if (existsSync(testDirectory)) {
      rmSync(testDirectory, { recursive: true, force: true })
    }
  })

  test("returns null for unrelated session even when active workstate plan is complete", async () => {
    // given
    const planPath = join(testDirectory, "complete-plan.md")
    writeFileSync(planPath, "# Plan\n- [x] Task 1\n", "utf-8")
    writeWorkStateState(testDirectory, {
      active_plan: planPath,
      started_at: "2026-01-02T10:00:00Z",
      session_ids: ["ses_tracked"],
      session_origins: { ses_tracked: "direct" },
      plan_name: "complete-plan",
    })

    // when
    const result = await resolveActiveWorkStateSession({
      client: { session: { get: async () => ({ data: {} }) } } as never,
      directory: testDirectory,
      sessionID: "ses_unrelated",
    })

    // then
    expect(result).toBeNull()
  })

  test("returns tracked direct session for incomplete workstate plan", async () => {
    // given
    const planPath = join(testDirectory, "incomplete-plan.md")
    writeFileSync(planPath, "# Plan\n- [ ] Task 1\n", "utf-8")
    writeWorkStateState(testDirectory, {
      active_plan: planPath,
      started_at: "2026-01-02T10:00:00Z",
      session_ids: ["ses_tracked"],
      session_origins: { ses_tracked: "direct" },
      plan_name: "incomplete-plan",
    })

    // when
    const result = await resolveActiveWorkStateSession({
      client: { session: { get: async () => ({ data: {} }) } } as never,
      directory: testDirectory,
      sessionID: "ses_tracked",
    })

    // then
    expect(result).not.toBeNull()
    expect(result?.progress.isComplete).toBe(false)
    expect(result?.workstateState.session_ids).toContain("ses_tracked")
  })

  test("returns tracked appended session for incomplete workstate plan", async () => {
    // given
    const planPath = join(testDirectory, "appended-incomplete-plan.md")
    writeFileSync(planPath, "# Plan\n- [ ] Task 1\n", "utf-8")
    writeWorkStateState(testDirectory, {
      active_plan: planPath,
      started_at: "2026-01-02T10:00:00Z",
      session_ids: ["ses_root", "ses_appended"],
      session_origins: { ses_root: "direct", ses_appended: "appended" },
      plan_name: "appended-incomplete-plan",
    })

    // when
    const result = await resolveActiveWorkStateSession({
      client: { session: { get: async () => ({ data: {} }) } } as never,
      directory: testDirectory,
      sessionID: "ses_appended",
    })

    // then
    expect(result).not.toBeNull()
    expect(result?.progress.isComplete).toBe(false)
    expect(result?.workstateState.session_ids).toContain("ses_appended")
  })
})
