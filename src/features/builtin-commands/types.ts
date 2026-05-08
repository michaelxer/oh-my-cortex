import type { CommandDefinition } from "../claude-code-command-loader"

export type BuiltinCommandName = "init-deep" | "cortex-loop" | "cancel-cortex" | "dw-loop" | "refactor" | "start-work" | "stop-continuation" | "handoff" | "remove-ai-slops" | "challenge" | "checkpoint" | "ledger" | "cortex-search" | "cortex-init" | "lens" | "decide" | "hyperplan"

export interface BuiltinCommandConfig {
  disabled_commands?: BuiltinCommandName[]
}

export type BuiltinCommands = Record<string, CommandDefinition>
