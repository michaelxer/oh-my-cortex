import { describe, expect, it } from "bun:test"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

const { checkForLegacyPluginEntry } = await import(
  new URL("./legacy-plugin-warning.ts?real-legacy-plugin-warning-test", import.meta.url).href
)

function createTestConfigDir(): string {
  return mkdtempSync(join(tmpdir(), "omx-legacy-check-"))
}

function cleanupTestConfigDir(testConfigDir: string): void {
  rmSync(testConfigDir, { recursive: true, force: true })
}

describe("checkForLegacyPluginEntry", () => {
  it("does not flag the standalone OMX package as legacy", () => {
    const testConfigDir = createTestConfigDir()

    try {
      writeFileSync(join(testConfigDir, "opencode.json"), JSON.stringify({ plugin: ["oh-my-cortex"] }, null, 2))

      const result = checkForLegacyPluginEntry(testConfigDir)

      expect(result.hasLegacyEntry).toBe(false)
      expect(result.hasCanonicalEntry).toBe(true)
      expect(result.legacyEntries).toEqual([])
      expect(result.configPath).toBe(join(testConfigDir, "opencode.json"))
    } finally {
      cleanupTestConfigDir(testConfigDir)
    }
  })

  it("does not flag pinned standalone OMX entries as legacy", () => {
    const testConfigDir = createTestConfigDir()

    try {
      writeFileSync(join(testConfigDir, "opencode.json"), JSON.stringify({ plugin: ["oh-my-cortex@0.1.0"] }, null, 2))

      const result = checkForLegacyPluginEntry(testConfigDir)

      expect(result.hasLegacyEntry).toBe(false)
      expect(result.hasCanonicalEntry).toBe(true)
      expect(result.legacyEntries).toEqual([])
    } finally {
      cleanupTestConfigDir(testConfigDir)
    }
  })

  it("returns no warning data when config is missing", () => {
    const testConfigDir = createTestConfigDir()

    try {
      const result = checkForLegacyPluginEntry(testConfigDir)

      expect(result.hasLegacyEntry).toBe(false)
      expect(result.hasCanonicalEntry).toBe(false)
      expect(result.legacyEntries).toEqual([])
      expect(result.configPath).toBeNull()
    } finally {
      cleanupTestConfigDir(testConfigDir)
    }
  })
})
