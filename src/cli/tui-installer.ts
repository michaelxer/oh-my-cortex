import * as p from "@clack/prompts"
import color from "picocolors"
import { PLUGIN_NAME, PUBLISHED_PACKAGE_NAME } from "../shared/plugin-identity"
import type { InstallArgs } from "./types"
import {
  addPluginToOpenCodeConfig,
  detectCurrentConfig,
  generateOpenCodeInstallConfig,
  getOpenCodeVersion,
  isOpenCodeInstalled,
  writeOmxConfig,
} from "./config-manager/install-operations"
import { generateOmxConfig } from "./config-manager/generate-omx-config"
import {
  detectedToInitialValues,
  formatAgentModelTable,
  formatCoexistenceNote,
  formatCommands,
  formatConfigSummary,
  formatGettingStarted,
  SYMBOLS,
} from "./install-validators"
import { getUnsupportedOpenCodeVersionMessage } from "./minimum-opencode-version"
import { promptInstallConfig, promptModelCustomization } from "./tui-install-prompts"

export async function runTuiInstaller(args: InstallArgs, version: string): Promise<number> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    console.error("Error: Interactive installer requires a TTY. Use --no-tui or set environment variables directly.")
    return 1
  }

  const detected = detectCurrentConfig()
  const isUpdate = detected.isInstalled

  p.intro(color.bgCyan(color.white(color.bold(isUpdate ? " OMX — oh-my-cortex Update " : " OMX — oh-my-cortex "))))

  if (isUpdate) {
    const initial = detectedToInitialValues(detected)
    p.log.info(`Existing configuration detected: Claude=${initial.claude}, Gemini=${initial.gemini}`)
  }

  const spinner = p.spinner()
  spinner.start("Checking OpenCode installation")

  const installed = await isOpenCodeInstalled()
  const openCodeVersion = await getOpenCodeVersion()
  if (!installed) {
    spinner.stop(`OpenCode binary not found ${color.yellow("[!]")}`)
    p.log.warn("OpenCode binary not found. Plugin will be configured, but you'll need to install OpenCode to use it.")
    p.note("Visit https://opencode.ai/docs for installation instructions", "Installation Guide")
  } else {
    spinner.stop(`OpenCode ${openCodeVersion ?? "installed"} ${color.green("[OK]")}`)

    const unsupportedVersionMessage = getUnsupportedOpenCodeVersionMessage(openCodeVersion)
    if (unsupportedVersionMessage) {
      p.log.warn(unsupportedVersionMessage)
      p.outro(color.red("Installation blocked."))
      return 1
    }
  }

  const config = await promptInstallConfig(detected)
  if (!config) return 1

  const generatedOpenCodeConfig = await generateOpenCodeInstallConfig(config)

  spinner.start(`Adding ${PLUGIN_NAME} and visible OMX entries to OpenCode config`)
  const pluginResult = await addPluginToOpenCodeConfig(version, generatedOpenCodeConfig)
  if (!pluginResult.success) {
    spinner.stop(`Failed to add plugin: ${pluginResult.error}`)
    p.outro(color.red("Installation failed."))
    return 1
  }
  spinner.stop(`Plugin added to ${color.cyan(pluginResult.configPath)}`)

  spinner.start(`Writing ${PLUGIN_NAME} configuration`)
  const omxResult = writeOmxConfig(config)
  if (!omxResult.success) {
    spinner.stop(`Failed to write config: ${omxResult.error}`)
    p.outro(color.red("Installation failed."))
    return 1
  }
  spinner.stop(`Config written to ${color.cyan(omxResult.configPath)}`)

  // Generate the model config to show actual agent-model assignments
  let generatedConfig = generateOmxConfig(config) as import("./model-fallback-types").GeneratedOmxConfig

  p.log.success(color.bold(isUpdate ? "Configuration updated!" : "Installation complete!"))

  if (!config.hasClaude) {
    p.log.info(
      `${color.bold("Note:")} Chief agent performs best with Claude Opus 4.5+.\n` +
        `Other models work but may have reduced orchestration quality.`,
    )
  }

  if (!config.hasClaude && !config.hasOpenAI && !config.hasGemini && !config.hasCopilot && !config.hasOpencodeZen && !config.hasVercelAiGateway) {
    p.log.warn("No model providers configured. Using opencode/big-pickle as fallback.")
  }

  // Provider summary
  p.note(formatConfigSummary(config), isUpdate ? "Updated Configuration" : "Installation Complete")

  // Agent-model assignment table
  p.note(formatAgentModelTable(generatedConfig), "Agent Setup")

  // Ask user if they want to customize any agent's model
  generatedConfig = await promptModelCustomization(generatedConfig)

  // Re-write config if user made changes
  const customizedResult = writeOmxConfig(config)
  if (customizedResult.success && generatedConfig.agents) {
    // Merge customized agent models back into the config file
    const { writeFileSync } = await import("node:fs")
    const { parseJsonc } = await import("../shared/jsonc-parser")
    const { readFileSync } = await import("node:fs")
    try {
      const existingContent = readFileSync(customizedResult.configPath, "utf-8")
      const existing = parseJsonc<Record<string, unknown>>(existingContent) ?? {}
      const merged = { ...existing, agents: generatedConfig.agents }
      writeFileSync(customizedResult.configPath, JSON.stringify(merged, null, 2) + "\n")
    } catch {
      // Non-fatal — config was already written with auto-detected models
    }
  }

  // Getting started guide
  p.note(formatGettingStarted(), "Getting Started")

  // Useful commands
  p.note(formatCommands(), "Commands")

  // Coexistence note
  p.note(formatCoexistenceNote(), "Coexistence")

  // Important notes
  p.log.info(`OMX matches the ${color.bold("strongest available model")} to each agent automatically`)
  p.log.info(`Add more providers later by re-running ${color.cyan(`npx ${PUBLISHED_PACKAGE_NAME} install`)}`)
  p.log.info("Restart opencode and confirm Chief and Founder are the selectable OMX agents")
  p.log.info("Anonymous telemetry is enabled by default. Disable with OMX_SEND_ANONYMOUS_TELEMETRY=0 or OMX_DISABLE_POSTHOG=1.")

  p.log.message(`${color.yellow("★")} If you found this helpful, consider starring the repo!`)
  p.log.message(
    `  ${color.dim("gh api --silent --method PUT /user/starred/michaelxer/oh-my-cortex >/dev/null 2>&1 || true")}`,
  )

  p.log.step(`Restart ${color.cyan("opencode")} to activate OMX.`)
  p.outro(color.green("OMX... Think deeper."))

  if ((config.hasClaude || config.hasGemini || config.hasCopilot) && !args.skipAuth) {
    const providers: string[] = []
    if (config.hasClaude) providers.push(`Anthropic ${color.gray("→ Claude Pro/Max")}`)
    if (config.hasGemini) providers.push(`Google ${color.gray("→ Gemini")}`)
    if (config.hasCopilot) providers.push(`GitHub ${color.gray("→ Copilot")}`)

    console.log()
    console.log(color.bold("Authenticate Your Providers"))
    console.log()
    console.log(`   Run ${color.cyan("opencode auth login")} and select:`)
    for (const provider of providers) {
      console.log(`   ${SYMBOLS.bullet} ${provider}`)
    }
    console.log()
  }

  return 0
}
