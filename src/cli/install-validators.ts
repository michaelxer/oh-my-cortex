import color from "picocolors"
import type {
  BooleanArg,
  ClaudeSubscription,
  DetectedConfig,
  InstallArgs,
  InstallConfig,
} from "./types"
import type { GeneratedOmxConfig } from "./model-fallback-types"

export const SYMBOLS = {
  check: color.green("✓"),
  cross: color.red("✗"),
  arrow: color.cyan("→"),
  bullet: color.dim("•"),
  info: color.blue("ℹ"),
  warn: color.yellow("⚠"),
  star: color.yellow("★"),
  dot: color.dim("·"),
}

const ANSI_COLOR_PATTERN = new RegExp("\u001b\\[[0-9;]*m", "g")

function formatProvider(name: string, enabled: boolean, detail?: string): string {
  const status = enabled ? SYMBOLS.check : color.dim("○")
  const label = enabled ? color.white(name) : color.dim(name)
  const suffix = detail ? color.dim(` (${detail})`) : ""
  return `  ${status} ${label}${suffix}`
}

const AGENT_ROLES: Record<string, string> = {
  chief: "Main orchestrator — plans, delegates, challenges",
  founder: "Autonomous deep worker — goal in, result out",
  thinker: "All-domain consultant — read-only reasoning",
  researcher: "Knowledge finder — docs, examples, best practices",
  tracker: "Codebase explorer — fast file and pattern search",
  planner: "Strategic interviewer — questions first, plan second",
  reviewer: "Gap finder — catches what Planner missed",
  critic: "Quality gate — validates plans before execution",
  lead: "Project manager — delegates tasks to Workers",
  worker: "Task executor — focused, disciplined, scoped",
  spotter: "Visual analyst — images, PDFs, diagrams",
}

const AGENT_ORDER = [
  "chief", "founder", "thinker", "researcher", "tracker",
  "planner", "reviewer", "critic", "lead", "worker", "spotter",
]

function extractModelShortName(modelId: string): string {
  const parts = modelId.split("/")
  return parts.length > 1 ? parts[1] : modelId
}

function padRight(text: string, width: number): string {
  const stripped = text.replace(ANSI_COLOR_PATTERN, "")
  const padding = Math.max(0, width - stripped.length)
  return text + " ".repeat(padding)
}

export function formatConfigSummary(config: InstallConfig): string {
  const lines: string[] = []

  lines.push(color.bold(color.white("Your Providers")))
  lines.push("")

  const claudeDetail = config.hasClaude ? (config.isMax20 ? "max20" : "standard") : undefined
  lines.push(formatProvider("Claude", config.hasClaude, claudeDetail))
  lines.push(formatProvider("OpenAI / ChatGPT", config.hasOpenAI))
  lines.push(formatProvider("Gemini", config.hasGemini))
  lines.push(formatProvider("GitHub Copilot", config.hasCopilot))
  lines.push(formatProvider("OpenCode Zen", config.hasOpencodeZen))
  lines.push(formatProvider("Z.ai Coding Plan", config.hasZaiCodingPlan))
  lines.push(formatProvider("Kimi For Coding", config.hasKimiForCoding))
  lines.push(formatProvider("OpenCode Go", config.hasOpencodeGo))
  lines.push(formatProvider("Vercel AI Gateway", config.hasVercelAiGateway))
  lines.push(formatProvider("AXR AI", !!config.axraiTier, config.axraiTier))

  return lines.join("\n")
}

export function formatAgentModelTable(generatedConfig: GeneratedOmxConfig): string {
  const lines: string[] = []

  lines.push(color.bold(color.white("Your OMX Team")))
  lines.push("")
  lines.push(
    `  ${padRight(color.bold(color.white("Agent")), 22)}` +
    `${padRight(color.bold(color.white("Model")), 28)}` +
    `${color.bold(color.white("Role"))}`,
  )
  lines.push(`  ${color.dim("─".repeat(70))}`)

  for (const agentKey of AGENT_ORDER) {
    const agentConfig = generatedConfig.agents?.[agentKey]
    const model = agentConfig?.model
      ? extractModelShortName(agentConfig.model)
      : color.dim("(fallback)")
    const variant = agentConfig?.variant ? color.dim(` ${agentConfig.variant}`) : ""
    const role = AGENT_ROLES[agentKey] ?? ""
    const isPrimary = agentKey === "chief" || agentKey === "founder"
    const agentLabel = isPrimary
      ? color.bold(color.cyan(agentKey.charAt(0).toUpperCase() + agentKey.slice(1)))
      : color.white(agentKey.charAt(0).toUpperCase() + agentKey.slice(1))
    const badge = isPrimary ? color.cyan(" ★") : "  "

    lines.push(
      `  ${padRight(`${badge}${agentLabel}`, 22)}` +
      `${padRight(`${color.green(model)}${variant}`, 28)}` +
      `${color.dim(role)}`,
    )
  }

  lines.push("")
  lines.push(`  ${SYMBOLS.info} ${color.cyan("★")} = primary agent ${color.dim("(selectable via Tab)")}`)
  lines.push(`  ${SYMBOLS.info} Others are subagents ${color.dim("(called automatically by Chief)")}`)

  return lines.join("\n")
}

