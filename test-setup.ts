import { afterEach, beforeEach, mock } from "bun:test"
import { rmSync } from "node:fs"
import { _resetForTesting as resetClaudeSessionState } from "./src/features/claude-code-session-state/state"
import { _resetTaskToastManagerForTesting as resetTaskToastManager } from "./src/features/task-toast-manager/manager"
import { _resetForTesting as resetModelFallbackState } from "./src/hooks/model-fallback/hook"
import { _resetMemCacheForTesting as resetConnectedProvidersCache } from "./src/shared/connected-providers-cache"
import { getOmxCacheDir } from "./src/shared/data-path"
import { installModuleMockLifecycle } from "./src/testing/module-mock-lifecycle"

const { restoreModuleMocks } = installModuleMockLifecycle(mock)
let environmentSnapshot: NodeJS.ProcessEnv = { ...process.env }
let workingDirectorySnapshot = process.cwd()

function cleanupCacheDir(cacheDir: string): void {
  rmSync(cacheDir, { recursive: true, force: true })
}

beforeEach(() => {
  environmentSnapshot = { ...process.env }
  workingDirectorySnapshot = process.cwd()
  process.env.OMX_DISABLE_POSTHOG = "true"
  cleanupCacheDir(getOmxCacheDir())
  resetClaudeSessionState()
  resetTaskToastManager()
  resetModelFallbackState()
  resetConnectedProvidersCache()
})

afterEach(() => {
  const currentCacheDir = getOmxCacheDir()

  for (const key of Object.keys(process.env)) {
    if (!(key in environmentSnapshot)) {
      delete process.env[key]
    }
  }

  for (const [key, value] of Object.entries(environmentSnapshot)) {
    if (value === undefined) {
      delete process.env[key]
      continue
    }

    process.env[key] = value
  }

  if (process.cwd() !== workingDirectorySnapshot) {
    process.chdir(workingDirectorySnapshot)
  }

  cleanupCacheDir(currentCacheDir)
  cleanupCacheDir(getOmxCacheDir())
  resetTaskToastManager()
  resetConnectedProvidersCache()
  mock.restore()
  restoreModuleMocks()
})
