import type { CreatedHooks } from "../create-hooks"
import { parseCortexLoopArguments } from "../hooks/cortex-loop/command-arguments"
import { log } from "../shared/logger"

type CommandExecuteBeforeInput = {
  command: string
  sessionID: string
  arguments: string
}

type CommandExecuteBeforeOutput = {
  parts: Array<{ type: string; text?: string; [key: string]: unknown }>
  message?: Record<string, unknown>
}

const NATIVE_LOOP_TRIGGERED_FLAG = "__omxNativeLoopTriggered"

function hasPartsOutput(value: unknown): value is CommandExecuteBeforeOutput {
  if (typeof value !== "object" || value === null) return false
  const record = value as Record<string, unknown>
  const parts = record["parts"]
  return Array.isArray(parts)
}

export function createCommandExecuteBeforeHandler(args: {
  hooks: CreatedHooks
}): (
  input: CommandExecuteBeforeInput,
  output: CommandExecuteBeforeOutput,
) => Promise<void> {
  const { hooks } = args

  return async (input, output): Promise<void> => {
    await hooks.autoSlashCommand?.["command.execute.before"]?.(input, output)

    const normalizedCommand = input.command.toLowerCase()
    const sessionID = input.sessionID
    if (hooks.cortexLoop && sessionID) {
      if (normalizedCommand === "cortex-loop" || normalizedCommand === "dw-loop") {
        const parsedArguments = parseCortexLoopArguments(input.arguments || "")
        hooks.cortexLoop.startLoop(sessionID, parsedArguments.prompt, {
          deepwork: normalizedCommand === "dw-loop",
          maxIterations: parsedArguments.maxIterations,
          completionPromise: parsedArguments.completionPromise,
          strategy: parsedArguments.strategy,
        })
        output.message ??= {}
        output.message[NATIVE_LOOP_TRIGGERED_FLAG] = true
        if (hooks.stopContinuationGuard?.isStopped(sessionID)) {
          hooks.stopContinuationGuard.clear(sessionID)
          log("[stop-continuation] Stop state cleared by native command", {
            sessionID,
            command: normalizedCommand,
          })
        }
      } else if (normalizedCommand === "cancel-cortex") {
        hooks.cortexLoop.cancelLoop(sessionID)
        output.message ??= {}
        output.message[NATIVE_LOOP_TRIGGERED_FLAG] = true
      }
    }

    if (
      hooks.startWork
      && normalizedCommand === "start-work"
      && hasPartsOutput(output)
    ) {
      await hooks.startWork["command.execute.before"]?.(input, output)
      if (hooks.stopContinuationGuard?.isStopped(sessionID)) {
        hooks.stopContinuationGuard.clear(sessionID)
        log("[stop-continuation] Stop state cleared by native command", {
          sessionID,
          command: normalizedCommand,
        })
      }
    }
  }
}

export { NATIVE_LOOP_TRIGGERED_FLAG }