export function formatGettingStarted(): string {
  const lines: string[] = []

  lines.push(color.bold(color.white("Getting Started")))
  lines.push("")
  lines.push(`  ${SYMBOLS.bullet} Switch to ${color.cyan("Chief")} via ${color.bold("Tab")} to begin`)
  lines.push(`  ${SYMBOLS.bullet} Type ${color.cyan("deepwork")} or ${color.cyan("dw")} for full autonomous mode`)
  lines.push("")
  lines.push(color.bold(color.white("  OMX works beyond code:")))
  lines.push(`    ${SYMBOLS.bullet} Business strategy and decision analysis`)
  lines.push(`    ${SYMBOLS.bullet} Sensitive communication drafting`)
  lines.push(`    ${SYMBOLS.bullet} Risk assessment and crisis planning`)
  lines.push(`    ${SYMBOLS.bullet} Research synthesis and evidence review`)
  lines.push(`    ${SYMBOLS.bullet} Coaching, mentoring, and reflection`)

  return lines.join("\n")
}

export function formatCommands(): string {
  const lines: string[] = []

  lines.push(color.bold(color.white("Useful Commands")))
  lines.push("")
  lines.push(`  ${color.cyan("/deepwork")} or ${color.cyan("/dw")}       Full activation — all agents, max intensity`)
  lines.push(`  ${color.cyan("/dw-loop")}              Cortex loop — runs until 100% done`)
  lines.push(`  ${color.cyan("/challenge [1-4]")}      Set challenge level (1=nudge 4=red-team)`)
  lines.push(`  ${color.cyan("/checkpoint")}           Force a conversation summary`)
  lines.push(`  ${color.cyan("/lens [domain]")}        Activate domain lens (health, legal, etc.)`)
  lines.push(`  ${color.cyan("/decide")}               Structured decision framework`)
  lines.push(`  ${color.cyan("/start-work")}           Execute from a Planner plan`)
  lines.push(`  ${color.cyan("/cancel-cortex")}        Stop the cortex loop`)

  return lines.join("\n")
}

export function formatCoexistenceNote(): string {
  const lines: string[] = []

  lines.push(color.bold(color.white("Coexistence")))
  lines.push("")
  lines.push(`  OMX runs safely alongside OmO and OMC.`)
  lines.push(`  Use ${color.cyan("Chief")} for general work, ${color.cyan("Sisyphus")}/${color.cyan("Captain")} for coding.`)
  lines.push(`  Agents stay in their own lane — no cross-contamination.`)

  return lines.join("\n")
}

export function printHeader(isUpdate: boolean): void {
  const mode = isUpdate ? "Update" : "Install"
  console.log()
  console.log(color.bgCyan(color.white(color.bold(` OMX — oh-my-cortex ${mode} `))))
  console.log()
}

export function printStep(step: number, total: number, message: string): void {
  const progress = color.dim(`[${step}/${total}]`)
  console.log(`${progress} ${message}`)
}

export function printSuccess(message: string): void {
  console.log(`${SYMBOLS.check} ${message}`)
}

export function printError(message: string): void {
  console.log(`${SYMBOLS.cross} ${color.red(message)}`)
}

export function printInfo(message: string): void {
  console.log(`${SYMBOLS.info} ${message}`)
}

export function printWarning(message: string): void {
  console.log(`${SYMBOLS.warn} ${color.yellow(message)}`)
}

export function printBox(content: string, title?: string): void {
  const lines = content.split("\n")
  const maxWidth =
    Math.max(
      ...lines.map((line) => line.replace(ANSI_COLOR_PATTERN, "").length),
      title?.length ?? 0,
    ) + 4
  const border = color.dim("─".repeat(maxWidth))

  console.log()
  if (title) {
    console.log(
      color.dim("┌─") +
        color.bold(` ${title} `) +
        color.dim("─".repeat(maxWidth - title.length - 4)) +
        color.dim("┐"),
    )
  } else {
    console.log(color.dim("┌") + border + color.dim("┐"))
  }

  for (const line of lines) {
    const stripped = line.replace(ANSI_COLOR_PATTERN, "")
    const padding = maxWidth - stripped.length
    console.log(color.dim("│") + ` ${line}${" ".repeat(padding - 1)}` + color.dim("│"))
  }

  console.log(color.dim("└") + border + color.dim("┘"))
  console.log()
}

