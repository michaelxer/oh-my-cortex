import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { basename, dirname, join } from "node:path"

export type CortexArtifactType = "ledger" | "plan" | "evidence" | "file_ops" | "handoff"

export interface CortexArtifactSearchOptions {
  types?: CortexArtifactType[]
  limit?: number
}

export interface CortexArtifactSearchResult {
  type: CortexArtifactType
  path: string
  title: string
  score: number
  modifiedAt: string
  snippet: string
}

const DEFAULT_LIMIT = 10
const MAX_FILE_BYTES = 750000
const SEARCH_EXTENSIONS = new Set([".md", ".txt", ".json", ".jsonc"])

type SearchRoot = {
  type: CortexArtifactType
  path: string
}

function normalizeQuery(query: string): string[] {
  return query
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2)
}

function getExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf(".")
  return dotIndex === -1 ? "" : fileName.slice(dotIndex).toLowerCase()
}

function discoverHandoffDir(projectDirectory: string): string | null {
  let current = projectDirectory

  for (let depth = 0; depth < 4; depth += 1) {
    const candidate = join(current, "HANDOFF_DOC")
    if (existsSync(candidate)) {
      return candidate
    }

    const parentCandidate = join(dirname(current), "HANDOFF_DOC")
    if (existsSync(parentCandidate)) {
      return parentCandidate
    }

    const parent = dirname(current)
    if (parent === current) break
    current = parent
  }

  return null
}

function getSearchRoots(projectDirectory: string): SearchRoot[] {
  const roots: SearchRoot[] = [
    { type: "ledger", path: join(projectDirectory, ".cortex", "ledgers") },
    { type: "plan", path: join(projectDirectory, ".cortex", "plans") },
    { type: "evidence", path: join(projectDirectory, ".cortex", "evidence") },
    { type: "file_ops", path: join(projectDirectory, ".cortex", "file-ops") },
  ]

  const handoffDir = discoverHandoffDir(projectDirectory)
  if (handoffDir) {
    roots.push({ type: "handoff", path: handoffDir })
  }

  return roots
}

function walkFiles(root: SearchRoot): Array<SearchRoot & { filePath: string }> {
  if (!existsSync(root.path)) {
    return []
  }

  const results: Array<SearchRoot & { filePath: string }> = []
  const visit = (directory: string): void => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const fullPath = join(directory, entry.name)
      if (entry.isDirectory()) {
        visit(fullPath)
      } else if (entry.isFile() && SEARCH_EXTENSIONS.has(getExtension(entry.name))) {
        results.push({ ...root, filePath: fullPath })
      }
    }
  }

  visit(root.path)
  return results
}

function extractTitle(fileName: string, content: string): string {
  const heading = content.match(/^#\s+(.+)$/m)?.[1]?.trim()
  return heading && heading.length > 0 ? heading : basename(fileName)
}

function buildSnippet(content: string, tokens: string[]): string {
  const normalized = content.toLowerCase()
  const firstMatch = tokens
    .map((token) => normalized.indexOf(token))
    .filter((index) => index >= 0)
    .sort((left, right) => left - right)[0] ?? 0

  const start = Math.max(0, firstMatch - 140)
  const end = Math.min(content.length, firstMatch + 360)
  return content
    .slice(start, end)
    .replace(/\s+/g, " ")
    .trim()
}

function scoreContent(content: string, title: string, tokens: string[]): number {
  if (tokens.length === 0) {
    return 1
  }

  const normalizedContent = content.toLowerCase()
  const normalizedTitle = title.toLowerCase()
  let score = 0

  for (const token of tokens) {
    const contentMatches = normalizedContent.split(token).length - 1
    const titleMatches = normalizedTitle.includes(token) ? 3 : 0
    score += contentMatches + titleMatches
  }

  return score
}

export function searchCortexArtifacts(
  projectDirectory: string,
  query: string,
  options: CortexArtifactSearchOptions = {},
): CortexArtifactSearchResult[] {
  const tokens = normalizeQuery(query)
  const typeFilter = new Set(options.types ?? [])
  const limit = Math.max(1, Math.min(options.limit ?? DEFAULT_LIMIT, 50))
  const roots = getSearchRoots(projectDirectory)
    .filter((root) => typeFilter.size === 0 || typeFilter.has(root.type))

  const results: CortexArtifactSearchResult[] = []

  for (const root of roots) {
    for (const file of walkFiles(root)) {
      const stats = statSync(file.filePath)
      if (stats.size > MAX_FILE_BYTES) {
        continue
      }

      const content = readFileSync(file.filePath, "utf8")
      const title = extractTitle(file.filePath, content)
      const score = scoreContent(content, title, tokens)
      if (score <= 0) {
        continue
      }

      results.push({
        type: file.type,
        path: file.filePath,
        title,
        score,
        modifiedAt: stats.mtime.toISOString(),
        snippet: buildSnippet(content, tokens),
      })
    }
  }

  return results
    .sort((left, right) => right.score - left.score || right.modifiedAt.localeCompare(left.modifiedAt))
    .slice(0, limit)
}
