import type { ChallengeLevel } from "./types"
import { DEFAULT_CHALLENGE_LEVEL } from "./constants"
import { parseChallengeCommand } from "./detector"
import { getLevelPrompt } from "./levels"
import { log } from "../../shared"
import { isSystemDirective } from "../../shared/system-directive"
import { subagentSessions } from "../../features/claude-code-session-state"

const sessionChallengeState = new Map<string, ChallengeLevel>()

export function createChallengeEngineHook() {
  return {
    "chat.message": async (
      input: {
        sessionID: string
        agent?: string
        model?: { providerID: string; modelID: string }
      },
      output: {
        message: Record<string, unknown>
        parts: Array<{ type: string; text?: string; [key: string]: unknown }>
      }
    ): Promise<void> => {
      const promptText = output.parts
        ?.filter((part) => part.type === "text" && part.text)
        .map((part) => part.text)
        .join("\n")
        .trim() || ""

      if (isSystemDirective(promptText)) {
        return
      }

      if (subagentSessions.has(input.sessionID)) {
        return
      }

      const commandLevel = parseChallengeCommand(promptText)
      if (commandLevel !== null) {
        sessionChallengeState.set(input.sessionID, commandLevel)
        log(`[challenge-engine] Level set to ${commandLevel}`, { sessionID: input.sessionID })
        return
      }

      const currentLevel = sessionChallengeState.get(input.sessionID) ?? DEFAULT_CHALLENGE_LEVEL
      const levelPrompt = getLevelPrompt(currentLevel)

      const textPartIndex = output.parts.findIndex((p) => p.type === "text" && p.text !== undefined)
      if (textPartIndex === -1) {
        return
      }

      const originalText = output.parts[textPartIndex].text ?? ""
      output.parts[textPartIndex].text = `${levelPrompt}\n\n---\n\n${originalText}`

      log(`[challenge-engine] Injected level ${currentLevel} prompt`, {
        sessionID: input.sessionID,
        level: currentLevel,
      })
    },
  }
}
