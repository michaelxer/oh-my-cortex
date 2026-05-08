import { describe, expect, test } from "bun:test"

import { argsToConfig, validateNonTuiArgs } from "./install-validators"
import type { InstallArgs } from "./types"

function createArgs(overrides: Partial<InstallArgs> = {}): InstallArgs {
  return {
    tui: false,
    claude: "no",
    openai: "no",
    gemini: "no",
    copilot: "no",
    opencodeZen: "no",
    zaiCodingPlan: "no",
    kimiForCoding: "no",
    opencodeGo: "no",
    skipAuth: false,
    ...overrides,
  }
}

describe("validateNonTuiArgs", () => {
  test("rejects invalid --opencode-go values", () => {
    // #given
    const args = createArgs({ opencodeGo: "maybe" as InstallArgs["opencodeGo"] })

    // #when
    const result = validateNonTuiArgs(args)

    // #then
    expect(result.valid).toBe(false)
    expect(result.errors).toContain("Invalid --opencode-go value: maybe (expected: no, yes)")
  })

  test("allows AXR AI mode without normal provider flags", () => {
    const result = validateNonTuiArgs({ tui: false, axrai: "owner" })

    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
  })

  test("rejects invalid AXR AI tier", () => {
    const result = validateNonTuiArgs(createArgs({ axrai: "plus" as InstallArgs["axrai"] }))

    expect(result.valid).toBe(false)
    expect(result.errors).toContain("Invalid --axrai value: plus (expected: no, trial, pro, owner)")
  })
})

describe("argsToConfig", () => {
  test("AXR AI mode ignores normal provider flags and records selected tier", () => {
    const config = argsToConfig(createArgs({
      axrai: "pro",
      claude: "max20",
      openai: "yes",
      gemini: "yes",
      copilot: "yes",
    }))

    expect(config.axraiTier).toBe("pro")
    expect(config.hasClaude).toBe(false)
    expect(config.hasOpenAI).toBe(false)
    expect(config.hasGemini).toBe(false)
    expect(config.hasCopilot).toBe(false)
    expect(config.isMax20).toBe(false)
  })
})
