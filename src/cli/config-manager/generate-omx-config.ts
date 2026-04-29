import type { InstallConfig } from "../types"
import { generateModelConfig } from "../model-fallback"

export function generateOmxConfig(installConfig: InstallConfig): Record<string, unknown> {
  return generateModelConfig(installConfig)
}
