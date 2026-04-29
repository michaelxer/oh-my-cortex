import { buildLeadPrompt } from "./shared-prompt"
import {
  GPT_LEAD_INTRO,
  GPT_LEAD_WORKFLOW,
  GPT_LEAD_PARALLEL_EXECUTION,
  GPT_LEAD_VERIFICATION_RULES,
  GPT_LEAD_BOUNDARIES,
  GPT_LEAD_CRITICAL_RULES,
} from "./gpt-prompt-sections"

export const LEAD_GPT_SYSTEM_PROMPT = buildLeadPrompt({
  intro: GPT_LEAD_INTRO,
  workflow: GPT_LEAD_WORKFLOW,
  parallelExecution: GPT_LEAD_PARALLEL_EXECUTION,
  verificationRules: GPT_LEAD_VERIFICATION_RULES,
  boundaries: GPT_LEAD_BOUNDARIES,
  criticalRules: GPT_LEAD_CRITICAL_RULES,
})

export function getGptLeadPrompt(): string {
  return LEAD_GPT_SYSTEM_PROMPT
}
