#!/usr/bin/env node
import { Command } from "commander"
import packageJson from "../../package.json" with { type: "json" }
import { install } from "../cli/install"
import type { InstallArgs } from "../cli/types"

const VERSION = packageJson.version

const program = new Command()

program
  .name("oh-my-cortex")
  .description("Install and configure the oh-my-cortex OpenCode plugin")
  .version(VERSION, "-v, --version", "Show version number")

program
  .command("install", { isDefault: true })
  .description("Install and configure oh-my-cortex")
  .option("--no-tui", "Run in non-interactive mode")
  .option("--non-interactive", "Alias for --no-tui")
  .option("--claude <value>", "Claude subscription: no, yes, max20")
  .option("--openai <value>", "OpenAI/ChatGPT subscription: no, yes")
  .option("--gemini <value>", "Gemini integration: no, yes")
  .option("--copilot <value>", "GitHub Copilot subscription: no, yes")
  .option("--opencode-zen <value>", "OpenCode Zen access: no, yes")
  .option("--zai-coding-plan <value>", "Z.ai Coding Plan subscription: no, yes")
  .option("--kimi-for-coding <value>", "Kimi For Coding subscription: no, yes")
  .option("--opencode-go <value>", "OpenCode Go subscription: no, yes")
  .option("--vercel-ai-gateway <value>", "Vercel AI Gateway: no, yes")
  .option("--axrai <value>", "AXR AI plan: no, trial, pro, owner")
  .option("--skip-auth", "Skip authentication setup hints")
  .addHelpText("after", `
Examples:
  $ npx oh-my-cortex@latest install
  $ bunx oh-my-cortex@latest install
  $ npx oh-my-cortex@latest install --no-tui --claude=max20 --openai=yes --gemini=yes --copilot=no
  $ npx oh-my-cortex@latest install --no-tui --axrai=trial
  $ npx oh-my-cortex@latest install --no-tui --axrai=pro
  $ npx oh-my-cortex@latest install --no-tui --axrai=owner
`)
  .action(async (options) => {
    const args: InstallArgs = {
      tui: options.tui !== false && !options.nonInteractive,
      claude: options.claude,
      openai: options.openai,
      gemini: options.gemini,
      copilot: options.copilot,
      opencodeZen: options.opencodeZen,
      zaiCodingPlan: options.zaiCodingPlan,
      kimiForCoding: options.kimiForCoding,
      opencodeGo: options.opencodeGo,
      vercelAiGateway: options.vercelAiGateway,
      axrai: options.axrai,
      skipAuth: options.skipAuth ?? false,
    }

    const exitCode = await install(args)
    process.exitCode = exitCode
  })

program
  .command("version")
  .description("Show version information")
  .action(() => {
    console.log(`oh-my-cortex v${VERSION}`)
  })

await program.parseAsync()
