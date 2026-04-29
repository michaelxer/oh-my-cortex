import { buildLeadPrompt } from "./shared-prompt"
import {
  GEMINI_LEAD_INTRO,
  GEMINI_LEAD_WORKFLOW,
  GEMINI_LEAD_PARALLEL_EXECUTION,
  GEMINI_LEAD_VERIFICATION_RULES,
  GEMINI_LEAD_BOUNDARIES,
  GEMINI_LEAD_CRITICAL_RULES,
} from "./gemini-prompt-sections"

export const LEAD_GEMINI_SYSTEM_PROMPT = buildLeadPrompt({
  intro: GEMINI_LEAD_INTRO,
  workflow: GEMINI_LEAD_WORKFLOW,
  parallelExecution: GEMINI_LEAD_PARALLEL_EXECUTION,
  verificationRules: GEMINI_LEAD_VERIFICATION_RULES,
  boundaries: GEMINI_LEAD_BOUNDARIES,
  criticalRules: GEMINI_LEAD_CRITICAL_RULES,
})

export function getGeminiLeadPrompt(): string {
  return LEAD_GEMINI_SYSTEM_PROMPT
}
