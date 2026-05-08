/// <reference types="bun-types" />

import { afterEach, describe, expect, test } from "bun:test"
import { existsSync, mkdirSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import {
  buildFileOperationRecord,
  classifyFileOperation,
  createFileOpsTrackerHook,
  getFileOpsPath,
  readSessionFileOps,
} from "."

const tempDirs: string[] = []

function createProject(): string {
  const project = join(tmpdir(), `omx-file-ops-${Date.now()}-${Math.random().toString(16).slice(2)}`)
  mkdirSync(project, { recursive: true })
  tempDirs.push(project)
  return project
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe("file operation classification", () => {
  test("classifies common read, search, and edit tools", () => {
    expect(classifyFileOperation("read", {})).toBe("read")
    expect(classifyFileOperation("grep", {})).toBe("search")
    expect(classifyFileOperation("edit", {})).toBe("edit")
    expect(classifyFileOperation("bash", { command: "Get-Content package.json" })).toBe("shell")
    expect(classifyFileOperation("bash", { command: "Remove-Item old.txt" })).toBe("delete")
  })

  test("extracts path-like arguments into operation records", () => {
    const operation = buildFileOperationRecord({
      tool: "read",
      callID: "call-1",
      args: {
        filePath: "src/index.ts",
        unrelated: "not-a-path-key",
      },
    })

    expect(operation).toEqual({
      callID: "call-1",
      tool: "read",
      kind: "read",
      paths: ["src/index.ts"],
      summary: undefined,
    })
  })
})

describe("file ops tracker", () => {
  test("persists tracked tool operations under .cortex/file-ops", async () => {
    const project = createProject()
    const hook = createFileOpsTrackerHook(project)

    await hook["tool.execute.before"]?.(
      { tool: "read", sessionID: "session/one", callID: "call-1" },
      { args: { path: "src/index.ts" } },
    )
    await hook["tool.execute.before"]?.(
      { tool: "bash", sessionID: "session/one", callID: "call-2" },
      { args: { command: "rg cortex src" } },
    )

    const state = readSessionFileOps(project, "session/one")

    expect(existsSync(getFileOpsPath(project, "session/one"))).toBe(true)
    expect(state.operations).toHaveLength(2)
    expect(state.operations[0]?.paths).toEqual(["src/index.ts"])
    expect(state.operations[1]?.kind).toBe("shell")
    expect(state.operations[1]?.summary).toBe("rg cortex src")
  })

  test("ignores unrelated tools", async () => {
    const project = createProject()
    const hook = createFileOpsTrackerHook(project)

    await hook["tool.execute.before"]?.(
      { tool: "decision_framework", sessionID: "session", callID: "call-1" },
      { args: { topic: "ship it?" } },
    )

    expect(existsSync(getFileOpsPath(project, "session"))).toBe(false)
  })
})
