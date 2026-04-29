import { buildLeadPrompt } from "./shared-prompt"
import {
  DEFAULT_LEAD_INTRO,
  DEFAULT_LEAD_WORKFLOW,
  DEFAULT_LEAD_PARALLEL_EXECUTION,
  DEFAULT_LEAD_VERIFICATION_RULES,
  DEFAULT_LEAD_BOUNDARIES,
  DEFAULT_LEAD_CRITICAL_RULES,
} from "./default-prompt-sections"

export const LEAD_SYSTEM_PROMPT = buildLeadPrompt({
  intro: DEFAULT_LEAD_INTRO,
  workflow: DEFAULT_LEAD_WORKFLOW,
  parallelExecution: DEFAULT_LEAD_PARALLEL_EXECUTION,
  verificationRules: DEFAULT_LEAD_VERIFICATION_RULES,
  boundaries: DEFAULT_LEAD_BOUNDARIES,
  criticalRules: DEFAULT_LEAD_CRITICAL_RULES,
})

export function getDefaultLeadPrompt(): string {
  return LEAD_SYSTEM_PROMPT
}
