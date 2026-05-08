import type { Message, Part } from "@opencode-ai/sdk"

import { buildMindmodelContext } from "./mindmodel"

type MessageWithParts = {
  info: Message
  parts: Part[]
}

type MindmodelInjectorInput = {
  sessionID?: string
  [key: string]: unknown
}

type MindmodelInjectorOutput = {
  messages: MessageWithParts[]
}

export type MindmodelInjectorHook = {
  "experimental.chat.messages.transform"?: (
    input: MindmodelInjectorInput,
    output: MindmodelInjectorOutput,
  ) => Promise<void>
}

const MINDMODEL_MARKER = "<cortex_mindmodel>"

function findLastUserMessageIndex(messages: MessageWithParts[]): number {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index]?.info.role === "user") {
      return index
    }
  }

  return -1
}

function hasInjectedMindmodel(messages: MessageWithParts[]): boolean {
  return messages.some((message) =>
    message.parts.some((part) =>
      part.type === "text" &&
      typeof (part as { text?: unknown }).text === "string" &&
      (part as { text: string }).text.includes(MINDMODEL_MARKER),
    ),
  )
}

export function createMindmodelInjectorHook(projectDirectory: string): MindmodelInjectorHook {
  return {
    "experimental.chat.messages.transform": async (input, output): Promise<void> => {
      if (output.messages.length === 0 || hasInjectedMindmodel(output.messages)) {
        return
      }

      const context = buildMindmodelContext(projectDirectory)
      if (!context) {
        return
      }

      const userMessageIndex = findLastUserMessageIndex(output.messages)
      if (userMessageIndex === -1) {
        return
      }

      const userMessage = output.messages[userMessageIndex]
      if (!userMessage) {
        return
      }

      const sessionID =
        input.sessionID ??
        (userMessage.info as unknown as { sessionID?: string }).sessionID ??
        "unknown"

      userMessage.parts.unshift({
        id: `cortex_mindmodel_${sessionID}`,
        messageID: userMessage.info.id,
        sessionID,
        type: "text",
        text: context,
        synthetic: true,
      } as Part)
    },
  }
}
