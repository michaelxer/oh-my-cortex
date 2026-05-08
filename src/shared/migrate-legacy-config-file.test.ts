import { afterEach, beforeEach, describe, expect, it } from "bun:test"
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

  describe("#given the current canonical config exists", () => {
    describe("#when migrating the config file", () => {
      it("#then returns false and leaves the file untouched", () => {
        const canonicalPath = join(testDir, "oh-my-cortex.jsonc")
        writeFileSync(canonicalPath, '{ "agents": {} }')

        const result = migrateLegacyConfigFile(canonicalPath)

        expect(result).toBe(false)
        expect(existsSync(canonicalPath)).toBe(true)
        expect(readFileSync(canonicalPath, "utf-8")).toBe('{ "agents": {} }')
      })
    })
  })

  describe("#given the current canonical json config exists", () => {
    describe("#when migrating the config file", () => {
      it("#then returns false and leaves the file untouched", () => {
        const canonicalPath = join(testDir, "oh-my-cortex.json")
        writeFileSync(canonicalPath, '{ "agents": {} }')

        const result = migrateLegacyConfigFile(canonicalPath)

        expect(result).toBe(false)
        expect(existsSync(canonicalPath)).toBe(true)
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

})
