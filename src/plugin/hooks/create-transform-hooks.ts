import type { OhMyCortexConfig } from "../../config"
import type { PluginContext } from "../types"
import type { CortexLoopHook } from "../../hooks/cortex-loop"

import {
  createClaudeCodeHooksHook,
  createKeywordDetectorHook,
  createThinkingBlockValidatorHook,
  createToolPairValidatorHook,
  createChallengeEngineHook,
  createDomainLensHook,
  createCheckpointCounterHook,
} from "../../hooks"
import {
  contextCollector,
  createContextInjectorMessagesTransformHook,
} from "../../features/context-injector"
import { safeCreateHook } from "../../shared/safe-create-hook"

export type TransformHooks = {
  claudeCodeHooks: ReturnType<typeof createClaudeCodeHooksHook> | null
  keywordDetector: ReturnType<typeof createKeywordDetectorHook> | null
  contextInjectorMessagesTransform: ReturnType<typeof createContextInjectorMessagesTransformHook>
  thinkingBlockValidator: ReturnType<typeof createThinkingBlockValidatorHook> | null
  toolPairValidator: ReturnType<typeof createToolPairValidatorHook> | null
  challengeEngine: ReturnType<typeof createChallengeEngineHook> | null
  domainLens: ReturnType<typeof createDomainLensHook> | null
  checkpointCounter: ReturnType<typeof createCheckpointCounterHook> | null
}

export function createTransformHooks(args: {
  ctx: PluginContext
  pluginConfig: OhMyCortexConfig
  isHookEnabled: (hookName: string) => boolean
  safeHookEnabled?: boolean
  cortexLoop?: CortexLoopHook | null
}): TransformHooks {
  const { ctx, pluginConfig, isHookEnabled, cortexLoop } = args
  const safeHookEnabled = args.safeHookEnabled ?? true

  const claudeCodeHooks = isHookEnabled("claude-code-hooks")
    ? safeCreateHook(
        "claude-code-hooks",
        () =>
          createClaudeCodeHooksHook(
            ctx,
            {
              disabledHooks: (pluginConfig.claude_code?.hooks ?? true) ? undefined : true,
              keywordDetectorDisabled: !isHookEnabled("keyword-detector"),
            },
            contextCollector,
          ),
        { enabled: safeHookEnabled },
      )
    : null

  const keywordDetector = isHookEnabled("keyword-detector")
    ? safeCreateHook(
        "keyword-detector",
        () => createKeywordDetectorHook(ctx, contextCollector, cortexLoop ?? undefined),
        { enabled: safeHookEnabled },
      )
    : null

  const contextInjectorMessagesTransform =
    createContextInjectorMessagesTransformHook(contextCollector)

  const thinkingBlockValidator = isHookEnabled("thinking-block-validator")
    ? safeCreateHook(
        "thinking-block-validator",
        () => createThinkingBlockValidatorHook(),
        { enabled: safeHookEnabled },
      )
    : null

  const toolPairValidator = isHookEnabled("tool-pair-validator")
    ? safeCreateHook(
        "tool-pair-validator",
        () => createToolPairValidatorHook(),
        { enabled: safeHookEnabled },
      )
    : null

  const challengeEngine = isHookEnabled("challenge-engine")
    ? safeCreateHook(
        "challenge-engine",
        () => createChallengeEngineHook(),
        { enabled: safeHookEnabled },
      )
    : null

  const domainLens = isHookEnabled("domain-lens")
    ? safeCreateHook(
        "domain-lens",
        () => createDomainLensHook(),
        { enabled: safeHookEnabled },
      )
    : null

  const checkpointCounter = isHookEnabled("checkpoint-counter")
    ? safeCreateHook(
        "checkpoint-counter",
        () => createCheckpointCounterHook(),
        { enabled: safeHookEnabled },
      )
    : null

  return {
    claudeCodeHooks,
    keywordDetector,
    contextInjectorMessagesTransform,
    thinkingBlockValidator,
    toolPairValidator,
    challengeEngine,
    domainLens,
    checkpointCounter,
  }
}
