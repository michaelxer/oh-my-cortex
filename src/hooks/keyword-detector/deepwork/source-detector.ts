/**
 * Agent/model detection utilities for deepwork message routing.
 *
 * Routing logic:
 * 1. Planner agents (planner, plan) → planner.ts
 * 2. GPT 5.4 models → gpt5.4.ts
 * 3. Gemini models → gemini.ts
 * 4. Everything else (Claude, etc.) → default.ts
 */

import { isGptModel, isGeminiModel } from "../../../agents/types"

/**
 * Checks if agent is a planner-type agent.
 * Planners don't need deepwork injection (they ARE the planner).
 */
export function isPlannerAgent(agentName?: string): boolean {
  if (!agentName) return false
  const lowerName = agentName.toLowerCase()
  if (lowerName.includes("planner") || lowerName.includes("planner")) return true

  const normalized = lowerName.replace(/[_-]+/g, " ")
  return /\bplan\b/.test(normalized)
}

/**
 * Checks if agent is a non-OMX agent (e.g., OpenCode's built-in Builder/Plan).
 * Non-OMX agents should not receive keyword injection (search-mode, analyze-mode, etc.).
 */
export function isNonCortexAgent(agentName?: string): boolean {
  if (!agentName) return false
  const lowerName = agentName.toLowerCase()
  return lowerName.includes("builder") || lowerName === "plan"
}

export { isGptModel, isGeminiModel }

/** Deepwork message source type */
export type DeepworkSource = "planner" | "gpt" | "gemini" | "default"

/**
 * Determines which deepwork message source to use.
 */
export function getDeepworkSource(
  agentName?: string,
  modelID?: string
): DeepworkSource {
  // Priority 1: Planner agents
  if (isPlannerAgent(agentName)) {
    return "planner"
  }

  // Priority 2: GPT models
  if (modelID && isGptModel(modelID)) {
    return "gpt"
  }


  // Priority 3: Gemini models
  if (modelID && isGeminiModel(modelID)) {
    return "gemini"
  }
  // Default: Claude and other models
  return "default"
}
