import type { PluginContext } from "./types"
import { randomUUID } from "node:crypto"

import { getMainSessionID } from "../features/claude-code-session-state"
import { clearWorkStateState } from "../features/work-state"
import { log } from "../shared"
import { stripInvisibleAgentCharacters } from "../shared/agent-display-names"
import { resolveSessionAgent } from "./session-agent-resolver"
import { parseCortexLoopArguments } from "../hooks/cortex-loop/command-arguments"
import { DEEPWORK_VERIFICATION_PROMISE } from "../hooks/cortex-loop/constants"
import { readState, writeState } from "../hooks/cortex-loop/storage"

import type { CreatedHooks } from "../create-hooks"

function getLoopCommandArguments(args: Record<string, unknown>, command: "cortex-loop" | "dw-loop"): string {
  const rawUserMessage = typeof args.user_message === "string" ? args.user_message.trim() : ""
  if (rawUserMessage) {
    return rawUserMessage
  }

  const rawName = typeof args.name === "string" ? args.name : ""
  return rawName.replace(new RegExp(`^/?(${command})\\s*`, "i"), "")
}

export function createToolExecuteBeforeHandler(args: {
  ctx: PluginContext
  hooks: CreatedHooks
}): (
  input: { tool: string; sessionID: string; callID: string },
  output: { args: Record<string, unknown> },
) => Promise<void> {
  const { ctx, hooks } = args

  function buildDeepworkThinkerVerificationPrompt(prompt: string, originalTask: string, verificationAttemptId: string): string {
    const verificationPrompt = [
      "You are verifying the active DEEPWORK loop result for this session.",
      "",
      "Original task:",
      originalTask,
      "",
      "Review the work skeptically and critically.",
      "Assume it may be incomplete, misleading, or subtly broken until the evidence proves otherwise.",
      "Look for missing scope, weak verification, process violations, hidden regressions, and any reason the task should NOT be considered complete.",
      "",
      `If the work is fully complete, end your response with <promise>${DEEPWORK_VERIFICATION_PROMISE}</promise>.`,
      "If the work is not complete, explain the blocking issues clearly and DO NOT emit that promise.",
      "",
      `<ulw_verification_attempt_id>${verificationAttemptId}</ulw_verification_attempt_id>`,
    ].join("\n")

    return `${prompt ? `${prompt}\n\n` : ""}${verificationPrompt}`
  }

  return async (input, output): Promise<void> => {
    if (input.tool.toLowerCase() === "bash" && typeof output.args.command === "string") {
      if (output.args.command.includes("\x00")) {
        output.args.command = output.args.command.replace(/\x00/g, "")
        log("[tool-execute-before] Stripped null bytes from bash command", {
          sessionID: input.sessionID,
          callID: input.callID,
        })
      }
    }

    await hooks.writeExistingFileGuard?.["tool.execute.before"]?.(input, output)
    await hooks.questionLabelTruncator?.["tool.execute.before"]?.(input, output)
    await hooks.claudeCodeHooks?.["tool.execute.before"]?.(input, output)
    await hooks.nonInteractiveEnv?.["tool.execute.before"]?.(input, output)
    await hooks.bashFileReadGuard?.["tool.execute.before"]?.(input, output)
    await hooks.commentChecker?.["tool.execute.before"]?.(input, output)
    await hooks.directoryAgentsInjector?.["tool.execute.before"]?.(input, output)
    await hooks.directoryReadmeInjector?.["tool.execute.before"]?.(input, output)
    await hooks.rulesInjector?.["tool.execute.before"]?.(input, output)
    await hooks.tasksTodowriteDisabler?.["tool.execute.before"]?.(input, output)
    await hooks.webfetchRedirectGuard?.["tool.execute.before"]?.(input, output)
    await hooks.plannerMdOnly?.["tool.execute.before"]?.(input, output)
    await hooks.workerNotepad?.["tool.execute.before"]?.(input, output)
    await hooks.leadHook?.["tool.execute.before"]?.(input, output)

    const normalizedToolName = input.tool.toLowerCase()
    if (
      normalizedToolName === "question"
      || normalizedToolName === "ask_user_question"
      || normalizedToolName === "askuserquestion"
    ) {
      const sessionID = input.sessionID || getMainSessionID()
      await hooks.sessionNotification?.({
        event: {
          type: "tool.execute.before",
          properties: {
            sessionID,
            tool: input.tool,
            args: output.args,
          },
        },
      })
    }

    if (input.tool === "task") {
      const argsObject = output.args
      const category = typeof argsObject.category === "string" ? argsObject.category : undefined
      const subagentType = typeof argsObject.subagent_type === "string" ? argsObject.subagent_type : undefined
      const taskId = typeof argsObject.task_id === "string" ? argsObject.task_id : undefined

      if (category) {
        argsObject.subagent_type = "worker"
      } else if (!subagentType && taskId) {
        const resolvedAgent = await resolveSessionAgent(ctx.client, taskId)
        argsObject.subagent_type = resolvedAgent ?? "continue"
      }

      const normalizedSubagentType =
        typeof argsObject.subagent_type === "string" ? stripInvisibleAgentCharacters(argsObject.subagent_type) : undefined
      const prompt = typeof argsObject.prompt === "string" ? argsObject.prompt : ""
      const loopState = typeof ctx.directory === "string" ? readState(ctx.directory) : null
      const shouldInjectThinkerVerification =
        normalizedSubagentType === "thinker"
        && loopState?.active === true
        && loopState.deepwork === true
        && loopState.verification_pending === true
        && loopState.session_id === input.sessionID

      if (shouldInjectThinkerVerification) {
        const verificationAttemptId = randomUUID()
        log("[tool-execute-before] Injecting DW thinker verification attempt", {
          sessionID: input.sessionID,
          callID: input.callID,
          verificationAttemptId,
          loopSessionID: loopState.session_id,
        })
        writeState(ctx.directory, {
          ...loopState,
          verification_attempt_id: verificationAttemptId,
          verification_session_id: undefined,
        })
        argsObject.run_in_background = false
        argsObject.prompt = buildDeepworkThinkerVerificationPrompt(
          prompt,
          loopState.prompt,
          verificationAttemptId,
        )
      }
    }

    if (hooks.cortexLoop && input.tool === "skill") {
      const rawName = typeof output.args.name === "string" ? output.args.name : undefined
      const command = rawName?.replace(/^\//, "").toLowerCase()
      const sessionID = input.sessionID || getMainSessionID()

      if (command === "cortex-loop" && sessionID) {
        const rawArgs = getLoopCommandArguments(output.args, "cortex-loop")
        const parsedArguments = parseCortexLoopArguments(rawArgs)

        hooks.cortexLoop.startLoop(sessionID, parsedArguments.prompt, {
          maxIterations: parsedArguments.maxIterations,
          completionPromise: parsedArguments.completionPromise,
          strategy: parsedArguments.strategy,
        })
      } else if (command === "cancel-cortex" && sessionID) {
        hooks.cortexLoop.cancelLoop(sessionID)
      } else if (command === "dw-loop" && sessionID) {
        const rawArgs = getLoopCommandArguments(output.args, "dw-loop")
        const parsedArguments = parseCortexLoopArguments(rawArgs)

        hooks.cortexLoop.startLoop(sessionID, parsedArguments.prompt, {
          deepwork: true,
          maxIterations: parsedArguments.maxIterations,
          completionPromise: parsedArguments.completionPromise,
          strategy: parsedArguments.strategy,
        })
      }
    }

    if (input.tool === "skill") {
      const rawName = typeof output.args.name === "string" ? output.args.name : undefined
      const command = rawName?.replace(/^\//, "").toLowerCase()
      const sessionID = input.sessionID || getMainSessionID()

      if (command === "stop-continuation" && sessionID) {
        hooks.stopContinuationGuard?.stop(sessionID)
        hooks.todoContinuationEnforcer?.cancelAllCountdowns()
        hooks.cortexLoop?.cancelLoop(sessionID)
        clearWorkStateState(ctx.directory)
        log("[stop-continuation] All continuation mechanisms stopped", {
          sessionID,
        })
      }

      // Clear stop state when user explicitly resumes work via work-starting commands.
      // This ensures /stop-continuation persists until the user intentionally restarts.
      const workStartingCommands = ["start-work", "cortex-loop", "dw-loop"]
      if (workStartingCommands.includes(command ?? "") && sessionID) {
        if (hooks.stopContinuationGuard?.isStopped(sessionID)) {
          hooks.stopContinuationGuard.clear(sessionID)
          log("[stop-continuation] Stop state cleared by work-starting command", {
            sessionID,
            command,
          })
        }
      }
    }
  }
}
