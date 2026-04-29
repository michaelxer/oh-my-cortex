import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test"
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { migrateLegacyConfigFile } from "./migrate-legacy-config-file"

describe("migrateLegacyConfigFile", () => {
  let testDir = ""

  beforeEach(() => {
    testDir = join(tmpdir(), `omx-migrate-config-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    mkdirSync(testDir, { recursive: true })
  })

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true })
  })

  describe("#given oh-my-cortex.jsonc exists but oh-my-cortex.jsonc does not", () => {
    describe("#when migrating the config file", () => {
      it("#then writes oh-my-cortex.jsonc and renames the legacy file to a backup", () => {
        const legacyPath = join(testDir, "oh-my-cortex.jsonc")
        const backupPath = join(testDir, "oh-my-cortex.jsonc.bak")
        writeFileSync(legacyPath, '{ "agents": {} }')

        const result = migrateLegacyConfigFile(legacyPath)

        expect(result).toBe(true)
        expect(existsSync(join(testDir, "oh-my-cortex.jsonc"))).toBe(true)
        expect(existsSync(legacyPath)).toBe(false)
        expect(existsSync(backupPath)).toBe(true)
        expect(readFileSync(join(testDir, "oh-my-cortex.jsonc"), "utf-8")).toBe('{ "agents": {} }')
        expect(readFileSync(backupPath, "utf-8")).toBe('{ "agents": {} }')
      })
    })
  })

  describe("#given a legacy config sidecar exists", () => {
    describe("#when migrating the config file", () => {
      it("#then copies applied migration history to the canonical sidecar", () => {
        const legacyPath = join(testDir, "oh-my-cortex.json")
        const legacySidecarPath = `${legacyPath}.migrations.json`
        const canonicalSidecarPath = join(testDir, "oh-my-cortex.json.migrations.json")
        writeFileSync(legacyPath, '{ "agents": { "thinker": { "model": "anthropic/claude-opus-4-6" } } }')
        writeFileSync(
          legacySidecarPath,
          JSON.stringify({
            appliedMigrations: [
              "model-version:anthropic/claude-opus-4-6->anthropic/claude-opus-4-7",
            ],
          }),
        )

        const result = migrateLegacyConfigFile(legacyPath)

        expect(result).toBe(true)
        expect(existsSync(canonicalSidecarPath)).toBe(true)
        expect(readFileSync(canonicalSidecarPath, "utf-8")).toBe(readFileSync(legacySidecarPath, "utf-8"))
      })
    })
  })

  describe("#given oh-my-cortex.json exists but oh-my-cortex.json does not", () => {
    describe("#when migrating the config file", () => {
      it("#then copies to oh-my-cortex.json", () => {
        const legacyPath = join(testDir, "oh-my-cortex.json")
        writeFileSync(legacyPath, '{ "agents": {} }')

        const result = migrateLegacyConfigFile(legacyPath)

        expect(result).toBe(true)
        expect(existsSync(join(testDir, "oh-my-cortex.json"))).toBe(true)
      })
    })
  })

  describe("#given oh-my-cortex.jsonc already exists", () => {
    describe("#when attempting migration", () => {
      it("#then returns false and does not overwrite", () => {
        const legacyPath = join(testDir, "oh-my-cortex.jsonc")
        const canonicalPath = join(testDir, "oh-my-cortex.jsonc")
        writeFileSync(legacyPath, '{ "old": true }')
        writeFileSync(canonicalPath, '{ "new": true }')

        const result = migrateLegacyConfigFile(legacyPath)

        expect(result).toBe(false)
        expect(readFileSync(canonicalPath, "utf-8")).toBe('{ "new": true }')
      })
    })
  })

  describe("#given the file does not exist", () => {
    describe("#when attempting migration", () => {
      it("#then returns false", () => {
        const result = migrateLegacyConfigFile(join(testDir, "oh-my-cortex.jsonc"))

        expect(result).toBe(false)
      })
    })
  })

  describe("#given the file is not a legacy config file", () => {
    describe("#when attempting migration", () => {
      it("#then returns false", () => {
        const nonLegacyPath = join(testDir, "something-else.jsonc")
        writeFileSync(nonLegacyPath, "{}")

        const result = migrateLegacyConfigFile(nonLegacyPath)

        expect(result).toBe(false)
      })
    })
  })

  describe("#given canonical write succeeds but archive fails", () => {
    describe("#when migrating the config file", () => {
      it("#then returns true", () => {
        const legacyPath = join(testDir, "oh-my-cortex.jsonc")
        const backupPath = `${legacyPath}.bak`
        const canonicalPath = join(testDir, "oh-my-cortex.jsonc")
        writeFileSync(legacyPath, '{ "agents": {} }')

        // given: create backup path as directory (blocks rename, causing archive to return false)
        mkdirSync(backupPath)

        // when: migrate the config file
        const result = migrateLegacyConfigFile(legacyPath)

        // then: migration should return true (canonical write succeeded, archive is optional)
        expect(result).toBe(true)
        // then: canonical file should exist
        expect(existsSync(canonicalPath)).toBe(true)
      })
    })
  })
})
