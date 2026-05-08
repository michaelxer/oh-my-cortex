import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

export type FileOperationKind = "read" | "search" | "write" | "edit" | "delete" | "shell" | "other"

export interface FileOperationRecord {
  at: string
  callID: string
  tool: string
  kind: FileOperationKind
  paths: string[]
  summary?: string
}

export interface FileOpsState {
  sessionID: string
  updatedAt: string
  operations: FileOperationRecord[]
}

const MAX_OPERATION_RECORDS = 250

const PATH_KEYS = new Set([
  "file",
  "files",
  "filepath",
  "file_path",
  "filename",
  "path",
  "paths",
  "target",
  "targets",
])

const READ_TOOLS = new Set([
  "read",
  "glob",
  "grep",
  "ast_grep_search",
  "lsp_goto_definition",
  "lsp_find_references",
  "lsp_symbols",
  "lsp_diagnostics",
  "look_at",
])

const WRITE_TOOLS = new Set(["write"])
const EDIT_TOOLS = new Set(["edit", "multiedit", "ast_grep_replace", "lsp_rename"])

function sanitizeSessionID(sessionID: string): string {
  const safe = sessionID.replace(/[^a-zA-Z0-9._-]/g, "_")
  return safe.length > 0 ? safe : "unknown"
}

function normalizeToolName(tool: string): string {
  return tool.trim().toLowerCase()
}

export function getFileOpsDir(projectDirectory: string): string {
  return join(projectDirectory, ".cortex", "file-ops")
}

export function getFileOpsPath(projectDirectory: string, sessionID: string): string {
  return join(getFileOpsDir(projectDirectory), `${sanitizeSessionID(sessionID)}.json`)
}

function readFileOpsState(projectDirectory: string, sessionID: string): FileOpsState {
  const filePath = getFileOpsPath(projectDirectory, sessionID)
  if (!existsSync(filePath)) {
    return {
      sessionID,
      updatedAt: new Date(0).toISOString(),
      operations: [],
    }
  }

  try {
    const parsed = JSON.parse(readFileSync(filePath, "utf8")) as Partial<FileOpsState>
    return {
      sessionID,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date(0).toISOString(),
      operations: Array.isArray(parsed.operations) ? parsed.operations.filter(isFileOperationRecord) : [],
    }
  } catch {
    return {
      sessionID,
      updatedAt: new Date(0).toISOString(),
      operations: [],
    }
  }
}

function isFileOperationRecord(value: unknown): value is FileOperationRecord {
  if (typeof value !== "object" || value === null) return false
  const record = value as Record<string, unknown>
  return (
    typeof record.at === "string" &&
    typeof record.callID === "string" &&
    typeof record.tool === "string" &&
    typeof record.kind === "string" &&
    Array.isArray(record.paths)
  )
}

export function readSessionFileOps(projectDirectory: string, sessionID: string): FileOpsState {
  return readFileOpsState(projectDirectory, sessionID)
}

function extractStringPaths(value: unknown, paths: Set<string>): void {
  if (typeof value === "string") {
    const trimmed = value.trim()
    if (trimmed.length > 0 && trimmed.length < 500) {
      paths.add(trimmed)
    }
    return
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      extractStringPaths(item, paths)
    }
  }
}

export function extractFileOperationPaths(args: Record<string, unknown>): string[] {
  const paths = new Set<string>()

  for (const [key, value] of Object.entries(args)) {
    const normalizedKey = key.toLowerCase().replace(/-/g, "_")
    if (PATH_KEYS.has(normalizedKey)) {
      extractStringPaths(value, paths)
    }
  }

  return [...paths].sort()
}

function summarizeShellCommand(command: string): string {
  const normalized = command.replace(/\s+/g, " ").trim()
  return normalized.length > 220 ? `${normalized.slice(0, 217)}...` : normalized
}

export function classifyFileOperation(tool: string, args: Record<string, unknown>): FileOperationKind {
  const normalizedTool = normalizeToolName(tool)
  if (READ_TOOLS.has(normalizedTool)) {
    return normalizedTool === "grep" || normalizedTool === "glob" || normalizedTool === "ast_grep_search"
      ? "search"
      : "read"
  }
  if (WRITE_TOOLS.has(normalizedTool)) return "write"
  if (EDIT_TOOLS.has(normalizedTool)) return "edit"

  if (normalizedTool === "bash") {
    const command = typeof args.command === "string" ? args.command.toLowerCase() : ""
    if (/\b(rm|remove-item|del|erase)\b/.test(command)) return "delete"
    if (/\b(cat|type|get-content|sed|awk|head|tail|nl|ls|dir|rg|grep|findstr)\b/.test(command)) {
      return "shell"
    }
    if (/[>]{1,2}|\b(set-content|add-content|out-file|copy-item|move-item)\b/.test(command)) {
      return "shell"
    }
  }

  return "other"
}

export function appendFileOperation(
  projectDirectory: string,
  sessionID: string,
  operation: Omit<FileOperationRecord, "at"> & { at?: string },
): FileOpsState {
  const now = operation.at ?? new Date().toISOString()
  const state = readFileOpsState(projectDirectory, sessionID)
  const nextState: FileOpsState = {
    sessionID,
    updatedAt: now,
    operations: [
      ...state.operations,
      {
        ...operation,
        at: now,
      },
    ].slice(-MAX_OPERATION_RECORDS),
  }

  mkdirSync(getFileOpsDir(projectDirectory), { recursive: true })
  writeFileSync(getFileOpsPath(projectDirectory, sessionID), `${JSON.stringify(nextState, null, 2)}\n`, "utf8")
  return nextState
}

export function buildFileOperationRecord(input: {
  tool: string
  callID: string
  args: Record<string, unknown>
}): Omit<FileOperationRecord, "at"> | null {
  const kind = classifyFileOperation(input.tool, input.args)
  if (kind === "other") {
    return null
  }

  const command = typeof input.args.command === "string" ? input.args.command : undefined
  return {
    callID: input.callID,
    tool: input.tool,
    kind,
    paths: extractFileOperationPaths(input.args),
    summary: command ? summarizeShellCommand(command) : undefined,
  }
}
