import type { DomainType } from "./types"
import { DOMAIN_CAUTION_PROMPTS } from "./constants"
import { detectDomain, parseLensCommand } from "./detector"
import { log } from "../../shared"
import { isSystemDirective } from "../../shared/system-directive"
import { subagentSessions } from "../../features/claude-code-session-state"

const sessionLensState = new Map<string, DomainType | null>()

export function createDomainLensHook() {
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

      const commandDomain = parseLensCommand(promptText)
      if (commandDomain !== null) {
        sessionLensState.set(input.sessionID, commandDomain)
        log(`[domain-lens] Manual override set to ${commandDomain}`, { sessionID: input.sessionID })
        return
      }

      const manualOverride = sessionLensState.get(input.sessionID)
      const activeDomain = manualOverride ?? detectDomain(promptText)

      if (!activeDomain) {
        return
      }

      const cautionPrompt = DOMAIN_CAUTION_PROMPTS[activeDomain]

      const textPartIndex = output.parts.findIndex((p) => p.type === "text" && p.text !== undefined)
      if (textPartIndex === -1) {
        return
      }

      const originalText = output.parts[textPartIndex].text ?? ""
      output.parts[textPartIndex].text = `${cautionPrompt}\n\n---\n\n${originalText}`

      log(`[domain-lens] Injected ${activeDomain} lens`, {
        sessionID: input.sessionID,
        domain: activeDomain,
        source: manualOverride ? "manual" : "auto-detected",
      })
    },
  }
}
