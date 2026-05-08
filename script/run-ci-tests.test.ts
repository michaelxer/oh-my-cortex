/// <reference types="bun-types" />

import { afterEach, describe, expect, test } from "bun:test"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createBunTestCommandBatches, createCiTestPlan } from "./run-ci-tests.ts"

const tempRoots: string[] = []

function createTempRoot(): string {
  const tempRoot = mkdtempSync(join(tmpdir(), "omx-ci-tests-"))
  tempRoots.push(tempRoot)
  return tempRoot
}

afterEach(() => {
  while (tempRoots.length > 0) {
    const tempRoot = tempRoots.pop()
    if (tempRoot) {
      rmSync(tempRoot, { force: true, recursive: true })
    }
  }
})

describe("createBunTestCommandBatches", () => {
  test("splits long shared test commands into multiple batches", () => {
    const batches = createBunTestCommandBatches(
      ["src/alpha.test.ts", "src/beta.test.ts", "src/gamma.test.ts"],
      35,
    )

    expect(batches).toEqual([
      ["bun", "test", "src/alpha.test.ts"],
      ["bun", "test", "src/beta.test.ts"],
      ["bun", "test", "src/gamma.test.ts"],
    ])
  })

  test("keeps short shared test commands in one batch", () => {
    const batches = createBunTestCommandBatches(
      ["src/alpha.test.ts", "src/beta.test.ts"],
      100,
    )

    expect(batches).toEqual([
      ["bun", "test", "src/alpha.test.ts", "src/beta.test.ts"],
    ])
  })
})

describe("createCiTestPlan", () => {
  test("skips missing configured roots", async () => {
    const tempRoot = createTempRoot()
    mkdirSync(join(tempRoot, "src"))
    await Bun.write(join(tempRoot, "src", "alpha.test.ts"), "import { test } from 'bun:test'\n")

    const plan = await createCiTestPlan(tempRoot)

    expect(plan.sharedTestFiles).toEqual(["src/alpha.test.ts"])
    expect(plan.isolatedModuleMockFiles).toEqual([])
    expect(plan.isolatedTestTargets).toEqual([])
  })

  test("isolates tests that use mock.module", async () => {
    const tempRoot = createTempRoot()
    mkdirSync(join(tempRoot, "script"))
    writeFileSync(
      join(tempRoot, "script", "uses-mock.test.ts"),
      "import { mock } from 'bun:test'\nmock.module('thing', () => ({}))\n",
      "utf8",
    )

    const plan = await createCiTestPlan(tempRoot)

    expect(plan.isolatedModuleMockFiles).toEqual(["script/uses-mock.test.ts"])
    expect(plan.isolatedTestTargets).toEqual(["script/uses-mock.test.ts"])
    expect(plan.sharedTestFiles).toEqual([])
  })
})
