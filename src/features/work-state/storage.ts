/**
 * WorkState State Storage
 *
 * Handles reading/writing workstate.json for active plan tracking.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs"
import { dirname, join, basename } from "node:path"
import type { WorkStateState, PlanProgress, TaskSessionState } from "./types"
import { WORKSTATE_DIR, WORKSTATE_FILE, PLANNER_PLANS_DIR } from "./constants"

const RESERVED_KEYS = new Set(["__proto__", "prototype", "constructor"])

export function getWorkStateFilePath(directory: string): string {
  return join(directory, WORKSTATE_DIR, WORKSTATE_FILE)
}

export function readWorkStateState(directory: string): WorkStateState | null {
  const filePath = getWorkStateFilePath(directory)

  if (!existsSync(filePath)) {
    return null
  }

  try {
    const content = readFileSync(filePath, "utf-8")
    const parsed = JSON.parse(content)
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null
    }
    if (!Array.isArray(parsed.session_ids)) {
      parsed.session_ids = []
    }
    if (!parsed.session_origins || typeof parsed.session_origins !== "object" || Array.isArray(parsed.session_origins)) {
      parsed.session_origins = {}
    }
    if (parsed.session_ids.length === 1) {
      const soleSessionId = parsed.session_ids[0]
      if (
        typeof soleSessionId === "string"
        && parsed.session_origins[soleSessionId] !== "appended"
        && parsed.session_origins[soleSessionId] !== "direct"
      ) {
        parsed.session_origins[soleSessionId] = "direct"
      }
    }
    if (!parsed.task_sessions || typeof parsed.task_sessions !== "object" || Array.isArray(parsed.task_sessions)) {
      parsed.task_sessions = {}
    }
    return parsed as WorkStateState
  } catch {
    return null
  }
}

export function writeWorkStateState(directory: string, state: WorkStateState): boolean {
  const filePath = getWorkStateFilePath(directory)

  try {
    const dir = dirname(filePath)
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }

    writeFileSync(filePath, JSON.stringify(state, null, 2), "utf-8")
    return true
  } catch {
    return false
  }
}

export function appendSessionId(
  directory: string,
  sessionId: string,
  origin: "direct" | "appended" = "direct",
): WorkStateState | null {
  const state = readWorkStateState(directory)
  if (!state) return null

  if (!state.session_origins || typeof state.session_origins !== "object" || Array.isArray(state.session_origins)) {
    state.session_origins = {}
  }

  if (!state.session_ids?.includes(sessionId)) {
    if (!Array.isArray(state.session_ids)) {
      state.session_ids = []
    }
    const originalSessionIds = [...state.session_ids]
    const originalSessionOrigins = { ...state.session_origins }
    state.session_ids.push(sessionId)
    state.session_origins[sessionId] = origin
    if (writeWorkStateState(directory, state)) {
      return state
    }
    state.session_ids = originalSessionIds
    state.session_origins = originalSessionOrigins
    return null
  }

  if (!state.session_origins[sessionId]) {
    state.session_origins[sessionId] = origin
    if (!writeWorkStateState(directory, state)) {
      return null
    }
  }

  return state
}

export function clearWorkStateState(directory: string): boolean {
  const filePath = getWorkStateFilePath(directory)

  try {
    if (existsSync(filePath)) {
      const { unlinkSync } = require("node:fs")
      unlinkSync(filePath)
    }
    return true
  } catch {
    return false
  }
}

export function getTaskSessionState(directory: string, taskKey: string): TaskSessionState | null {
  const state = readWorkStateState(directory)
  if (!state?.task_sessions) {
    return null
  }

  return state.task_sessions[taskKey] ?? null
}

export function upsertTaskSessionState(
  directory: string,
  input: {
    taskKey: string
    taskLabel: string
    taskTitle: string
    sessionId: string
    agent?: string
    category?: string
  },
): WorkStateState | null {
  const state = readWorkStateState(directory)
  if (!state) {
    return null
  }

  if (RESERVED_KEYS.has(input.taskKey)) {
    return null
  }

  const taskSessions = state.task_sessions ?? {}
  taskSessions[input.taskKey] = {
    task_key: input.taskKey,
    task_label: input.taskLabel,
    task_title: input.taskTitle,
    session_id: input.sessionId,
    ...(input.agent !== undefined ? { agent: input.agent } : {}),
    ...(input.category !== undefined ? { category: input.category } : {}),
    updated_at: new Date().toISOString(),
  }

  state.task_sessions = taskSessions
  if (writeWorkStateState(directory, state)) {
    return state
  }

  return null
}

/**
 * Find Planner plan files for this project.
 * Planner stores plans at: {project}/.cortex/plans/{name}.md
 */
