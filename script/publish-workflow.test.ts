/// <reference types="bun-types" />

import { describe, expect, test } from "bun:test"
import { existsSync, readFileSync } from "node:fs"

const workflowPaths = [
  new URL("../.github/workflows/ci.yml", import.meta.url),
  new URL("../.github/workflows/publish.yml", import.meta.url),
]

describe("test workflows", () => {
  test("use pure bun test for workflows", () => {
    for (const workflowPath of workflowPaths) {
      // #given
      const workflow = readFileSync(workflowPath, "utf8")

      expect(workflow).toMatch(/run:\s*(\|\s*)?\r?\n?\s*bun (test|run script\/run-ci-tests\.ts)/)
    }
  })

  test("does not restore platform package publishing", () => {
    // #given
    const platformWorkflowPath = new URL("../.github/workflows/publish-platform.yml", import.meta.url)

    // #then
    expect(existsSync(platformWorkflowPath)).toBe(false)
  })
})
