import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"

const DEFAULT_MAX_LEDGER_CHARS = 12000
const LEDGER_FILE_PATTERN = /^CONTINUITY_.+\.md$/i

export interface CortexLedgerEntry {
  path: string
  name: string
  mtimeMs: number
}

export interface CortexLedgerReadOptions {
  maxChars?: number
}

export function getCortexLedgerDir(projectDirectory: string): string {
  return join(projectDirectory, ".cortex", "ledgers")
}

export function listCortexLedgers(projectDirectory: string): CortexLedgerEntry[] {
  const ledgerDir = getCortexLedgerDir(projectDirectory)
  if (!existsSync(ledgerDir)) {
    return []
  }

  return readdirSync(ledgerDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && LEDGER_FILE_PATTERN.test(entry.name))
    .map((entry) => {
      const filePath = join(ledgerDir, entry.name)
      const stats = statSync(filePath)
      return {
        path: filePath,
        name: entry.name,
        mtimeMs: stats.mtimeMs,
      }
    })
    .sort((left, right) => right.mtimeMs - left.mtimeMs)
}

export function readLatestCortexLedger(
  projectDirectory: string,
  options: CortexLedgerReadOptions = {},
): { entry: CortexLedgerEntry; content: string } | null {
  const latest = listCortexLedgers(projectDirectory)[0]
  if (!latest) {
    return null
  }

  const maxChars = options.maxChars ?? DEFAULT_MAX_LEDGER_CHARS
  const raw = readFileSync(latest.path, "utf8").trim()
  const content = raw.length > maxChars
    ? raw.slice(raw.length - maxChars).trimStart()
    : raw

  return {
    entry: latest,
    content,
  }
}

export function buildCortexLedgerContext(projectDirectory: string): string | null {
  const latest = readLatestCortexLedger(projectDirectory)
  if (!latest || latest.content.length === 0) {
    return null
  }

  return `<cortex_ledger source="${latest.entry.name}">
Latest OMX continuity ledger from .cortex/ledgers.
Use it as resume context, but prefer the live user request and current repo state when they disagree.

${latest.content}
</cortex_ledger>`
}
