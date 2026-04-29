import type { HookName, OhMyCortexConfig } from "../../config"
import type { BackgroundManager } from "../../features/background-agent"
import type { ModelFallbackControllerAccessor } from "../../hooks/model-fallback"
import type { PluginContext } from "../types"
import type { ModelCacheState } from "../../plugin-state"

import { createSessionHooks } from "./create-session-hooks"
import { createToolGuardHooks } from "./create-tool-guard-hooks"
import { createTransformHooks } from "./create-transform-hooks"

export function createCoreHooks(args: {
  ctx: PluginContext
  pluginConfig: OhMyCortexConfig
  modelCacheState: ModelCacheState
  backgroundManager: BackgroundManager
  modelFallbackControllerAccessor?: ModelFallbackControllerAccessor
  isHookEnabled: (hookName: HookName) => boolean
  safeHookEnabled: boolean
}) {
  const { ctx, pluginConfig, modelCacheState, backgroundManager, modelFallbackControllerAccessor, isHookEnabled, safeHookEnabled } = args

  const session = createSessionHooks({
    ctx,
    pluginConfig,
    modelCacheState,
    backgroundManager,
    modelFallbackControllerAccessor,
    isHookEnabled,
    safeHookEnabled,
  })

  const tool = createToolGuardHooks({
    ctx,
    pluginConfig,
    modelCacheState,
    isHookEnabled,
    safeHookEnabled,
  })

  const transform = createTransformHooks({
    ctx,
    pluginConfig,
    isHookEnabled: (name) => isHookEnabled(name as HookName),
    safeHookEnabled,
    cortexLoop: session.cortexLoop,
  })

  return {
    ...session,
    ...tool,
    ...transform,
  }
}
