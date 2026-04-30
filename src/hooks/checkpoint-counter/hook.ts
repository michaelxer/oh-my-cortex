import { CHECKPOINT_THRESHOLD, CHECKPOINT_COMMAND_MARKER, CHECKPOINT_PROMPT } from "./constants"
import { log } from "../../shared"
import { isSystemDirective } from "../../shared/system-directive"
import { subagentSessions } from "../../features/claude-code-session-state"

const sessionCounters = new Map<string, number>()

export function createCheckpointCounterHook() {
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

      const isForceCheckpoint = promptText.includes(CHECKPOINT_COMMAND_MARKER)

      if (isForceCheckpoint) {
        const textPartIndex = output.parts.findIndex((p) => p.type === "text" && p.text !== undefined)
        if (textPartIndex !== -1) {
          const originalText = output.parts[textPartIndex].text ?? ""
          output.parts[textPartIndex].text = `${CHECKPOINT_PROMPT}\n\n---\n\n${originalText}`
        }
        sessionCounters.set(input.sessionID, 0)
        log(`[checkpoint-counter] Forced checkpoint`, { sessionID: input.sessionID })
        return
      }

      const currentCount = (sessionCounters.get(input.sessionID) ?? 0) + 1
      sessionCounters.set(input.sessionID, currentCount)

      if (currentCount >= CHECKPOINT_THRESHOLD) {
        const textPartIndex = output.parts.findIndex((p) => p.type === "text" && p.text !== undefined)
        if (textPartIndex !== -1) {
          const originalText = output.parts[textPartIndex].text ?? ""
          output.parts[textPartIndex].text = `${CHECKPOINT_PROMPT}\n\n---\n\n${originalText}`
        }
        sessionCounters.set(input.sessionID, 0)
        log(`[checkpoint-counter] Threshold reached, injected checkpoint`, {
          sessionID: input.sessionID,
          count: currentCount,
        })
      }
    },
  }
}
