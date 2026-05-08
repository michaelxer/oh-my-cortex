/// <reference types="bun-types" />

import { afterEach, describe, expect, test } from "bun:test"
import { mkdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { searchCortexArtifacts } from "."

const tempDirs: string[] = []

function createProject(): string {
  const root = join(tmpdir(), `omx-artifacts-root-${Date.now()}-${Math.random().toString(16).slice(2)}`)
  const project = join(root, "oh-my-cortex")
  mkdirSync(project, { recursive: true })
  tempDirs.push(root)
  return project
}

function writeArtifact(project: string, relativePath: string, content: string): void {
  const filePath = join(project, relativePath)
  mkdirSync(join(filePath, ".."), { recursive: true })
  writeFileSync(filePath, content, "utf8")
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe("searchCortexArtifacts", () => {
  test("searches cortex ledgers, plans, evidence, file ops, and nearby handoffs", () => {
    const project = createProject()
    writeArtifact(project, ".cortex/ledgers/CONTINUITY_session.md", "# Ledger\nAXR fallback decision")
    writeArtifact(project, ".cortex/plans/memory.md", "# Memory Plan\nArtifact search roadmap")
    writeArtifact(project, ".cortex/evidence/run.md", "# Evidence\nTypecheck passed")
    writeArtifact(project, ".cortex/file-ops/session.json", "{\"operations\":[{\"summary\":\"rg AXR src\"}]}")
    const handoffDir = join(project, "..", "HANDOFF_DOC")
    mkdirSync(handoffDir, { recursive: true })
    writeFileSync(join(handoffDir, "handoff-10.md"), "# Handoff\nAXR publishing notes", "utf8")

    const results = searchCortexArtifacts(project, "AXR", { limit: 10 })

    expect(results.map((result) => result.type)).toContain("ledger")
    expect(results.map((result) => result.type)).toContain("file_ops")
    expect(results.map((result) => result.type)).toContain("handoff")
    expect(results[0]?.score).toBeGreaterThan(0)
  })

  test("filters by artifact type", () => {
    const project = createProject()
    writeArtifact(project, ".cortex/ledgers/CONTINUITY_session.md", "# Ledger\nsame keyword")
    writeArtifact(project, ".cortex/plans/memory.md", "# Plan\nsame keyword")

    const results = searchCortexArtifacts(project, "same", { types: ["plan"] })

    expect(results).toHaveLength(1)
    expect(results[0]?.type).toBe("plan")
  })
})
