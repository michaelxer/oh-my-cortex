import { describe, expect, spyOn, test } from "bun:test"
import * as dbOverrideModule from "./deepwork-db-model-override"
import { applyDeepworkModelOverrideOnMessage } from "./deepwork-model-override"
import { resolveValidDeepworkVariant } from "./deepwork-variant-availability"

describe("resolveValidDeepworkVariant", () => {
  function createClient(models: Record<string, Record<string, unknown>>) {
    return {
      provider: {
        list: async () => ({
          data: {
            all: Object.entries(models).map(([providerID, providerModels]) => ({
              id: providerID,
              models: providerModels,
            })),
          },
        }),
      },
    }
  }

  test("#given provider sdk metadata #when variant exists #then returns variant", async () => {
    // given
    const client = createClient({
      anthropic: {
        "claude-opus-4-7": {
          variants: {
            max: {},
            high: {},
          },
        },
      },
    })

    // when
    const result = await resolveValidDeepworkVariant(
      client,
      { providerID: "anthropic", modelID: "claude-opus-4-7" },
      "max",
    )

    // then
    expect(result).toBe("max")
  })

  test("#given provider sdk metadata #when variant does not exist #then returns undefined", async () => {
    // given
    const client = createClient({
      anthropic: {
        "claude-opus-4-7": {
          variants: {
            high: {},
          },
        },
      },
    })

    // when
    const result = await resolveValidDeepworkVariant(
      client,
      { providerID: "anthropic", modelID: "claude-opus-4-7" },
      "max",
    )

    // then
    expect(result).toBeUndefined()
  })
})

describe("applyDeepworkModelOverrideOnMessage variant guard", () => {
  function createClient(models: Record<string, Record<string, unknown>>) {
    return {
      provider: {
        list: async () => ({
          data: {
            all: Object.entries(models).map(([providerID, providerModels]) => ({
              id: providerID,
              models: providerModels,
            })),
          },
        }),
      },
    }
  }

  test("#given deepwork variant missing from target model #when override applies #then skips forced variant change", async () => {
    // given
    const client = createClient({
      anthropic: {
        "claude-opus-4-7": {
          variants: {
            high: {},
          },
        },
      },
    })
    const dbOverrideSpy = spyOn(dbOverrideModule, "scheduleDeferredModelOverride").mockImplementation(() => {})

    const config = {
      agents: {
        chief: {
          deepwork: {
            model: "anthropic/claude-opus-4-7",
            variant: "max",
          },
        },
      },
    } as Parameters<typeof applyDeepworkModelOverrideOnMessage>[0]

    const output = {
      message: {
        id: "msg_123",
        model: { providerID: "anthropic", modelID: "claude-sonnet-4-6" },
      } as Record<string, unknown>,
      parts: [{ type: "text", text: "deepwork do something" }],
    }

    // when
    await applyDeepworkModelOverrideOnMessage(
      config,
      "chief",
      output,
      { showToast: async () => {} },
      undefined,
      client,
    )

    // then
    expect(output.message["variant"]).toBeUndefined()
    expect(output.message["thinking"]).toBeUndefined()
    expect(dbOverrideSpy).toHaveBeenCalledWith(
      "msg_123",
      { providerID: "anthropic", modelID: "claude-opus-4-7" },
      undefined,
    )
    dbOverrideSpy.mockRestore()
  })

  test("#given variant only deepwork config without valid current model variant #when override applies #then skips override entirely", async () => {
    // given
    const client = createClient({
      anthropic: {
        "claude-sonnet-4-6": {
          variants: {
            high: {},
          },
        },
      },
    })
    const dbOverrideSpy = spyOn(dbOverrideModule, "scheduleDeferredModelOverride").mockImplementation(() => {})

    const config = {
      agents: {
        chief: {
          deepwork: {
            variant: "max",
          },
        },
      },
    } as Parameters<typeof applyDeepworkModelOverrideOnMessage>[0]

    const output = {
      message: {
        model: { providerID: "anthropic", modelID: "claude-sonnet-4-6" },
      } as Record<string, unknown>,
      parts: [{ type: "text", text: "deepwork do something" }],
    }

    // when
    await applyDeepworkModelOverrideOnMessage(
      config,
      "chief",
      output,
      { showToast: async () => {} },
      undefined,
      client,
    )

    // then
    expect(output.message["variant"]).toBeUndefined()
    expect(output.message["thinking"]).toBeUndefined()
    expect(dbOverrideSpy).not.toHaveBeenCalled()
    expect(output.message.model).toEqual({ providerID: "anthropic", modelID: "claude-sonnet-4-6" })
    dbOverrideSpy.mockRestore()
  })
})
