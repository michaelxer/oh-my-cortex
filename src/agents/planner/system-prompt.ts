import { PLANNER_IDENTITY_CONSTRAINTS } from "./identity-constraints"
import { PLANNER_INTERVIEW_MODE } from "./interview-mode"
import { PLANNER_PLAN_GENERATION } from "./plan-generation"
import { PLANNER_HIGH_ACCURACY_MODE } from "./high-accuracy-mode"
import { PLANNER_PLAN_TEMPLATE } from "./plan-template"
import { PLANNER_BEHAVIORAL_SUMMARY } from "./behavioral-summary"
import { getGptPlannerPrompt } from "./gpt"
import { getGeminiPlannerPrompt } from "./gemini"
import { isGptModel, isGeminiModel } from "../types"

/**
 * Combined Planner system prompt (Claude-optimized, default).
 * Assembled from modular sections for maintainability.
 */
export const PLANNER_SYSTEM_PROMPT = `${PLANNER_IDENTITY_CONSTRAINTS}
${PLANNER_INTERVIEW_MODE}
${PLANNER_PLAN_GENERATION}
${PLANNER_HIGH_ACCURACY_MODE}
${PLANNER_PLAN_TEMPLATE}
${PLANNER_BEHAVIORAL_SUMMARY}`

/**
 * Planner planner permission configuration.
 * Allows write/edit for plan files (.md only, enforced by planner-md-only hook).
 * Question permission allows agent to ask user questions via OpenCode's QuestionTool.
 */
export const PLANNER_PERMISSION = {
  edit: "allow" as const,
  bash: "allow" as const,
  webfetch: "allow" as const,
  question: "allow" as const,
}

export type PlannerPromptSource = "default" | "gpt" | "gemini"

/**
 * Determines which Planner prompt to use based on model.
 */
export function getPlannerPromptSource(model?: string): PlannerPromptSource {
  if (model && isGptModel(model)) {
    return "gpt"
  }
  if (model && isGeminiModel(model)) {
    return "gemini"
  }
  return "default"
}

/**
 * Gets the appropriate Planner prompt based on model.
 * GPT models → GPT-5.4 optimized prompt (XML-tagged, principle-driven)
 * Gemini models → Gemini-optimized prompt (aggressive tool-call enforcement, thinking checkpoints)
 * Default (Claude, etc.) → Claude-optimized prompt (modular sections)
 */
export function getPlannerPrompt(model?: string, disabledTools?: readonly string[]): string {
  const source = getPlannerPromptSource(model)
  const isQuestionDisabled = disabledTools?.includes("question") ?? false

  let prompt: string
  switch (source) {
    case "gpt":
      prompt = getGptPlannerPrompt()
      break
    case "gemini":
      prompt = getGeminiPlannerPrompt()
      break
    case "default":
    default:
      prompt = PLANNER_SYSTEM_PROMPT
  }

  if (isQuestionDisabled) {
    prompt = stripQuestionToolReferences(prompt)
  }

  return prompt
}

/**
 * Removes Question tool usage examples from prompt text when question tool is disabled.
 */
function stripQuestionToolReferences(prompt: string): string {
  // Remove Question({...}) code blocks (multi-line)
  return prompt.replace(/```typescript\n\s*Question\(\{[\s\S]*?\}\)\s*\n```/g, "")
}
