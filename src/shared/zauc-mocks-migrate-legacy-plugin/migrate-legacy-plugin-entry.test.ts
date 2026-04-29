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

  describe("#given opencode.json contains oh-my-cortex plugin entry", () => {
    describe("#when migrating the config", () => {
      it("#then replaces oh-my-cortex with oh-my-cortex", async () => {
        const configPath = join(testDir, "opencode.json")
        writeFileSync(configPath, JSON.stringify({ plugin: ["oh-my-cortex@latest"] }, null, 2))
        const { migrateLegacyPluginEntry } = await importFreshMigrationModule()

        const result = migrateLegacyPluginEntry(configPath)

        expect(result).toBe(true)
        const content = readFileSync(configPath, "utf-8")
        expect(content).toContain("oh-my-cortex@latest")
        expect(content).not.toContain("oh-my-cortex")
      })
    })
  })

  describe("#given opencode.json contains bare oh-my-cortex entry", () => {
    describe("#when migrating the config", () => {
      it("#then replaces with oh-my-cortex", async () => {
        const configPath = join(testDir, "opencode.json")
        writeFileSync(configPath, JSON.stringify({ plugin: ["oh-my-cortex"] }, null, 2))
        const { migrateLegacyPluginEntry } = await importFreshMigrationModule()

        const result = migrateLegacyPluginEntry(configPath)

        expect(result).toBe(true)
        const content = readFileSync(configPath, "utf-8")
        expect(content).toContain('"oh-my-cortex"')
        expect(content).not.toContain("oh-my-cortex")
      })
    })
  })

  describe("#given renaming the temp file fails after writing the migrated config", () => {
    describe("#when migrating the config", () => {
      it("#then keeps the original config untouched and writes the migrated content to a sibling temp file", async () => {
        const configPath = join(testDir, "opencode.json")
        const originalContent = JSON.stringify({ plugin: ["oh-my-cortex@latest"] }, null, 2)
        const tempPath = `${configPath}.tmp`
        writeFileSync(configPath, originalContent)

        const fs = await import("node:fs")
        const originalRenameSync = fs.renameSync

        mock.module("node:fs", () => ({
          ...fs,
          renameSync: () => {
            throw new Error("simulated rename failure")
          },
        }))

        try {
          const { migrateLegacyPluginEntry } = await importFreshMigrationModule()

          const result = migrateLegacyPluginEntry(configPath)

          expect(result).toBe(false)
          expect(readFileSync(configPath, "utf-8")).toBe(originalContent)
          expect(readFileSync(tempPath, "utf-8")).toContain("oh-my-cortex@latest")
          expect(readFileSync(tempPath, "utf-8")).not.toContain("oh-my-cortex")
        } finally {
          mock.module("node:fs", () => ({
            ...fs,
            renameSync: originalRenameSync,
          }))
        }
      })
    })
  })

  describe("#given opencode.json contains pinned oh-my-cortex version", () => {
    describe("#when migrating the config", () => {
      it("#then preserves the version pin", async () => {
        const configPath = join(testDir, "opencode.json")
        writeFileSync(configPath, JSON.stringify({ plugin: ["oh-my-cortex@3.11.0"] }, null, 2))
        const { migrateLegacyPluginEntry } = await importFreshMigrationModule()

        const result = migrateLegacyPluginEntry(configPath)

        expect(result).toBe(true)
        const content = readFileSync(configPath, "utf-8")
        expect(content).toContain("oh-my-cortex@3.11.0")
      })
    })
  })

  describe("#given opencode.json already uses oh-my-cortex", () => {
    describe("#when checking for migration", () => {
      it("#then returns false and does not modify the file", async () => {
        const configPath = join(testDir, "opencode.json")
        const original = JSON.stringify({ plugin: ["oh-my-cortex@latest"] }, null, 2)
        writeFileSync(configPath, original)
        const { migrateLegacyPluginEntry } = await importFreshMigrationModule()

        const result = migrateLegacyPluginEntry(configPath)

        expect(result).toBe(false)
        expect(readFileSync(configPath, "utf-8")).toBe(original)
      })
    })
  })

  describe("#given plugin entries contain both canonical and legacy values", () => {
    describe("#when migrating the config", () => {
      it("#then removes the legacy entry instead of duplicating the canonical one", async () => {
        const configPath = join(testDir, "opencode.json")
        writeFileSync(configPath, JSON.stringify({ plugin: ["oh-my-cortex", "oh-my-cortex"] }, null, 2))
        const { migrateLegacyPluginEntry } = await importFreshMigrationModule()

        const result = migrateLegacyPluginEntry(configPath)

        expect(result).toBe(true)
        const saved = JSON.parse(readFileSync(configPath, "utf-8")) as { plugin: string[] }
        expect(saved.plugin).toEqual(["oh-my-cortex"])
      })
    })
  })

  describe("#given unrelated strings contain the legacy package name", () => {
    describe("#when migrating the config", () => {
      it("#then rewrites only plugin entries and preserves unrelated fields", async () => {
        const configPath = join(testDir, "opencode.json")
        writeFileSync(
          configPath,
          JSON.stringify(
            {
              plugin: ["oh-my-cortex"],
              notes: "keep oh-my-cortex in this text field",
              paths: ["/tmp/oh-my-cortex/cache"],
            },
            null,
            2,
          ),
        )
        const { migrateLegacyPluginEntry } = await importFreshMigrationModule()

        const result = migrateLegacyPluginEntry(configPath)

        expect(result).toBe(true)
        const saved = JSON.parse(readFileSync(configPath, "utf-8")) as {
          plugin: string[]
          notes: string
          paths: string[]
        }
        expect(saved.plugin).toEqual(["oh-my-cortex"])
        expect(saved.notes).toBe("keep oh-my-cortex in this text field")
        expect(saved.paths).toEqual(["/tmp/oh-my-cortex/cache"])
      })
    })
  })

  describe("#given opencode.jsonc contains a nested plugin key before the top-level plugin array", () => {
    describe("#when migrating the config", () => {
      it("#then rewrites only the top-level plugin array", async () => {
        const configPath = join(testDir, "opencode.jsonc")
        writeFileSync(
          configPath,
          `{
  "nested": {
    "plugin": ["oh-my-cortex"]
  },
  "plugin": ["oh-my-cortex@latest"]
}
`,
        )
        const { migrateLegacyPluginEntry } = await importFreshMigrationModule()

        const result = migrateLegacyPluginEntry(configPath)

        expect(result).toBe(true)
        const content = readFileSync(configPath, "utf-8")
        expect(content).toContain(`"nested": {
    "plugin": ["oh-my-cortex"]
  }`)
        expect(content).toContain(`"plugin": [
    "oh-my-cortex@latest"
  ]`)
      })
    })
  })

  describe("#given config file does not exist", () => {
    describe("#when attempting migration", () => {
      it("#then returns false", async () => {
        const { migrateLegacyPluginEntry } = await importFreshMigrationModule()
        const result = migrateLegacyPluginEntry(join(testDir, "nonexistent.json"))

        expect(result).toBe(false)
      })
    })
  })
})