import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { mkdirSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import type { InstallConfig } from "../types"
import { resetConfigContext } from "./config-context"
import { generateOpenCodeInstallConfig } from "./generate-opencode-install-config"

const installConfig: InstallConfig = {
  hasClaude: true,
  isMax20: true,
  hasOpenAI: true,
  hasGemini: false,
  hasCopilot: false,
  hasOpencodeZen: false,
  hasZaiCodingPlan: false,
  hasKimiForCoding: false,
  hasOpencodeGo: false,
  hasVercelAiGateway: false,
}

const noProviderInstallConfig: InstallConfig = {
  hasClaude: false,
  isMax20: false,
  hasOpenAI: false,
  hasGemini: false,
  hasCopilot: false,
  hasOpencodeZen: false,
  hasZaiCodingPlan: false,
  hasKimiForCoding: false,
  hasOpencodeGo: false,
  hasVercelAiGateway: false,
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

describe("generateOpenCodeInstallConfig", () => {
  let testConfigDir = ""

  beforeEach(() => {
    testConfigDir = join(tmpdir(), `omx-visible-config-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    mkdirSync(testConfigDir, { recursive: true })
    process.env.OPENCODE_CONFIG_DIR = testConfigDir
    resetConfigContext()
  })

  afterEach(() => {
    rmSync(testConfigDir, { recursive: true, force: true })
    resetConfigContext()
    delete process.env.OPENCODE_CONFIG_DIR
  })

  test("generates visible OpenCode agent entries for OMX primary agents", async () => {
    const config = await generateOpenCodeInstallConfig(installConfig)
    const agents = asRecord(config.agent)

    expect(Object.keys(agents)).toContain("Chief - Deepworker")
    expect(Object.keys(agents)).toContain("Founder - Deep Agent")
    expect(asRecord(agents["Chief - Deepworker"]).mode).toBe("primary")
    expect(asRecord(agents["Founder - Deep Agent"]).mode).toBe("primary")
  })

  test("keeps default Chief entry visible when no providers are configured", async () => {
    const config = await generateOpenCodeInstallConfig(noProviderInstallConfig)
    const agents = asRecord(config.agent)
    const chief = asRecord(agents["Chief - Deepworker"])

    expect(config.default_agent).toBe("Chief - Deepworker")
    expect(Object.keys(agents)).toContain("Chief - Deepworker")
    expect(chief.mode).toBe("primary")
    expect(chief.model).toBe("opencode/gpt-5-nano")
  })

  test("generates visible OpenCode MCP entries for built-in MCP visibility", async () => {
    const config = await generateOpenCodeInstallConfig(installConfig)
    const mcp = asRecord(config.mcp)

    expect(Object.keys(mcp)).toContain("context7")
    expect(Object.keys(mcp)).toContain("grep_app")
  })
})
