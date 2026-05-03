import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test"
import { mkdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

const mockMigrateLegacyPluginEntry = mock(() => true)

mock.module("./plugin-entry-migrator", () => ({
  migrateLegacyPluginEntry: mockMigrateLegacyPluginEntry,
}))
mock.module("./plugin-entry-migrator.ts", () => ({
  migrateLegacyPluginEntry: mockMigrateLegacyPluginEntry,
}))

const autoMigrateModulePromise = import("./auto-migrate")

describe("autoMigrateLegacyPluginEntry", () => {
  let testConfigDir = ""

  beforeEach(() => {
    testConfigDir = join(tmpdir(), `omx-legacy-migrate-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    mkdirSync(testConfigDir, { recursive: true })
    mockMigrateLegacyPluginEntry.mockReset()
    mockMigrateLegacyPluginEntry.mockReturnValue(true)
  })

  afterEach(() => {
    rmSync(testConfigDir, { recursive: true, force: true })
  })

  it("#given no config file exists #then returns migrated false", async () => {
    const { autoMigrateLegacyPluginEntry } = await autoMigrateModulePromise

    const result = autoMigrateLegacyPluginEntry(testConfigDir)

    expect(result.migrated).toBe(false)
    expect(result.from).toBeNull()
    expect(result.to).toBeNull()
    expect(mockMigrateLegacyPluginEntry).not.toHaveBeenCalled()
  })

  it("#given only standalone OMX entry exists #then leaves it untouched", async () => {
    writeFileSync(
      join(testConfigDir, "opencode.json"),
      JSON.stringify({ plugin: ["oh-my-cortex@latest"] }, null, 2) + "\n",
    )
    const { autoMigrateLegacyPluginEntry } = await autoMigrateModulePromise

    const result = autoMigrateLegacyPluginEntry(testConfigDir)

    expect(result.migrated).toBe(false)
    expect(result.from).toBeNull()
    expect(result.to).toBeNull()
    expect(mockMigrateLegacyPluginEntry).not.toHaveBeenCalled()
  })

  it("#given comments and standalone OMX entry exist #then leaves jsonc untouched", async () => {
    writeFileSync(
      join(testConfigDir, "opencode.jsonc"),
      '{\n  // my config\n  "plugin": ["oh-my-cortex"]\n}\n',
    )
    const { autoMigrateLegacyPluginEntry } = await autoMigrateModulePromise

    const result = autoMigrateLegacyPluginEntry(testConfigDir)

    expect(result.migrated).toBe(false)
    expect(result.configPath).toBe(join(testConfigDir, "opencode.jsonc"))
    expect(mockMigrateLegacyPluginEntry).not.toHaveBeenCalled()
  })
})
