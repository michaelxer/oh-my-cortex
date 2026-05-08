import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"

const MAX_MINDMODEL_CHARS = 10000
const MINDMODEL_FILE_PATTERN = /\.(md|txt)$/i

export function getMindmodelDir(projectDirectory: string): string {
  return join(projectDirectory, ".cortex", "mindmodel")
}

function listMindmodelFiles(projectDirectory: string): string[] {
  const dir = getMindmodelDir(projectDirectory)
  if (!existsSync(dir)) {
    return []
  }

  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && MINDMODEL_FILE_PATTERN.test(entry.name))
    .map((entry) => join(dir, entry.name))
    .sort((left, right) => statSync(right).mtimeMs - statSync(left).mtimeMs)
}

export function buildMindmodelContext(projectDirectory: string): string | null {
  const files = listMindmodelFiles(projectDirectory)
  if (files.length === 0) {
    return null
  }

  const chunks = files.map((filePath) => {
    const content = readFileSync(filePath, "utf8").trim()
    return `## ${filePath}\n${content}`
  })
  const merged = chunks.join("\n\n---\n\n").trim()
  const bounded = merged.length > MAX_MINDMODEL_CHARS
    ? merged.slice(0, MAX_MINDMODEL_CHARS).trimEnd()
    : merged

  if (bounded.length === 0) {
    return null
  }

  return `<cortex_mindmodel>
Project-specific OMX mindmodel constraints from .cortex/mindmodel.
Use these as local patterns and preferences. Current user instructions and current repo state win when they conflict.

${bounded}
</cortex_mindmodel>`
}
