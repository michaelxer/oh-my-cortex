/// <reference types="bun-types" />

import { afterEach, describe, expect, test } from "bun:test"
import { mkdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import {
  buildMindmodelContext,
  createMindmodelInjectorHook,
  getMindmodelDir,
} from "."

const tempDirs: string[] = []

function createProject(): string {
  const project = join(tmpdir(), `omx-mindmodel-${Date.now()}-${Math.random().toString(16).slice(2)}`)
  mkdirSync(project, { recursive: true })
  tempDirs.push(project)
  return project
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe("mindmodel context", () => {
  test("builds context from .cortex/mindmodel files", () => {
    const project = createProject()
    const dir = getMindmodelDir(project)
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, "testing.md"), "# Testing\nAlways run focused tests first.", "utf8")

    const context = buildMindmodelContext(project)

    expect(context).toContain("<cortex_mindmodel>")
    expect(context).toContain("Always run focused tests first.")
  })

  test("returns null when no mindmodel exists", () => {
    const project = createProject()

    expect(buildMindmodelContext(project)).toBeNull()
  })
})

describe("mindmodel injector", () => {
  test("injects mindmodel context into the last user message", async () => {
    const project = createProject()
    const dir = getMindmodelDir(project)
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, "release.md"), "# Release\nNever add platform packages.", "utf8")
    const hook = createMindmodelInjectorHook(project)
    const output = {
      messages: [
        {
          info: { id: "m1", role: "user", sessionID: "s1" } as never,
          parts: [{ type: "text", text: "ship" } as never],
        },
      ],
    }

    await hook["experimental.chat.messages.transform"]?.({ sessionID: "s1" }, output)

    expect(output.messages[0]?.parts).toHaveLength(2)
    expect((output.messages[0]?.parts[0] as { text?: string }).text).toContain("Never add platform packages")
  })
})
