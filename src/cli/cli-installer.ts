import color from "picocolors"
import { PLUGIN_NAME, PUBLISHED_PACKAGE_NAME } from "../shared/plugin-identity"
import type { InstallArgs } from "./types"
import {
  addPluginToOpenCodeConfig,
  detectCurrentConfig,
  getOpenCodeVersion,
  isOpenCodeInstalled,
  writeOmxConfig,
} from "./config-manager/install-operations"
import { generateOmxConfig } from "./config-manager/generate-omx-config"
import {
  SYMBOLS,
  argsToConfig,
  detectedToInitialValues,
  formatAgentModelTable,
  formatCoexistenceNote,
  formatCommands,
  formatConfigSummary,
  formatGettingStarted,
  printBox,
  printError,
  printHeader,
  printInfo,
  printStep,
  printSuccess,
  printWarning,
  validateNonTuiArgs,
} from "./install-validators"
import { getUnsupportedOpenCodeVersionMessage } from "./minimum-opencode-version"
import { createCliPostHog, getPostHogDistinctId } from "../shared/posthog"

export async function runCliInstaller(args: InstallArgs, version: string): Promise<number> {
  const posthog = createCliPostHog()
  const distinctId = getPostHogDistinctId()
  const validation = validateNonTuiArgs(args)
  if (!validation.valid) {
    printHeader(false)
    printError("Validation failed:")
    for (const err of validation.errors) {
      console.log(`  ${SYMBOLS.bullet} ${err}`)
    }
    console.log()
    printInfo(
      `Usage: bunx ${PUBLISHED_PACKAGE_NAME} install --no-tui --claude=<no|yes|max20> --gemini=<no|yes> --copilot=<no|yes>`,
    )
    console.log()
    return 1
  }

  const detected = detectCurrentConfig()
  const isUpdate = detected.isInstalled

  printHeader(isUpdate)

  const totalSteps = 4
  let step = 1

  printStep(step++, totalSteps, "Checking OpenCode installation...")
  const installed = await isOpenCodeInstalled()
  const openCodeVersion = await getOpenCodeVersion()
  if (!installed) {
    printWarning(
      "OpenCode binary not found. Plugin will be configured, but you'll need to install OpenCode to use it.",
    )
    printInfo("Visit https://opencode.ai/docs for installation instructions")
  } else {
    printSuccess(`OpenCode ${openCodeVersion ?? ""} detected`)

    const unsupportedVersionMessage = getUnsupportedOpenCodeVersionMessage(openCodeVersion)
    if (unsupportedVersionMessage) {
      printWarning(unsupportedVersionMessage)
      try {
        posthog.capture({ distinctId, event: "install_failed", properties: { command: "install", reason: "unsupported_opencode_version", is_update: isUpdate } })
      } catch {
        // telemetry failure is non-fatal, silently ignore
      }
      try {
        await posthog.shutdown()
      } catch {
        // telemetry failure is non-fatal, silently ignore
      }
      return 1
    }
  }

  if (isUpdate) {
    const initial = detectedToInitialValues(detected)
    printInfo(`Current config: Claude=${initial.claude}, Gemini=${initial.gemini}`)
  }

  const config = argsToConfig(args)

  printStep(step++, totalSteps, `Adding ${PLUGIN_NAME} plugin...`)
  const pluginResult = await addPluginToOpenCodeConfig(version)
  if (!pluginResult.success) {
    printError(`Failed: ${pluginResult.error}`)
    try {
      posthog.capture({ distinctId, event: "install_failed", properties: { command: "install", reason: "plugin_config_write_failed", is_update: isUpdate } })
    } catch {
      // telemetry failure is non-fatal, silently ignore
    }
    try {
      await posthog.shutdown()
    } catch {
      // telemetry failure is non-fatal, silently ignore
    }
    return 1
  }
  printSuccess(
    `Plugin ${isUpdate ? "verified" : "added"} ${SYMBOLS.arrow} ${color.dim(pluginResult.configPath)}`,
  )

  printStep(step++, totalSteps, `Writing ${PLUGIN_NAME} configuration...`)
  const omxResult = writeOmxConfig(config)
  if (!omxResult.success) {
    printError(`Failed: ${omxResult.error}`)
    try {
      posthog.capture({ distinctId, event: "install_failed", properties: { command: "install", reason: "omx_config_write_failed", is_update: isUpdate } })
    } catch {
      // telemetry failure is non-fatal, silently ignore
    }
    try {
      await posthog.shutdown()
    } catch {
      // telemetry failure is non-fatal, silently ignore
    }
    return 1
  }
  printSuccess(`Config written ${SYMBOLS.arrow} ${color.dim(omxResult.configPath)}`)

  // Generate the model config to show actual agent-model assignments
  const generatedConfig = generateOmxConfig(config) as import("./model-fallback-types").GeneratedOmxConfig

  console.log()
  console.log(`${SYMBOLS.star} ${color.bold(color.green(isUpdate ? "Configuration updated!" : "Installation complete!"))}`)
  console.log(`  Restart ${color.cyan("opencode")} to activate OMX.`)
  console.log()

  // Provider summary
  printBox(formatConfigSummary(config), isUpdate ? "Updated Configuration" : "Installation Complete")

  if (!config.hasClaude) {
    printInfo(
      "Note: Chief agent performs best with Claude Opus 4.5+. " +
        "Other models work but may have reduced orchestration quality.",
    )
  }

  if (
    !config.hasClaude &&
    !config.hasOpenAI &&
    !config.hasGemini &&
    !config.hasCopilot &&
    !config.hasOpencodeZen &&
    !config.hasVercelAiGateway
  ) {
    printWarning("No model providers configured. Using opencode/big-pickle as fallback.")
  }

  // Agent-model assignment table — shows actual models matched to each agent
  printBox(formatAgentModelTable(generatedConfig), "Agent Setup")

  // Getting started guide
  printBox(formatGettingStarted(), "Getting Started")

  // Useful commands
  printBox(formatCommands(), "Commands")

  // Coexistence note
  printBox(formatCoexistenceNote(), "Coexistence")

  // Important notes
  console.log(`  ${SYMBOLS.info} ${color.bold("Important Notes")}`)
  console.log(`    ${SYMBOLS.bullet} OMX matches the ${color.bold("strongest available model")} to each agent automatically`)
  console.log(`    ${SYMBOLS.bullet} Any AI model works — OMX adapts to what you have`)
  console.log(`    ${SYMBOLS.bullet} Add more providers later by re-running ${color.cyan(`npx ${PUBLISHED_PACKAGE_NAME} install`)}`)
  console.log(`    ${SYMBOLS.bullet} Restart opencode and confirm Chief and Founder are selectable`)
  console.log()

  printInfo(
    "Anonymous telemetry is enabled by default. Disable with OMX_SEND_ANONYMOUS_TELEMETRY=0 or OMX_DISABLE_POSTHOG=1.",
  )
  console.log()

  console.log(`${SYMBOLS.star} ${color.yellow("If you found this helpful, consider starring the repo!")}`)
  console.log(
    `  ${color.dim("gh api --silent --method PUT /user/starred/michaelxer/oh-my-cortex >/dev/null 2>&1 || true")}`,
  )
  console.log()
  console.log(color.dim("OMX... Think deeper."))
  console.log()

  try {
    posthog.capture({
      distinctId,
      event: "install_completed",
      properties: {
        command: "install",
        is_update: isUpdate,
        has_claude: config.hasClaude,
        has_openai: config.hasOpenAI,
        has_gemini: config.hasGemini,
        has_copilot: config.hasCopilot,
        has_opencode_zen: config.hasOpencodeZen,
      },
    })
  } catch {
    // telemetry failure is non-fatal, silently ignore
  }
  try {
    await posthog.shutdown()
  } catch {
    // telemetry failure is non-fatal, silently ignore
  }

  if ((config.hasClaude || config.hasGemini || config.hasCopilot) && !args.skipAuth) {
    printBox(
      `Run ${color.cyan("opencode auth login")} and select your provider:\n` +
        (config.hasClaude ? `  ${SYMBOLS.bullet} Anthropic ${color.gray("→ Claude Pro/Max")}\n` : "") +
        (config.hasGemini ? `  ${SYMBOLS.bullet} Google ${color.gray("→ Gemini")}\n` : "") +
        (config.hasCopilot ? `  ${SYMBOLS.bullet} GitHub ${color.gray("→ Copilot")}` : ""),
      "Authenticate Your Providers",
    )
  }

  return 0
}
