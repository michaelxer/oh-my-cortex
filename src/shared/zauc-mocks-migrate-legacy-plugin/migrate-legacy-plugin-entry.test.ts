/// <reference path="../../../bun-test.d.ts" />

import { afterAll, afterEach, beforeEach, describe, expect, it, mock } from "bun:test"
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

async function importFreshMigrationModule(): Promise<typeof import("../migrate-legacy-plugin-entry")> {
  return import(`../migrate-legacy-plugin-entry?test=${Date.now()}-${Math.random()}`)
}

afterAll(() => {
  mock.restore()
})

describe("migrateLegacyPluginEntry", () => {
  let testDir = ""

  beforeEach(() => {
    testDir = join(tmpdir(), `omx-migrate-entry-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    mkdirSync(testDir, { recursive: true })
  })

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true })
  })

  it("#given config already uses standalone OMX #then returns false and does not modify the file", async () => {
    const configPath = join(testDir, "opencode.json")
    const original = JSON.stringify({ plugin: ["oh-my-cortex@latest"] }, null, 2)
    writeFileSync(configPath, original)
    const { migrateLegacyPluginEntry } = await importFreshMigrationModule()

    const result = migrateLegacyPluginEntry(configPath)

    expect(result).toBe(false)
    expect(readFileSync(configPath, "utf-8")).toBe(original)
  })

  it("#given unrelated fields mention oh-my-cortex #then returns false and preserves the file", async () => {
    const configPath = join(testDir, "opencode.json")
    const original = JSON.stringify(
      {
        plugin: ["oh-my-cortex"],
        notes: "keep oh-my-cortex in this text field",
        paths: ["/tmp/oh-my-cortex/cache"],
      },
      null,
      2,
    )
    writeFileSync(configPath, original)
    const { migrateLegacyPluginEntry } = await importFreshMigrationModule()

    const result = migrateLegacyPluginEntry(configPath)

    expect(result).toBe(false)
    expect(readFileSync(configPath, "utf-8")).toBe(original)
  })

  it("#given config file does not exist #then returns false", async () => {
    const { migrateLegacyPluginEntry } = await importFreshMigrationModule()

    const result = migrateLegacyPluginEntry(join(testDir, "nonexistent.json"))

    expect(result).toBe(false)
  })
})
