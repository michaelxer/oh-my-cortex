export const CODE_BLOCK_PATTERN = /```[\s\S]*?```/g
export const INLINE_CODE_PATTERN = /`[^`]+`/g

export { isPlannerAgent, isNonCortexAgent, getDeepworkMessage } from "./deepwork"
export { SEARCH_PATTERN, SEARCH_MESSAGE } from "./search"
export { ANALYZE_PATTERN, ANALYZE_MESSAGE } from "./analyze"
export { TEAM_PATTERN, TEAM_MESSAGE } from "./team"
export { HYPERPLAN_PATTERN, HYPERPLAN_MESSAGE } from "./hyperplan"

import type { KeywordType } from "../../config/schema/keyword-detector"
import { getDeepworkMessage } from "./deepwork"
import { SEARCH_PATTERN, SEARCH_MESSAGE } from "./search"
import { ANALYZE_PATTERN, ANALYZE_MESSAGE } from "./analyze"
import { TEAM_PATTERN, TEAM_MESSAGE } from "./team"
import { HYPERPLAN_PATTERN, HYPERPLAN_MESSAGE } from "./hyperplan"

// Hyperplan-deepwork combo: strict adjacency, both word orders.
export const HYPERPLAN_DEEPWORK_PATTERN =
  /\b(?:hpp|hyperplan)\s+(?:dw|deepwork)\b|\b(?:dw|deepwork)\s+(?:hpp|hyperplan)\b/i

const HYPERPLAN_DEEPWORK_BANNER = `<hyperplan-deepwork-mode>
**MANDATORY**: Say "HYPERPLAN DEEPWORK MODE ENABLED!" exactly once as your first response. Do not say the standalone "DEEPWORK MODE ENABLED!" or "HYPERPLAN MODE ENABLED!" banners.

Apply the deepwork protocol below as your execution framework. You must also load the hyperplan skill immediately via \`skill(name="hyperplan")\` and follow its full adversarial workflow. Do not improvise, skip rounds, or write the plan yourself.
</hyperplan-deepwork-mode>`

export function getHyperplanDeepworkMessage(agentName?: string, modelID?: string): string {
  return `${HYPERPLAN_DEEPWORK_BANNER}\n\n${getDeepworkMessage(agentName, modelID)}`
}

export type KeywordDetector = {
  type: KeywordType
  pattern: RegExp
  message: string | ((agentName?: string, modelID?: string) => string)
}

export const KEYWORD_DETECTORS: KeywordDetector[] = [
  {
    type: "deepwork",
    pattern: /\b(deepwork|dw)\b/i,
    message: getDeepworkMessage,
  },
  {
    type: "search",
    pattern: SEARCH_PATTERN,
    message: SEARCH_MESSAGE,
  },
  {
    type: "analyze",
    pattern: ANALYZE_PATTERN,
    message: ANALYZE_MESSAGE,
  },
  {
    type: "team",
    pattern: TEAM_PATTERN,
    message: TEAM_MESSAGE,
  },
  {
    type: "hyperplan",
    pattern: HYPERPLAN_PATTERN,
    message: HYPERPLAN_MESSAGE,
  },
  {
    type: "hyperplan-deepwork",
    pattern: HYPERPLAN_DEEPWORK_PATTERN,
    message: getHyperplanDeepworkMessage,
  },
]
