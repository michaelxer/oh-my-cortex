/// <reference types="bun-types" />

import { afterEach, describe, expect, test } from "bun:test"
import { mkdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { createCortexSearchTool } from "."

const tempDirs: string[] = []

function createProject(): string {
  const project = join(tmpdir(), `omx-cortex-search-tool-${Date.now()}-${Math.random().toString(16).slice(2)}`)
  mkdirSync(join(project, ".cortex", "ledgers"), { recursive: true })
  tempDirs.push(project)
  return project
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe("cortex_search tool", () => {
  test("returns JSON search results", async () => {
    const project = createProject()
    writeFileSync(
      join(project, ".cortex", "ledgers", "CONTINUITY_session.md"),
      "# Session\nLedger mentions hyperplan memory.",
      "utf8",
    )
    const tool = createCortexSearchTool(project)

    const raw = await tool.execute({ query: "hyperplan", limit: 5 }, {} as never)
    const parsed = JSON.parse(raw)

    expect(parsed.query).toBe("hyperplan")
    expect(parsed.results).toHaveLength(1)
    expect(parsed.results[0].type).toBe("ledger")
  })

  test("returns an empty result message", async () => {
    const project = createProject()
    const tool = createCortexSearchTool(project)

    const raw = await tool.execute({ query: "missing" }, {} as never)
    const parsed = JSON.parse(raw)

    expect(parsed.results).toEqual([])
    expect(parsed.message).toContain("No OMX memory artifacts")
  })
})
