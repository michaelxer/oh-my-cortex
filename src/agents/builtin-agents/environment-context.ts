import type { AgentConfig } from "@opencode-ai/sdk"
import { createEnvContext } from "../env-context"

type ApplyEnvironmentContextOptions = {
  disableCortexEnv?: boolean
}

export function applyEnvironmentContext(
  config: AgentConfig,
  directory?: string,
  options: ApplyEnvironmentContextOptions = {}
): AgentConfig {
  if (options.disableCortexEnv || !directory || !config.prompt) return config
  const envContext = createEnvContext()
  return { ...config, prompt: config.prompt + envContext }
}