export function findPlannerPlans(directory: string): string[] {
  const plansDir = join(directory, PLANNER_PLANS_DIR)

  if (!existsSync(plansDir)) {
    return []
  }

  try {
    const files = readdirSync(plansDir)
    return files
      .filter((f) => f.endsWith(".md"))
      .map((f) => join(plansDir, f))
      .sort((a, b) => {
        // Sort by modification time, newest first
        const aStat = require("node:fs").statSync(a)
        const bStat = require("node:fs").statSync(b)
        return bStat.mtimeMs - aStat.mtimeMs
      })
  } catch {
    return []
  }
}

const TODO_HEADING_PATTERN = /^##\s+TODOs\b/i
const FINAL_VERIFICATION_HEADING_PATTERN = /^##\s+Final Verification Wave\b/i
const SECOND_LEVEL_HEADING_PATTERN = /^##\s+/
const UNCHECKED_CHECKBOX_PATTERN = /^(\s*)[-*]\s*\[\s*\]\s*(.+)$/
const CHECKED_CHECKBOX_PATTERN = /^(\s*)[-*]\s*\[[xX]\]\s*(.+)$/
const TODO_TASK_PATTERN = /^\d+\.\s+/
const FINAL_WAVE_TASK_PATTERN = /^F\d+\.\s+/i

type ProgressSection = "todo" | "final-wave" | "other"

/**
 * Parse a plan file and count checkbox progress.
 *
 * Only top-level (zero-indent) checkboxes under `## TODOs` and
 * `## Final Verification Wave` sections are counted. The checkbox
 * body must carry a valid task label (`N.` for TODOs, `FN.` for
 * Final Verification Wave). Nested acceptance-criteria checkboxes
 * and checkboxes in other sections are intentionally ignored so
 * that progress tracking stays aligned with `readCurrentTopLevelTask`.
 */
export function getPlanProgress(planPath: string): PlanProgress {
  if (!existsSync(planPath)) {
    return { total: 0, completed: 0, isComplete: true }
  }

  try {
    const content = readFileSync(planPath, "utf-8")
    const lines = content.split(/\r?\n/)

    // Check if the plan has structured sections (## TODOs / ## Final Verification Wave)
    const hasStructuredSections = lines.some(
      (line) => TODO_HEADING_PATTERN.test(line) || FINAL_VERIFICATION_HEADING_PATTERN.test(line),
    )

    if (hasStructuredSections) {
      // Structured plan: only count top-level checkboxes with numbered labels
      // under ## TODOs and ## Final Verification Wave sections
      return getStructuredPlanProgress(lines)
    }

    // Simple plan: count all top-level checkboxes anywhere
    return getSimplePlanProgress(content)
  } catch {
    return { total: 0, completed: 0, isComplete: true }
  }
}

function getStructuredPlanProgress(lines: string[]): PlanProgress {
  let section: ProgressSection = "other"
  let total = 0
  let completed = 0

  for (const line of lines) {
    if (SECOND_LEVEL_HEADING_PATTERN.test(line)) {
      section = TODO_HEADING_PATTERN.test(line)
        ? "todo"
        : FINAL_VERIFICATION_HEADING_PATTERN.test(line)
          ? "final-wave"
          : "other"
      continue
    }

    if (section !== "todo" && section !== "final-wave") {
      continue
    }

    const checkedMatch = line.match(CHECKED_CHECKBOX_PATTERN)
    const uncheckedMatch = checkedMatch ? null : line.match(UNCHECKED_CHECKBOX_PATTERN)
    const match = checkedMatch ?? uncheckedMatch
    if (!match) {
      continue
    }

    if (match[1].length > 0) {
      continue
    }

    const taskBody = match[2].trim()
    const labelPattern = section === "todo" ? TODO_TASK_PATTERN : FINAL_WAVE_TASK_PATTERN
    if (!labelPattern.test(taskBody)) {
      continue
    }

    total++
    if (checkedMatch) {
      completed++
    }
  }

  return {
    total,
    completed,
    isComplete: total > 0 && completed === total,
  }
}

function getSimplePlanProgress(content: string): PlanProgress {
  const uncheckedMatches = content.match(/^[-*]\s*\[\s*\]/gm) || []
  const checkedMatches = content.match(/^[-*]\s*\[[xX]\]/gm) || []

  const total = uncheckedMatches.length + checkedMatches.length
  const completed = checkedMatches.length

  return {
    total,
    completed,
    isComplete: total > 0 && completed === total,
  }
}

/**
 * Extract plan name from file path.
 */
export function getPlanName(planPath: string): string {
  return basename(planPath, ".md")
}

/**
 * Create a new workstate state for a plan.
 */
export function createWorkStateState(
  planPath: string,
  sessionId: string,
  agent?: string,
  worktreePath?: string,
): WorkStateState {
  return {
    active_plan: planPath,
    started_at: new Date().toISOString(),
    session_ids: [sessionId],
    session_origins: {
      [sessionId]: "direct",
    },
    plan_name: getPlanName(planPath),
    ...(agent !== undefined ? { agent } : {}),
    ...(worktreePath !== undefined ? { worktree_path: worktreePath } : {}),
  }
}
