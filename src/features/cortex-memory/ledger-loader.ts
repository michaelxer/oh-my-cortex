import type { Message, Part } from "@opencode-ai/sdk"

import { buildCortexLedgerContext } from "./ledger"

type MessageWithParts = {
  info: Message
  parts: Part[]
}

type LedgerLoaderInput = {
  sessionID?: string
  [key: string]: unknown
}

type LedgerLoaderOutput = {
  messages: MessageWithParts[]
}

export type CortexLedgerLoaderHook = {
  "experimental.chat.messages.transform"?: (
    input: LedgerLoaderInput,
    output: LedgerLoaderOutput,
  ) => Promise<void>
}

const LEDGER_MARKER = "<cortex_ledger "

function findLastUserMessageIndex(messages: MessageWithParts[]): number {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index]?.info.role === "user") {
      return index
    }
  }

  return -1
}

function hasInjectedLedger(messages: MessageWithParts[]): boolean {
  return messages.some((message) =>
    message.parts.some((part) =>
      part.type === "text" &&
      typeof (part as { text?: unknown }).text === "string" &&
      (part as { text: string }).text.includes(LEDGER_MARKER),
    ),
  )
}

function getSessionID(input: LedgerLoaderInput, message: MessageWithParts): string {
  if (typeof input.sessionID === "string" && input.sessionID.length > 0) {
    return input.sessionID
  }

  const messageSessionID = (message.info as unknown as { sessionID?: string }).sessionID
  return messageSessionID ?? "unknown"
}

export function createCortexLedgerLoaderHook(projectDirectory: string): CortexLedgerLoaderHook {
  return {
    "experimental.chat.messages.transform": async (input, output): Promise<void> => {
      if (output.messages.length === 0 || hasInjectedLedger(output.messages)) {
        return
      }

      const ledgerContext = buildCortexLedgerContext(projectDirectory)
      if (!ledgerContext) {
        return
      }

      const lastUserMessageIndex = findLastUserMessageIndex(output.messages)
      if (lastUserMessageIndex === -1) {
        return
      }

      const lastUserMessage = output.messages[lastUserMessageIndex]
      if (!lastUserMessage) {
        return
      }

      const sessionID = getSessionID(input, lastUserMessage)
      const syntheticPart = {
        id: `cortex_ledger_${sessionID}`,
        messageID: lastUserMessage.info.id,
        sessionID,
        type: "text" as const,
        text: ledgerContext,
        synthetic: true,
      }

      lastUserMessage.parts.unshift(syntheticPart as Part)
    },
  }
}
