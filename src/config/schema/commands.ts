import { z } from "zod"

export const BuiltinCommandNameSchema = z.enum([
  "init-deep",
  "cortex-loop",
  "dw-loop",
  "cancel-cortex",
  "refactor",
  "start-work",
  "stop-continuation",
  "remove-ai-slops",
  "handoff",
  "challenge",
  "checkpoint",
  "ledger",
  "lens",
  "decide",
  "hyperplan",
])

export type BuiltinCommandName = z.infer<typeof BuiltinCommandNameSchema>