export function validateNonTuiArgs(args: InstallArgs): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  const usesAxrai = args.axrai === "trial" || args.axrai === "pro" || args.axrai === "owner"

  if (args.axrai !== undefined && !["no", "trial", "pro", "owner"].includes(args.axrai)) {
    errors.push(`Invalid --axrai value: ${args.axrai} (expected: no, trial, pro, owner)`)
  }

  if (!usesAxrai && args.claude === undefined) {
    errors.push("--claude is required (values: no, yes, max20)")
  } else if (args.claude !== undefined && !["no", "yes", "max20"].includes(args.claude)) {
    errors.push(`Invalid --claude value: ${args.claude} (expected: no, yes, max20)`)
  }

  if (!usesAxrai && args.gemini === undefined) {
    errors.push("--gemini is required (values: no, yes)")
  } else if (args.gemini !== undefined && !["no", "yes"].includes(args.gemini)) {
    errors.push(`Invalid --gemini value: ${args.gemini} (expected: no, yes)`)
  }

  if (!usesAxrai && args.copilot === undefined) {
    errors.push("--copilot is required (values: no, yes)")
  } else if (args.copilot !== undefined && !["no", "yes"].includes(args.copilot)) {
    errors.push(`Invalid --copilot value: ${args.copilot} (expected: no, yes)`)
  }

  if (args.openai !== undefined && !["no", "yes"].includes(args.openai)) {
    errors.push(`Invalid --openai value: ${args.openai} (expected: no, yes)`)
  }

  if (args.opencodeGo !== undefined && !["no", "yes"].includes(args.opencodeGo)) {
    errors.push(`Invalid --opencode-go value: ${args.opencodeGo} (expected: no, yes)`)
  }

  if (args.opencodeZen !== undefined && !["no", "yes"].includes(args.opencodeZen)) {
    errors.push(`Invalid --opencode-zen value: ${args.opencodeZen} (expected: no, yes)`)
  }

  if (args.zaiCodingPlan !== undefined && !["no", "yes"].includes(args.zaiCodingPlan)) {
    errors.push(`Invalid --zai-coding-plan value: ${args.zaiCodingPlan} (expected: no, yes)`)
  }

  if (args.kimiForCoding !== undefined && !["no", "yes"].includes(args.kimiForCoding)) {
    errors.push(`Invalid --kimi-for-coding value: ${args.kimiForCoding} (expected: no, yes)`)
  }

  if (args.vercelAiGateway !== undefined && !["no", "yes"].includes(args.vercelAiGateway)) {
    errors.push(`Invalid --vercel-ai-gateway value: ${args.vercelAiGateway} (expected: no, yes)`)
  }

  return { valid: errors.length === 0, errors }
}

export function argsToConfig(args: InstallArgs): InstallConfig {
  const axraiTier = args.axrai === "trial" || args.axrai === "pro" || args.axrai === "owner" ? args.axrai : undefined
  return {
    hasClaude: axraiTier ? false : args.claude !== "no",
    isMax20: axraiTier ? false : args.claude === "max20",
    hasOpenAI: axraiTier ? false : args.openai === "yes",
    hasGemini: axraiTier ? false : args.gemini === "yes",
    hasCopilot: axraiTier ? false : args.copilot === "yes",
    hasOpencodeZen: axraiTier ? false : args.opencodeZen === "yes",
    hasZaiCodingPlan: axraiTier ? false : args.zaiCodingPlan === "yes",
    hasKimiForCoding: axraiTier ? false : args.kimiForCoding === "yes",
    hasOpencodeGo: axraiTier ? false : args.opencodeGo === "yes",
    hasVercelAiGateway: axraiTier ? false : args.vercelAiGateway === "yes",
    axraiTier,
  }
}

export function detectedToInitialValues(detected: DetectedConfig): {
  claude: ClaudeSubscription
  openai: BooleanArg
  gemini: BooleanArg
  copilot: BooleanArg
  opencodeZen: BooleanArg
  zaiCodingPlan: BooleanArg
  kimiForCoding: BooleanArg
  opencodeGo: BooleanArg
  vercelAiGateway: BooleanArg
} {
  let claude: ClaudeSubscription = "no"
  if (detected.hasClaude) {
    claude = detected.isMax20 ? "max20" : "yes"
  }

  return {
    claude,
    openai: detected.hasOpenAI ? "yes" : "no",
    gemini: detected.hasGemini ? "yes" : "no",
    copilot: detected.hasCopilot ? "yes" : "no",
    opencodeZen: detected.hasOpencodeZen ? "yes" : "no",
    zaiCodingPlan: detected.hasZaiCodingPlan ? "yes" : "no",
    kimiForCoding: detected.hasKimiForCoding ? "yes" : "no",
    opencodeGo: detected.hasOpencodeGo ? "yes" : "no",
    vercelAiGateway: detected.hasVercelAiGateway ? "yes" : "no",
  }
}
