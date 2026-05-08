/// <reference types="bun-types" />

import { afterEach, describe, expect, test } from "bun:test"
import { mkdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import {
  buildCortexLedgerContext,
  createCortexLedgerLoaderHook,
  getCortexLedgerDir,
  listCortexLedgers,
  readLatestCortexLedger,
} from "."

const tempDirs: string[] = []

function createProject(): string {
  const project = join(tmpdir(), `omx-ledger-${Date.now()}-${Math.random().toString(16).slice(2)}`)
  mkdirSync(project, { recursive: true })
  tempDirs.push(project)
  return project
}

function writeLedger(project: string, name: string, content: string): string {
  const ledgerDir = getCortexLedgerDir(project)
  mkdirSync(ledgerDir, { recursive: true })
  const filePath = join(ledgerDir, name)
  writeFileSync(filePath, content, "utf8")
  return filePath
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe("cortex ledger storage", () => {
  test("finds continuity ledgers in newest-first order", () => {
    const project = createProject()
    writeLedger(project, "CONTINUITY_old.md", "old")
    const latest = writeLedger(project, "CONTINUITY_new.md", "new")
    writeFileSync(join(getCortexLedgerDir(project), "notes.md"), "ignore", "utf8")

    const ledgers = listCortexLedgers(project)

    expect(ledgers).toHaveLength(2)
    expect(ledgers[0]?.path).toBe(latest)
    expect(ledgers[0]?.name).toBe("CONTINUITY_new.md")
  })

  test("builds bounded context from the latest ledger", () => {
    const project = createProject()
    writeLedger(project, "CONTINUITY_session.md", "Important resume note")

    const latest = readLatestCortexLedger(project, { maxChars: 8 })
    const context = buildCortexLedgerContext(project)

    expect(latest?.content).toBe("ume note")
    expect(context).toContain("<cortex_ledger source=\"CONTINUITY_session.md\">")
    expect(context).toContain("Important resume note")
  })
})

describe("cortex ledger loader", () => {
  test("injects latest ledger into the last user message", async () => {
    const project = createProject()
    writeLedger(project, "CONTINUITY_session.md", "Resume from ledger")
    const hook = createCortexLedgerLoaderHook(project)
    const output = {
      messages: [
        {
          info: { id: "m1", role: "user", sessionID: "s1" } as never,
          parts: [{ type: "text", text: "continue" } as never],
        },
      ],
    }

    await hook["experimental.chat.messages.transform"]?.({ sessionID: "s1" }, output)

    expect(output.messages[0]?.parts).toHaveLength(2)
    expect((output.messages[0]?.parts[0] as { text?: string }).text).toContain("Resume from ledger")
    expect((output.messages[0]?.parts[0] as { synthetic?: boolean }).synthetic).toBe(true)
  })

  test("does nothing when no ledger exists", async () => {
    const project = createProject()
    const hook = createCortexLedgerLoaderHook(project)
    const output = {
      messages: [
        {
          info: { id: "m1", role: "user", sessionID: "s1" } as never,
          parts: [{ type: "text", text: "continue" } as never],
        },
      ],
    }

    await hook["experimental.chat.messages.transform"]?.({ sessionID: "s1" }, output)

    expect(output.messages[0]?.parts).toHaveLength(1)
  })
})
