export type ClaudeSubscription = "no" | "yes" | "max20"
export type BooleanArg = "no" | "yes"
export type AxraiTier = "trial" | "pro" | "owner"

export interface InstallArgs {
  tui: boolean
  claude?: ClaudeSubscription
  openai?: BooleanArg
  gemini?: BooleanArg
  copilot?: BooleanArg
  opencodeZen?: BooleanArg
  zaiCodingPlan?: BooleanArg
  kimiForCoding?: BooleanArg
  opencodeGo?: BooleanArg
  vercelAiGateway?: BooleanArg
  axrai?: AxraiTier | "no"
  skipAuth?: boolean
}

export interface InstallConfig {
  hasClaude: boolean
  isMax20: boolean
  hasOpenAI: boolean
  hasGemini: boolean
  hasCopilot: boolean
  hasOpencodeZen: boolean
  hasZaiCodingPlan: boolean
  hasKimiForCoding: boolean
  hasOpencodeGo: boolean
  hasVercelAiGateway: boolean
  axraiTier?: AxraiTier
  axraiModelIds?: string[]
  axraiOpenCodeConfig?: Record<string, unknown>
  axraiPrimaryModel?: string
  axraiSmallModel?: string
}

export interface ConfigMergeResult {
  success: boolean
  configPath: string
  error?: string
}

export interface DetectedConfig {
  isInstalled: boolean
  installedVersion: string | null
  hasClaude: boolean
  isMax20: boolean
  hasOpenAI: boolean
  hasGemini: boolean
  hasCopilot: boolean
  hasOpencodeZen: boolean
  hasZaiCodingPlan: boolean
  hasKimiForCoding: boolean
  hasOpencodeGo: boolean
  hasVercelAiGateway: boolean
}
