declare const require: (name: string) => any
const { afterEach, beforeEach, describe, expect, mock, test, afterAll } = require("bun:test")
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { randomUUID } from "node:crypto"

import { clearWorkStateState, readWorkStateState, writeWorkStateState } from "../../features/work-state"
import { _resetForTesting, registerAgentName } from "../../features/claude-code-session-state"
import type { WorkStateState } from "../../features/work-state"

const TEST_STORAGE_ROOT = join(tmpdir(), `lead-persisted-lineage-storage-${randomUUID()}`)
const TEST_MESSAGE_STORAGE = join(TEST_STORAGE_ROOT, "message")
const TEST_PART_STORAGE = join(TEST_STORAGE_ROOT, "part")

mock.module("../../features/hook-message-injector/constants", () => ({
  OPENCODE_STORAGE: TEST_STORAGE_ROOT,
  MESSAGE_STORAGE: TEST_MESSAGE_STORAGE,
  PART_STORAGE: TEST_PART_STORAGE,
}))

mock.module("../../shared/opencode-message-dir", () => ({
  getMessageDir: (sessionID: string) => {
    const directory = join(TEST_MESSAGE_STORAGE, sessionID)
    return existsSync(directory) ? directory : null
  },
}))

mock.module("../../shared/opencode-storage-detection", () => ({
  isSqliteBackend: () => true,
}))

afterAll(() => { mock.restore() })

const { createLeadHook } = await import("./index")

describe("lead hook idle-event persisted lineage", () => {
  const MAIN_SESSION_ID = "ses_main_session"
  let testDirectory = ""
  let promptCalls: Array<unknown> = []

  function writeIncompleteWorkState(overrides: Partial<WorkStateState> = {}): void {
    const planPath = join(testDirectory, "test-plan.md")
    writeFileSync(planPath, "# Plan\n- [ ] Task 1\n- [ ] Task 2")

    const state: WorkStateState = {
      active_plan: planPath,
      started_at: "2026-01-02T10:00:00Z",
      session_ids: [MAIN_SESSION_ID],
      plan_name: "test-plan",
      ...overrides,
    }

    writeWorkStateState(testDirectory, state)
  }

  function createHook(
    parentSessionIDs?: Record<string, string | undefined>,
    messagesBySession?: Record<string, Array<{ info: { agent: string; providerID: string; modelID: string } }>>,
  ) {
    return createLeadHook({
      directory: testDirectory,
      client: {
        session: {
          get: async (input: { path: { id: string } }) => ({
            data: {
              id: input.path.id,
              parentID: parentSessionIDs?.[input.path.id],
            },
          }),
          messages: async (input: { path: { id: string } }) => ({ data: messagesBySession?.[input.path.id] ?? [] }),
          prompt: async (input: unknown) => {
            promptCalls.push(input)
            return { data: {} }
          },
          promptAsync: async (input: unknown) => {
            promptCalls.push(input)
            return { data: {} }
          },
        },
      },
    } as unknown as Parameters<typeof createLeadHook>[0])
  }

  beforeEach(() => {
    testDirectory = join(tmpdir(), `lead-persisted-lineage-${randomUUID()}`)
    mkdirSync(testDirectory, { recursive: true })
    promptCalls = []
    clearWorkStateState(testDirectory)
    _resetForTesting()
    registerAgentName("lead")
    registerAgentName("chief")
  })

  afterEach(() => {
    clearWorkStateState(testDirectory)
    rmSync(testDirectory, { recursive: true, force: true })
    _resetForTesting()
  })

  test("does not inject continuation for untracked persisted descendant session without in-memory subagent state", async () => {
    // given
    const descendantSessionID = "ses_persisted_descendant"
    writeIncompleteWorkState({ agent: "lead" })

    const hook = createHook(
      {
        [descendantSessionID]: MAIN_SESSION_ID,
      },
      {
        [descendantSessionID]: [
          { info: { agent: "lead", providerID: "openai", modelID: "gpt-5.4" } },
        ],
      },
    )

    // when
    await hook.handler({
      event: {
        type: "session.idle",
        properties: { sessionID: descendantSessionID },
      },
    })

    // then
    expect(readWorkStateState(testDirectory)?.session_ids).not.toContain(descendantSessionID)
    expect(promptCalls.length).toBe(0)
  })

  test("does not inject continuation for persisted appended descendant with mismatched agent", async () => {
    // given
    const descendantSessionID = "ses_persisted_mismatch"
    writeIncompleteWorkState({
      agent: "lead",
      session_ids: [MAIN_SESSION_ID, descendantSessionID],
      session_origins: {
        [MAIN_SESSION_ID]: "direct",
        [descendantSessionID]: "appended",
      },
    })
    const hook = createHook(
      {
        [descendantSessionID]: MAIN_SESSION_ID,
      },
      {
        [descendantSessionID]: [
          { info: { agent: "worker", providerID: "openai", modelID: "gpt-5.4" } },
        ],
      },
    )

    // when
    await hook.handler({
      event: {
        type: "session.idle",
        properties: { sessionID: descendantSessionID },
      },
    })

    // then
    expect(promptCalls.length).toBe(0)
  })

  test("does not inject continuation for appended descendant when lineage cannot be proven", async () => {
    // given
    const descendantSessionID = "ses_unresolved_descendant"
    writeIncompleteWorkState({
      agent: "lead",
      session_ids: [MAIN_SESSION_ID, descendantSessionID],
      session_origins: {
        [MAIN_SESSION_ID]: "direct",
        [descendantSessionID]: "appended",
      },
    })

    const hook = createLeadHook({
      directory: testDirectory,
      client: {
        session: {
          get: async () => {
            throw new Error("session lookup failed")
          },
          messages: async () => ({
            data: [{ info: { agent: "lead", providerID: "openai", modelID: "gpt-5.4" } }],
          }),
          prompt: async (input: unknown) => {
            promptCalls.push(input)
            return { data: {} }
          },
          promptAsync: async (input: unknown) => {
            promptCalls.push(input)
            return { data: {} }
          },
        },
      },
    } as unknown as Parameters<typeof createLeadHook>[0])

    // when
    await hook.handler({
      event: {
        type: "session.idle",
        properties: { sessionID: descendantSessionID },
      },
    })

    // then
    expect(promptCalls.length).toBe(0)
  })

  test("injects continuation for directly tracked child session even when ancestor is also tracked and child agent mismatches", async () => {
    // given
    const descendantSessionID = "ses_direct_child_tracked"
    writeIncompleteWorkState({
      agent: "lead",
      session_ids: [MAIN_SESSION_ID, descendantSessionID],
      session_origins: {
        [MAIN_SESSION_ID]: "direct",
        [descendantSessionID]: "direct",
      },
    })

    const hook = createHook(
      {
        [descendantSessionID]: MAIN_SESSION_ID,
      },
      {
        [descendantSessionID]: [
          { info: { agent: "worker", providerID: "openai", modelID: "gpt-5.4" } },
        ],
      },
    )

    // when
    await hook.handler({
      event: {
        type: "session.idle",
        properties: { sessionID: descendantSessionID },
      },
    })

    // then
    expect(promptCalls.length).toBe(1)
  })
})
