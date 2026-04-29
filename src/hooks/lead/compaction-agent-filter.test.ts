declare const require: (name: string) => any
const { afterEach, beforeEach, describe, expect, mock, test, afterAll } = require("bun:test")
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { randomUUID } from "node:crypto"

import { clearWorkStateState, writeWorkStateState } from "../../features/work-state"
import { _resetForTesting, registerAgentName } from "../../features/claude-code-session-state"
import type { WorkStateState } from "../../features/work-state"

const TEST_STORAGE_ROOT = join(tmpdir(), `lead-compaction-storage-${randomUUID()}`)
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
  isSqliteBackend: () => false,
}))

afterAll(() => { mock.restore() })

const { createLeadHook } = await import("./index")

describe("lead hook compaction agent filtering", () => {
  let testDirectory: string

  function createMockPluginInput() {
    const promptMock = mock(() => Promise.resolve())
    return {
      directory: testDirectory,
      client: {
        session: {
          prompt: promptMock,
          promptAsync: promptMock,
        },
      },
      _promptMock: promptMock,
    } as Parameters<typeof createLeadHook>[0] & { _promptMock: ReturnType<typeof mock> }
  }

  function writeMessage(sessionID: string, fileName: string, agent: string): void {
    const messageDir = join(TEST_MESSAGE_STORAGE, sessionID)
    mkdirSync(messageDir, { recursive: true })
    writeFileSync(
      join(messageDir, fileName),
      JSON.stringify({
        agent,
        model: { providerID: "anthropic", modelID: "claude-opus-4-7" },
      }),
    )
  }

  beforeEach(() => {
    testDirectory = join(tmpdir(), `lead-compaction-test-${randomUUID()}`)
    mkdirSync(testDirectory, { recursive: true })
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

  test("should inject continuation when the latest message is compaction but the previous agent matches lead", async () => {
    // given
    const sessionID = "main-session-after-compaction"
    const planPath = join(testDirectory, "test-plan.md")
    writeFileSync(planPath, "# Plan\n- [ ] Task 1\n- [ ] Task 2")

    const state: WorkStateState = {
      active_plan: planPath,
      started_at: "2026-01-02T10:00:00Z",
      session_ids: [sessionID],
      plan_name: "test-plan",
      agent: "lead",
    }
    writeWorkStateState(testDirectory, state)
    writeMessage(sessionID, "msg_001.json", "lead")
    writeMessage(sessionID, "msg_002.json", "compaction")

    const mockInput = createMockPluginInput()
    const hook = createLeadHook(mockInput)

    // when
    await hook.handler({
      event: {
        type: "session.idle",
        properties: { sessionID },
      },
    })

    // then
    expect(mockInput._promptMock).toHaveBeenCalledTimes(1)
  })
})
