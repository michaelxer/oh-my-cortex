/**
 * Deepwork message module - routes to appropriate message based on agent/model.
 *
 * Routing:
 * 1. Planner agents (planner, plan) → planner.ts
 * 2. GPT models → gpt.ts
 * 3. Gemini models → gemini.ts
 * 4. Default (Claude, etc.) → default.ts (optimized for Claude series)
 */

export {
  isPlannerAgent,
  isNonCortexAgent,
  isGptModel,
  isGeminiModel,
  getDeepworkSource,
} from "./source-detector";
export type { DeepworkSource } from "./source-detector";
export {
  DEEPWORK_PLANNER_SECTION,
  getPlannerDeepworkMessage,
} from "./planner";
export { DEEPWORK_GPT_MESSAGE, getGptDeepworkMessage } from "./gpt";
export { DEEPWORK_GEMINI_MESSAGE, getGeminiDeepworkMessage } from "./gemini";
export {
  DEEPWORK_DEFAULT_MESSAGE,
  getDefaultDeepworkMessage,
} from "./default";

import { getDeepworkSource } from "./source-detector";
import { getPlannerDeepworkMessage } from "./planner";
import { getGptDeepworkMessage } from "./gpt";
import { getDefaultDeepworkMessage } from "./default";
import { getGeminiDeepworkMessage } from "./gemini";

/**
 * Gets the appropriate deepwork message based on agent and model context.
 */
export function getDeepworkMessage(
  agentName?: string,
  modelID?: string,
): string {
  const source = getDeepworkSource(agentName, modelID);

  switch (source) {
    case "planner":
      return getPlannerDeepworkMessage();
    case "gpt":
      return getGptDeepworkMessage();
    case "gemini":
      return getGeminiDeepworkMessage();
    case "default":
    default:
      return getDefaultDeepworkMessage();
  }
}
