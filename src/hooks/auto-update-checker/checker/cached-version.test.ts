import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

// Hold mutable mock state so beforeEach can swap the cache root for each test.
const mockState: { candidates: string[]; walkUpResult: string | null } = {
  candidates: [],
  walkUpResult: null,
}

mock.module("../constants", () => ({
  INSTALLED_PACKAGE_JSON_CANDIDATES: new Proxy([], {
    get(_, prop) {
      const current = mockState.candidates
      // Forward array methods/properties to the mutable candidates list
      // so getCachedVersion's `for (... of ...)` sees fresh data per test.
      const value = (current as unknown as Record<PropertyKey, unknown>)[prop]
      if (typeof value === "function") {
        return (value as (...args: unknown[]) => unknown).bind(current)
      }
      return value
    },
  }),
}))

mock.module("./package-json-locator", () => ({
  findPackageJsonUp: () => mockState.walkUpResult,
}))

import { getCachedVersion } from "./cached-version"

describe("getCachedVersion (GH-3257)", () => {
  let cacheRoot: string

  beforeEach(() => {
    cacheRoot = mkdtempSync(join(tmpdir(), "omx-cached-version-"))
    mockState.candidates = [
      join(cacheRoot, "node_modules", "oh-my-cortex", "package.json"),
    ]
    mockState.walkUpResult = null
  })

  afterEach(() => {
    rmSync(cacheRoot, { recursive: true, force: true })
    mockState.candidates = []
    mockState.walkUpResult = null
  })

  it("returns the version when the package is installed under oh-my-cortex", () => {
    const pkgDir = join(cacheRoot, "node_modules", "oh-my-cortex")
    mkdirSync(pkgDir, { recursive: true })
    writeFileSync(join(pkgDir, "package.json"), JSON.stringify({ name: "oh-my-cortex", version: "3.16.0" }))

    expect(getCachedVersion()).toBe("3.16.0")
  })

  it("returns null when neither candidate exists and fallbacks find nothing", () => {
    expect(getCachedVersion()).toBeNull()
  })

  it("prefers the loaded module's package.json over flat-install candidates", () => {
    // OpenCode loads plugins from a per-plugin sandbox at
    // <CACHE_DIR>/<plugin-entry>/node_modules/<pkg>/, while a parallel flat
    // install at <CACHE_DIR>/node_modules/<pkg>/ can drift independently when
    // bun re-resolves "latest". The flat install must NOT take precedence,
    // because that's the path the user is actually running.
    const sandboxDir = join(cacheRoot, "oh-my-cortex@latest", "node_modules", "oh-my-cortex")
    mkdirSync(sandboxDir, { recursive: true })
    const sandboxPkgJson = join(sandboxDir, "package.json")
    writeFileSync(sandboxPkgJson, JSON.stringify({ name: "oh-my-cortex", version: "3.17.5" }))
    mockState.walkUpResult = sandboxPkgJson

    const flatDir = join(cacheRoot, "node_modules", "oh-my-cortex")
    mkdirSync(flatDir, { recursive: true })
    writeFileSync(join(flatDir, "package.json"), JSON.stringify({ name: "oh-my-cortex", version: "3.17.6" }))

    expect(getCachedVersion()).toBe("3.17.5")
  })
})
