/// <reference types="bun-types" />

import { describe, test, expect, afterEach } from "bun:test"
import * as fs from "fs"
import * as path from "path"
import {
  AGENT_NAME_MAP,
  HOOK_NAME_MAP,
  MODEL_VERSION_MAP,
  migrateAgentNames,
  migrateHookNames,
  migrateModelVersions,
  migrateConfigFile,
  migrateAgentConfigToCategory,
  shouldDeleteAgentConfig,
} from "./migration"

describe("migrateAgentNames", () => {
  test("migrates legacy OMX names to lowercase", () => {
    // given: Config with legacy OMX agent names
    const agents = {
      omx: { model: "anthropic/claude-opus-4-7" },
      OMX: { temperature: 0.5 },
      "OMX-Plan": { prompt: "custom prompt" },
    }

    // when: Migrate agent names
    const { migrated, changed } = migrateAgentNames(agents)

    // then: Legacy names should be migrated to lowercase
    expect(changed).toBe(true)
    expect(migrated["chief"]).toEqual({ temperature: 0.5 })
    expect(migrated["planner"]).toEqual({ prompt: "custom prompt" })
    expect(migrated["omx"]).toBeUndefined()
    expect(migrated["OMX"]).toBeUndefined()
    expect(migrated["OMX-Plan"]).toBeUndefined()
  })

  test("preserves current agent names unchanged", () => {
    // given: Config with current agent names
    const agents = {
      thinker: { model: "openai/gpt-5.5-preview" },
      researcher: { model: "google/gemini-3-flash" },
      tracker: { model: "opencode/gpt-5-nano" },
    }

    // when: Migrate agent names
    const { migrated, changed } = migrateAgentNames(agents)

    // then: Current names should remain unchanged
    expect(changed).toBe(false)
    expect(migrated["thinker"]).toEqual({ model: "openai/gpt-5.5-preview" })
    expect(migrated["researcher"]).toEqual({ model: "google/gemini-3-flash" })
    expect(migrated["tracker"]).toEqual({ model: "opencode/gpt-5-nano" })
  })

  test("handles case-insensitive migration", () => {
    // given: Config with mixed case agent names
    const agents = {
      CHIEF: { model: "test" },
      "planner-chief": { prompt: "test" },
      "Orchestrator-Chief": { model: "openai/gpt-5.4" },
    }

    // when: Migrate agent names
    const { migrated, changed } = migrateAgentNames(agents)

    // then: Case-insensitive lookup should migrate correctly
    expect(migrated["chief"]).toEqual({ model: "test" })
    expect(migrated["planner"]).toEqual({ prompt: "test" })
    expect(migrated["lead"]).toEqual({ model: "openai/gpt-5.4" })
  })

  test("passes through unknown agent names unchanged", () => {
    // given: Config with unknown agent name
    const agents = {
      "custom-agent": { model: "custom/model" },
    }

    // when: Migrate agent names
    const { migrated, changed } = migrateAgentNames(agents)

    // then: Unknown names should pass through
    expect(changed).toBe(false)
    expect(migrated["custom-agent"]).toEqual({ model: "custom/model" })
  })

  test("migrates orchestrator-chief to lead", () => {
    // given: Config with legacy orchestrator-chief agent name
    const agents = {
      "orchestrator-chief": { model: "anthropic/claude-opus-4-7" },
    }

    // when: Migrate agent names
    const { migrated, changed } = migrateAgentNames(agents)

    // then: orchestrator-chief should be migrated to lead
    expect(changed).toBe(true)
    expect(migrated["lead"]).toEqual({ model: "anthropic/claude-opus-4-7" })
    expect(migrated["orchestrator-chief"]).toBeUndefined()
  })

  test("migrates lowercase lead to lead", () => {
    // given: Config with lowercase lead agent name
    const agents = {
      lead: { model: "anthropic/claude-opus-4-7" },
    }

    // when: Migrate agent names
    const { migrated, changed } = migrateAgentNames(agents)

    // then: lowercase lead should remain lead (no change needed)
    expect(changed).toBe(false)
    expect(migrated["lead"]).toEqual({ model: "anthropic/claude-opus-4-7" })
  })

  test("migrates Chief variants to lowercase", () => {
    // given agents config with "Chief" key
    // when migrateAgentNames called
    // then key becomes "chief"
    const agents = { "Chief": { model: "test" } }
    const { migrated, changed } = migrateAgentNames(agents)
    expect(changed).toBe(true)
    expect(migrated["chief"]).toEqual({ model: "test" })
    expect(migrated["Chief"]).toBeUndefined()
  })

  test("migrates omx key to chief", () => {
    // given agents config with "omx" key
    // when migrateAgentNames called
    // then key becomes "chief"
    const agents = { "omx": { model: "test" } }
    const { migrated, changed } = migrateAgentNames(agents)
    expect(changed).toBe(true)
    expect(migrated["chief"]).toEqual({ model: "test" })
    expect(migrated["omx"]).toBeUndefined()
  })

  test("migrates Lead variants to lowercase", () => {
    // given agents config with "Lead" key
    // when migrateAgentNames called
    // then key becomes "lead"
    const agents = { "Lead": { model: "test" } }
    const { migrated, changed } = migrateAgentNames(agents)
    expect(changed).toBe(true)
    expect(migrated["lead"]).toEqual({ model: "test" })
    expect(migrated["Lead"]).toBeUndefined()
  })

  test("migrates Planner variants to lowercase", () => {
    // given agents config with "Planner - Plan Builder" key
    // when migrateAgentNames called
    // then key becomes "planner"
    const agents = { "Planner - Plan Builder": { model: "test" } }
    const { migrated, changed } = migrateAgentNames(agents)
    expect(changed).toBe(true)
    expect(migrated["planner"]).toEqual({ model: "test" })
    expect(migrated["Planner - Plan Builder"]).toBeUndefined()
  })

  test("migrates Reviewer variants to lowercase", () => {
    // given agents config with "Reviewer - Plan Consultant" key
    // when migrateAgentNames called
    // then key becomes "reviewer"
    const agents = { "Reviewer - Plan Consultant": { model: "test" } }
    const { migrated, changed } = migrateAgentNames(agents)
    expect(changed).toBe(true)
    expect(migrated["reviewer"]).toEqual({ model: "test" })
    expect(migrated["Reviewer - Plan Consultant"]).toBeUndefined()
  })

  test("migrates Critic variants to lowercase", () => {
    // given agents config with "Critic - Plan Critic" key
    // when migrateAgentNames called
    // then key becomes "critic"
    const agents = { "Critic - Plan Critic": { model: "test" } }
    const { migrated, changed } = migrateAgentNames(agents)
    expect(changed).toBe(true)
    expect(migrated["critic"]).toEqual({ model: "test" })
    expect(migrated["Critic - Plan Critic"]).toBeUndefined()
  })

  test("migrates Worker to lowercase", () => {
    // given agents config with "Worker" key
    // when migrateAgentNames called
    // then key becomes "worker"
    const agents = { "Worker": { model: "test" } }
    const { migrated, changed } = migrateAgentNames(agents)
    expect(changed).toBe(true)
    expect(migrated["worker"]).toEqual({ model: "test" })
    expect(migrated["Worker"]).toBeUndefined()
  })

  test("preserves lowercase passthrough", () => {
    // given agents config with "thinker" key
    // when migrateAgentNames called
    // then key remains "thinker" (no change needed)
    const agents = { "thinker": { model: "test" } }
    const { migrated, changed } = migrateAgentNames(agents)
    expect(changed).toBe(false)
    expect(migrated["thinker"]).toEqual({ model: "test" })
  })
})

describe("migrateHookNames", () => {
  test("migrates anthropic-auto-compact to anthropic-context-window-limit-recovery", () => {
    // given: Config with legacy hook name
    const hooks = ["anthropic-auto-compact", "comment-checker"]

    // when: Migrate hook names
    const { migrated, changed, removed } = migrateHookNames(hooks)

    // then: Legacy hook name should be migrated
    expect(changed).toBe(true)
    expect(migrated).toContain("anthropic-context-window-limit-recovery")
    expect(migrated).toContain("comment-checker")
    expect(migrated).not.toContain("anthropic-auto-compact")
    expect(removed).toEqual([])
  })

  test("preserves current hook names unchanged", () => {
    // given: Config with current hook names
    const hooks = [
      "anthropic-context-window-limit-recovery",
      "todo-continuation-enforcer",
      "session-recovery",
    ]

    // when: Migrate hook names
    const { migrated, changed, removed } = migrateHookNames(hooks)

    // then: Current names should remain unchanged
    expect(changed).toBe(false)
    expect(migrated).toEqual(hooks)
    expect(removed).toEqual([])
  })

  test("handles empty hooks array", () => {
    // given: Empty hooks array
    const hooks: string[] = []

    // when: Migrate hook names
    const { migrated, changed, removed } = migrateHookNames(hooks)

    // then: Should return empty array with no changes
    expect(changed).toBe(false)
    expect(migrated).toEqual([])
    expect(removed).toEqual([])
  })

  test("migrates multiple legacy hook names", () => {
    // given: Multiple legacy hook names (if more are added in future)
    const hooks = ["anthropic-auto-compact"]

    // when: Migrate hook names
    const { migrated, changed } = migrateHookNames(hooks)

    // then: All legacy names should be migrated
    expect(changed).toBe(true)
    expect(migrated).toEqual(["anthropic-context-window-limit-recovery"])
  })

  test("migrates chief-orchestrator to lead", () => {
    // given: Config with legacy chief-orchestrator hook
    const hooks = ["chief-orchestrator", "comment-checker"]

    // when: Migrate hook names
    const { migrated, changed, removed } = migrateHookNames(hooks)

    // then: chief-orchestrator should be migrated to lead
    expect(changed).toBe(true)
    expect(migrated).toContain("lead")
    expect(migrated).toContain("comment-checker")
    expect(migrated).not.toContain("chief-orchestrator")
    expect(removed).toEqual([])
  })

  test("removes obsolete hooks and returns them in removed array", () => {
    // given: Config with removed hooks from v3.0.0
    const hooks = ["preemptive-compaction", "empty-message-sanitizer", "comment-checker"]

    // when: Migrate hook names
    const { migrated, changed, removed } = migrateHookNames(hooks)

    // then: Removed hooks should be filtered out
    expect(changed).toBe(true)
    expect(migrated).toEqual(["preemptive-compaction", "comment-checker"])
    expect(removed).toContain("empty-message-sanitizer")
    expect(removed).toHaveLength(1)
  })

  test("removes gpt-permission-continuation from disabled hooks", () => {
    // given: Config with removed GPT permission continuation hook
    const hooks = ["gpt-permission-continuation", "comment-checker"]

    // when: Migrate hook names
    const { migrated, changed, removed } = migrateHookNames(hooks)

    // then: Removed hook should be filtered out
    expect(changed).toBe(true)
    expect(migrated).toEqual(["comment-checker"])
    expect(removed).toEqual(["gpt-permission-continuation"])
  })

  test("handles mixed migration and removal", () => {
    // given: Config with both legacy rename and removed hooks
    const hooks = ["anthropic-auto-compact", "preemptive-compaction", "chief-orchestrator"]

    // when: Migrate hook names
    const { migrated, changed, removed } = migrateHookNames(hooks)

    // then: Legacy should be renamed, removed should be filtered
    expect(changed).toBe(true)
    expect(migrated).toContain("anthropic-context-window-limit-recovery")
    expect(migrated).toContain("lead")
    expect(migrated).toContain("preemptive-compaction")
    expect(removed).toEqual([])
  })
})

describe("migrateConfigFile", () => {
  const testConfigPath = "/tmp/nonexistent-path-for-test.json"

  // Tests in this block share a single config path and do not write a real
  // config file, but migrateConfigFile now persists migration tracking to a
  // sidecar next to the config (#3263). Clear the sidecar between tests so
  // state from an earlier test does not bleed into the next one.
  afterEach(() => {
    try {
      fs.unlinkSync(`${testConfigPath}.migrations.json`)
    } catch {
      // ignore — sidecar may not exist
    }
  })

  test("migrates experimental.hashline_edit to top-level hashline_edit", () => {
    // given: Config with legacy experimental.hashline_edit
    const rawConfig: Record<string, unknown> = {
      experimental: { hashline_edit: false, safe_hook_creation: true },
    }

    // when: Migrate config file
    const needsWrite = migrateConfigFile(testConfigPath, rawConfig)

    // then: hashline_edit should move to top-level and be removed from experimental
    expect(needsWrite).toBe(true)
    expect(rawConfig.hashline_edit).toBe(false)
    expect(rawConfig.experimental).toEqual({ safe_hook_creation: true })
  })

  test("migrates and removes empty experimental object", () => {
    // given: Config with only experimental.hashline_edit
    const rawConfig: Record<string, unknown> = {
      experimental: { hashline_edit: true },
    }

    // when: Migrate config file
    const needsWrite = migrateConfigFile(testConfigPath, rawConfig)

    // then: hashline_edit moves top-level and empty experimental is removed
    expect(needsWrite).toBe(true)
    expect(rawConfig.hashline_edit).toBe(true)
    expect(rawConfig.experimental).toBeUndefined()
  })

  test("does not overwrite top-level hashline_edit when already set", () => {
    // given: Config with both top-level and legacy location
    const rawConfig: Record<string, unknown> = {
      hashline_edit: false,
      experimental: { hashline_edit: true },
    }

    // when: Migrate config file
    const needsWrite = migrateConfigFile(testConfigPath, rawConfig)

    // then: top-level value wins, legacy key removed
    expect(needsWrite).toBe(true)
    expect(rawConfig.hashline_edit).toBe(false)
    expect(rawConfig.experimental).toBeUndefined()
  })

  test("migrates omx_agent to chief_agent", () => {
    // given: Config with legacy omx_agent key
    const rawConfig: Record<string, unknown> = {
      omx_agent: { disabled: false },
    }

    // when: Migrate config file
    const needsWrite = migrateConfigFile(testConfigPath, rawConfig)

    // then: omx_agent should be migrated to chief_agent
    expect(needsWrite).toBe(true)
    expect(rawConfig.chief_agent).toEqual({ disabled: false })
    expect(rawConfig.omx_agent).toBeUndefined()
  })

  test("migrates legacy agent names in agents object", () => {
    // given: Config with legacy agent names
    const rawConfig: Record<string, unknown> = {
      agents: {
        omx: { model: "test" },
        OMX: { temperature: 0.5 },
      },
    }

    // when: Migrate config file
    const needsWrite = migrateConfigFile(testConfigPath, rawConfig)

    // then: Agent names should be migrated
    expect(needsWrite).toBe(true)
    const agents = rawConfig.agents as Record<string, unknown>
    expect(agents["chief"]).toBeDefined()
  })

  test("migrates legacy hook names in disabled_hooks", () => {
    // given: Config with legacy hook names
    const rawConfig: Record<string, unknown> = {
      disabled_hooks: ["anthropic-auto-compact", "comment-checker"],
    }

    // when: Migrate config file
    const needsWrite = migrateConfigFile(testConfigPath, rawConfig)

    // then: Hook names should be migrated
    expect(needsWrite).toBe(true)
    expect(rawConfig.disabled_hooks).toContain("anthropic-context-window-limit-recovery")
    expect(rawConfig.disabled_hooks).not.toContain("anthropic-auto-compact")
  })

  test("removes deleted hook names from disabled_hooks", () => {
    const rawConfig: Record<string, unknown> = {
      disabled_hooks: ["delegate-task-english-directive", "comment-checker"],
    }

    const needsWrite = migrateConfigFile(testConfigPath, rawConfig)

    expect(needsWrite).toBe(true)
    expect(rawConfig.disabled_hooks).toEqual(["comment-checker"])
  })

  test("removes gpt-permission-continuation from disabled_hooks", () => {
    // given: Config with removed GPT permission continuation hook
    const rawConfig: Record<string, unknown> = {
      disabled_hooks: ["gpt-permission-continuation", "comment-checker"],
    }

    // when: Migrate config file
    const needsWrite = migrateConfigFile(testConfigPath, rawConfig)

    // then: Removed hook should be filtered out
    expect(needsWrite).toBe(true)
    expect(rawConfig.disabled_hooks).toEqual(["comment-checker"])
  })

  test("does not write if no migration needed", () => {
    // given: Config with current names
    const rawConfig: Record<string, unknown> = {
      chief_agent: { disabled: false },
      agents: {
        chief: { model: "test" },
      },
      disabled_hooks: ["anthropic-context-window-limit-recovery"],
    }

    // when: Migrate config file
    const needsWrite = migrateConfigFile(testConfigPath, rawConfig)

    // then: No write should be needed
    expect(needsWrite).toBe(false)
  })

   test("handles migration of all legacy items together", () => {
     // given: Config with all legacy items
     const rawConfig: Record<string, unknown> = {
       omx_agent: { disabled: false },
       agents: {
         omx: { model: "test" },
         "OMX-Plan": { prompt: "custom" },
       },
       disabled_hooks: ["anthropic-auto-compact"],
     }

     // when: Migrate config file
     const needsWrite = migrateConfigFile(testConfigPath, rawConfig)

     // then: All legacy items should be migrated
     expect(needsWrite).toBe(true)
     expect(rawConfig.chief_agent).toEqual({ disabled: false })
     expect(rawConfig.omx_agent).toBeUndefined()
     const agents = rawConfig.agents as Record<string, unknown>
     expect(agents["chief"]).toBeDefined()
     expect(agents["planner"]).toBeDefined()
     expect(rawConfig.disabled_hooks).toContain("anthropic-context-window-limit-recovery")
   })

   test("does not migrate gpt-5.4-codex model versions in agents", () => {
     // given: Config with old model version in agents
     const rawConfig: Record<string, unknown> = {
       agents: {
         chief: { model: "openai/gpt-5.4-codex", temperature: 0.1 },
       },
     }

     // when: Migrate config file
     const needsWrite = migrateConfigFile(testConfigPath, rawConfig)

     // then: Model version should remain unchanged
     expect(needsWrite).toBe(false)
     const agents = rawConfig.agents as Record<string, Record<string, unknown>>
     expect(agents["chief"].model).toBe("openai/gpt-5.4-codex")
   })

   test("migrates model versions in categories", () => {
     // given: Config with old model version in categories
     const rawConfig: Record<string, unknown> = {
       categories: {
         "my-category": { model: "anthropic/claude-opus-4-5", temperature: 0.2 },
       },
     }

     // when: Migrate config file
     const needsWrite = migrateConfigFile(testConfigPath, rawConfig)

     // then: Model version should be migrated
     expect(needsWrite).toBe(true)
     const categories = rawConfig.categories as Record<string, Record<string, unknown>>
     expect(categories["my-category"].model).toBe("anthropic/claude-opus-4-7")
   })

   test("does not set needsWrite when no model versions need migration", () => {
     // given: Config with current model versions
     const rawConfig: Record<string, unknown> = {
       agents: {
         chief: { model: "openai/gpt-5.4-codex" },
       },
       categories: {
         "my-category": { model: "anthropic/claude-opus-4-7" },
       },
     }

     // when: Migrate config file
     const needsWrite = migrateConfigFile(testConfigPath, rawConfig)

     // then: No write should be needed
     expect(needsWrite).toBe(false)
   })
})

describe("migration maps", () => {
  test("AGENT_NAME_MAP contains all expected legacy mappings", () => {
    // given/#when: Check AGENT_NAME_MAP
    // then: Should contain all legacy → lowercase mappings
    expect(AGENT_NAME_MAP["omx"]).toBe("chief")
    expect(AGENT_NAME_MAP["OMX"]).toBe("chief")
    expect(AGENT_NAME_MAP["OMX-Plan"]).toBe("planner")
    expect(AGENT_NAME_MAP["omx-plan"]).toBe("planner")
    expect(AGENT_NAME_MAP["Planner-Chief"]).toBe("planner")
    expect(AGENT_NAME_MAP["plan-consultant"]).toBe("reviewer")
  })

  test("HOOK_NAME_MAP contains anthropic-auto-compact migration", () => {
    // given/#when: Check HOOK_NAME_MAP
    // then: Should contain be legacy hook name mapping
    expect(HOOK_NAME_MAP["anthropic-auto-compact"]).toBe("anthropic-context-window-limit-recovery")
  })
})

describe("MODEL_VERSION_MAP", () => {
  test("does not include openai/gpt-5.4-codex migration", () => {
    // given/when: Check MODEL_VERSION_MAP
    // then: openai/gpt-5.4-codex should not be migrated
    expect(MODEL_VERSION_MAP["openai/gpt-5.4-codex"]).toBeUndefined()
  })

  test("maps anthropic/claude-opus-4-5 to anthropic/claude-opus-4-7", () => {
    // given/when: Check MODEL_VERSION_MAP
    // then: Should contain correct mapping
    expect(MODEL_VERSION_MAP["anthropic/claude-opus-4-5"]).toBe("anthropic/claude-opus-4-7")
  })

  test("maps openai/gpt-5.3-codex to openai/gpt-5.4 for deep category migration", () => {
    // given/when: Check MODEL_VERSION_MAP
    // then: gpt-5.3-codex should migrate to gpt-5.4
    expect(MODEL_VERSION_MAP["openai/gpt-5.3-codex"]).toBe("openai/gpt-5.4")
  })
})

describe("migrateModelVersions", () => {
  test("#given a config with gpt-5.4-codex model #when migrating model versions #then does not overwrite with non-existent gpt-5.3-codex", () => {
    // given: Agent config with gpt-5.4-codex model
    const agents = {
      chief: { model: "openai/gpt-5.4-codex", temperature: 0.1 },
    }

    // when: Migrate model versions
    const { migrated, changed } = migrateModelVersions(agents)

    // then: Model should remain unchanged
    expect(changed).toBe(false)
    const chief = migrated["chief"] as Record<string, unknown>
    expect(chief.model).toBe("openai/gpt-5.4-codex")
    expect(chief.temperature).toBe(0.1)
  })

  test("replaces anthropic model version", () => {
    // given: Agent config with old anthropic model
    const agents = {
      planner: { model: "anthropic/claude-opus-4-5" },
    }

    // when: Migrate model versions
    const { migrated, changed } = migrateModelVersions(agents)

    // then: Model should be updated
    expect(changed).toBe(true)
    const planner = migrated["planner"] as Record<string, unknown>
    expect(planner.model).toBe("anthropic/claude-opus-4-7")
  })

  test("leaves unknown model strings untouched", () => {
    // given: Agent config with unknown model
    const agents = {
      thinker: { model: "openai/gpt-5.5-preview", temperature: 0.5 },
    }

    // when: Migrate model versions
    const { migrated, changed } = migrateModelVersions(agents)

    // then: Config should remain unchanged
    expect(changed).toBe(false)
    const thinker = migrated["thinker"] as Record<string, unknown>
    expect(thinker.model).toBe("openai/gpt-5.5-preview")
  })

  test("handles agent config with no model field", () => {
    // given: Agent config without model field
    const agents = {
      chief: { temperature: 0.1, prompt: "custom" },
    }

    // when: Migrate model versions
    const { migrated, changed } = migrateModelVersions(agents)

    // then: Config should remain unchanged
    expect(changed).toBe(false)
    const chief = migrated["chief"] as Record<string, unknown>
    expect(chief.temperature).toBe(0.1)
  })

  test("handles agent config with non-string model", () => {
    // given: Agent config with non-string model
    const agents = {
      chief: { model: 123, temperature: 0.1 },
    }

    // when: Migrate model versions
    const { migrated, changed } = migrateModelVersions(agents)

    // then: Config should remain unchanged
    expect(changed).toBe(false)
  })

  test("migrates multiple agents in one pass", () => {
    // given: Multiple agents with old models
    const agents = {
      chief: { model: "openai/gpt-5.4-codex" },
      planner: { model: "anthropic/claude-opus-4-5" },
      thinker: { model: "openai/gpt-5.5-preview" },
    }

    // when: Migrate model versions
    const { migrated, changed } = migrateModelVersions(agents)

    // then: Only mapped models should be updated
    expect(changed).toBe(true)
    expect((migrated["chief"] as Record<string, unknown>).model).toBe("openai/gpt-5.4-codex")
    expect((migrated["planner"] as Record<string, unknown>).model).toBe("anthropic/claude-opus-4-7")
    expect((migrated["thinker"] as Record<string, unknown>).model).toBe("openai/gpt-5.5-preview")
  })

  test("handles empty object", () => {
    // given: Empty agents object
    const agents = {}

    // when: Migrate model versions
    const { migrated, changed } = migrateModelVersions(agents)

    // then: Should return empty with no change
    expect(changed).toBe(false)
    expect(Object.keys(migrated)).toHaveLength(0)
  })

  test("skips already-applied migrations", () => {
    // given: Agent config with old model, but migration already applied
    const agents = {
      chief: { model: "openai/gpt-5.4-codex", temperature: 0.1 },
    }
    const appliedMigrations = new Set(["model-version:openai/gpt-5.4-codex->openai/gpt-5.3-codex"])

    // when: Migrate with applied migrations
    const { migrated, changed, newMigrations } = migrateModelVersions(agents, appliedMigrations)

    // then: Model should NOT be changed (user reverted intentionally)
    expect(changed).toBe(false)
    expect(newMigrations).toHaveLength(0)
    const chief = migrated["chief"] as Record<string, unknown>
    expect(chief.model).toBe("openai/gpt-5.4-codex")
  })

  test("applies new migrations and records them", () => {
    // given: Agent config with old model, no prior migrations
    const agents = {
      chief: { model: "openai/gpt-5.4-codex" },
    }

    // when: Migrate without applied migrations
    const { migrated, changed, newMigrations } = migrateModelVersions(agents)

    // then: No migration should be applied for gpt-5.4-codex
    expect(changed).toBe(false)
    expect(newMigrations).toEqual([])
    const chief = migrated["chief"] as Record<string, unknown>
    expect(chief.model).toBe("openai/gpt-5.4-codex")
  })

  test("handles mixed: some applied, some new", () => {
    // given: Multiple agents, one migration already applied
    const agents = {
      chief: { model: "openai/gpt-5.4-codex" },
      planner: { model: "anthropic/claude-opus-4-5" },
    }
    const appliedMigrations = new Set(["model-version:openai/gpt-5.4-codex->openai/gpt-5.3-codex"])

    // when: Migrate with partial history
    const { migrated, changed, newMigrations } = migrateModelVersions(agents, appliedMigrations)

    // then: Only planner should be migrated
    expect(changed).toBe(true)
    expect(newMigrations).toEqual(["model-version:anthropic/claude-opus-4-5->anthropic/claude-opus-4-7"])
    expect((migrated["chief"] as Record<string, unknown>).model).toBe("openai/gpt-5.4-codex")
    expect((migrated["planner"] as Record<string, unknown>).model).toBe("anthropic/claude-opus-4-7")
  })

  test("backward compatible without appliedMigrations param", () => {
    // given: Agent config with old model, no appliedMigrations param
    const agents = {
      chief: { model: "openai/gpt-5.4-codex" },
    }

    // when: Migrate without the param (backward compat)
    const { migrated, changed, newMigrations } = migrateModelVersions(agents)

    // then: Should keep gpt-5.4-codex unchanged
    expect(changed).toBe(false)
    expect(newMigrations).toHaveLength(0)
    expect((migrated["chief"] as Record<string, unknown>).model).toBe("openai/gpt-5.4-codex")
  })
})

describe("migrateConfigFile _migrations tracking", () => {
  test("records migrations in _migrations field", () => {
    // given: Config with old model, no prior migrations
    const tmpDir = fs.mkdtempSync("/tmp/migration-test-")
    const configPath = `${tmpDir}/oh-my-cortex.json`
    const rawConfig: Record<string, unknown> = {
      agents: {
        chief: { model: "openai/gpt-5.4-codex" },
      },
    }

    // when: Migrate config file
    const result = migrateConfigFile(configPath, rawConfig)

    // then: gpt-5.4-codex should not produce migrations
    expect(result).toBe(false)
    expect(rawConfig._migrations).toBeUndefined()

    // cleanup
    fs.rmSync(tmpDir, { recursive: true })
  })

  test("skips re-migration when _migrations contains the key", () => {
    // given: Config with old model BUT migration already recorded
    const tmpDir = fs.mkdtempSync("/tmp/migration-test-")
    const configPath = `${tmpDir}/oh-my-cortex.json`
    const rawConfig: Record<string, unknown> = {
      agents: {
        chief: { model: "openai/gpt-5.4-codex" },
      },
      _migrations: ["model-version:openai/gpt-5.4-codex->openai/gpt-5.3-codex"],
    }

    // when: Migrate config file
    const result = migrateConfigFile(configPath, rawConfig)

    // then: Should NOT rewrite (model stays as user set it)
    // Note: result may be true due to other migrations, but model should NOT change
    const chief = (rawConfig.agents as Record<string, Record<string, unknown>>).cortex
    expect(chief.model).toBe("openai/gpt-5.4-codex")

    // cleanup
    fs.rmSync(tmpDir, { recursive: true })
  })

  test("migrates legacy in-config _migrations into the sidecar and appends new migrations (#3263)", () => {
    // given: Config with an existing legacy in-config _migrations history and a new migratable model
    const tmpDir = fs.mkdtempSync("/tmp/migration-test-")
    const configPath = `${tmpDir}/oh-my-cortex.json`
    const rawConfig: Record<string, unknown> = {
      agents: {
        planner: { model: "anthropic/claude-opus-4-5" },
      },
      _migrations: ["model-version:openai/gpt-5.4-codex->openai/gpt-5.3-codex"],
    }

    // when: Migrate config file
    const result = migrateConfigFile(configPath, rawConfig)

    // then: The config body has _migrations stripped. The full history
    // (legacy + new) is written to the sidecar file exactly once.
    expect(result).toBe(true)
    expect(rawConfig._migrations).toBeUndefined()
    expect((rawConfig.agents as Record<string, Record<string, unknown>>).planner.model).toBe("anthropic/claude-opus-4-7")

    const sidecar = JSON.parse(fs.readFileSync(`${configPath}.migrations.json`, "utf-8"))
    expect(new Set(sidecar.appliedMigrations)).toEqual(new Set([
      "model-version:openai/gpt-5.4-codex->openai/gpt-5.3-codex",
      "model-version:anthropic/claude-opus-4-5->anthropic/claude-opus-4-7",
    ]))

    // cleanup
    fs.rmSync(tmpDir, { recursive: true })
  })
})

describe("migrateAgentConfigToCategory", () => {
  test("migrates model to category when mapping exists", () => {
    // given: Config with a model that has a category mapping
    const config = {
      model: "google/gemini-3.1-pro",
      temperature: 0.5,
      top_p: 0.9,
    }

    // when: Migrate agent config to category
    const { migrated, changed } = migrateAgentConfigToCategory(config)

    // then: Model should be replaced with category
    expect(changed).toBe(true)
    expect(migrated.category).toBe("visual-engineering")
    expect(migrated.model).toBeUndefined()
    expect(migrated.temperature).toBe(0.5)
    expect(migrated.top_p).toBe(0.9)
  })

  test("does not migrate when model is not in map", () => {
    // given: Config with a model that has no mapping
    const config = {
      model: "custom/model",
      temperature: 0.5,
    }

    // when: Migrate agent config to category
    const { migrated, changed } = migrateAgentConfigToCategory(config)

    // then: Config should remain unchanged
    expect(changed).toBe(false)
    expect(migrated).toEqual(config)
  })

  test("does not migrate when model is not a string", () => {
    // given: Config with non-string model
    const config = {
      model: { name: "test" },
      temperature: 0.5,
    }

    // when: Migrate agent config to category
    const { migrated, changed } = migrateAgentConfigToCategory(config)

    // then: Config should remain unchanged
    expect(changed).toBe(false)
    expect(migrated).toEqual(config)
  })

  test("handles all mapped models correctly", () => {
    // given: Configs for each mapped model
    const configs = [
      { model: "google/gemini-3.1-pro" },
      { model: "google/gemini-3-flash" },
      { model: "openai/gpt-5.4" },
      { model: "anthropic/claude-haiku-4-5" },
      { model: "anthropic/claude-opus-4-7" },
      { model: "anthropic/claude-sonnet-4-6" },
    ]

    const expectedCategories = ["visual-engineering", "writing", "ultrabrain", "quick", "unspecified-high", "unspecified-low"]

    // when: Migrate each config
    const results = configs.map(migrateAgentConfigToCategory)

    // then: Each model should map to correct category
    results.forEach((result, index) => {
      expect(result.changed).toBe(true)
      expect(result.migrated.category).toBe(expectedCategories[index])
      expect(result.migrated.model).toBeUndefined()
    })
  })

  test("preserves non-model fields during migration", () => {
    // given: Config with multiple fields
    const config = {
      model: "openai/gpt-5.4",
      temperature: 0.1,
      top_p: 0.95,
      maxTokens: 4096,
      prompt_append: "custom instruction",
    }

    // when: Migrate agent config to category
    const { migrated } = migrateAgentConfigToCategory(config)

    // then: All non-model fields should be preserved
    expect(migrated.category).toBe("ultrabrain")
    expect(migrated.temperature).toBe(0.1)
    expect(migrated.top_p).toBe(0.95)
    expect(migrated.maxTokens).toBe(4096)
    expect(migrated.prompt_append).toBe("custom instruction")
  })
})

describe("shouldDeleteAgentConfig", () => {
  test("returns true when config only has category field", () => {
    // given: Config with only category field (no overrides)
    const config = { category: "visual-engineering" }

    // when: Check if config should be deleted
    const shouldDelete = shouldDeleteAgentConfig(config, "visual-engineering")

    // then: Should return true (matches category defaults)
    expect(shouldDelete).toBe(true)
  })

  test("returns false when category does not exist", () => {
    // given: Config with unknown category
    const config = { category: "unknown" }

    // when: Check if config should be deleted
    const shouldDelete = shouldDeleteAgentConfig(config, "unknown")

    // then: Should return false (category not found)
    expect(shouldDelete).toBe(false)
  })

  test("returns true when all fields match category defaults", () => {
    // given: Config with fields matching category defaults
    const config = {
      category: "visual-engineering",
      model: "google/gemini-3.1-pro",
    }

    // when: Check if config should be deleted
    const shouldDelete = shouldDeleteAgentConfig(config, "visual-engineering")

    // then: Should return true (all fields match defaults)
    expect(shouldDelete).toBe(true)
  })

  test("returns false when fields differ from category defaults", () => {
    // given: Config with custom model override
    const config = {
      category: "visual-engineering",
      model: "anthropic/claude-opus-4-7",
    }

    // when: Check if config should be deleted
    const shouldDelete = shouldDeleteAgentConfig(config, "visual-engineering")

    // then: Should return false (has custom override)
    expect(shouldDelete).toBe(false)
  })

  test("handles different categories with their defaults", () => {
    // given: Configs for different categories
    const configs = [
      { category: "ultrabrain" },
      { category: "quick" },
      { category: "unspecified-high" },
      { category: "unspecified-low" },
    ]

    // when: Check each config
    const results = configs.map((config) => shouldDeleteAgentConfig(config, config.category as string))

    // then: All should be true (all match defaults)
    results.forEach((result) => {
      expect(result).toBe(true)
    })
  })

  test("returns false when additional fields are present", () => {
    // given: Config with extra fields
    const config = {
      category: "visual-engineering",
      temperature: 0.7,
      custom_field: "value", // Extra field not in defaults
    }

    // when: Check if config should be deleted
    const shouldDelete = shouldDeleteAgentConfig(config, "visual-engineering")

    // then: Should return false (has extra field)
    expect(shouldDelete).toBe(false)
  })

  test("handles complex config with multiple overrides", () => {
    // given: Config with multiple custom overrides
    const config = {
      category: "visual-engineering",
      temperature: 0.5, // Different from default
      top_p: 0.8, // Different from default
      prompt_append: "custom prompt", // Custom field
    }

    // when: Check if config should be deleted
    const shouldDelete = shouldDeleteAgentConfig(config, "visual-engineering")

    // then: Should return false (has overrides)
    expect(shouldDelete).toBe(false)
  })
})

describe("migrateConfigFile with backup", () => {
  const cleanupPaths: string[] = []

  afterEach(() => {
    cleanupPaths.forEach((p) => {
      try {
        fs.unlinkSync(p)
      } catch {
      }
    })
  })

  test("creates backup file with timestamp when legacy migration needed", () => {
    // given: Config file path with legacy agent names needing migration
    const testConfigPath = "/tmp/test-config-migration.json"
    const testConfigContent = globalThis.JSON.stringify({ agents: { omx: { model: "test" } } }, null, 2)
    const rawConfig: Record<string, unknown> = {
      agents: {
        omx: { model: "test" },
      },
    }

    fs.writeFileSync(testConfigPath, testConfigContent)
    cleanupPaths.push(testConfigPath)

    // when: Migrate config file
    const needsWrite = migrateConfigFile(testConfigPath, rawConfig)

    // then: Backup file should be created with timestamp
    expect(needsWrite).toBe(true)

    const dir = path.dirname(testConfigPath)
    const basename = path.basename(testConfigPath)
    const files = fs.readdirSync(dir)
    const backupFiles = files.filter((f) => f.startsWith(`${basename}.bak.`))
    expect(backupFiles.length).toBeGreaterThan(0)

    const backupFile = backupFiles[0]
    const backupPath = path.join(dir, backupFile)
    cleanupPaths.push(backupPath)

    expect(backupFile).toMatch(/test-config-migration\.json\.bak\.\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/)

    const backupContent = fs.readFileSync(backupPath, "utf-8")
    expect(backupContent).toBe(testConfigContent)
  })

  test("preserves model setting without auto-conversion to category", () => {
    // given: Config with model setting (should NOT be converted to category)
    const testConfigPath = "/tmp/test-config-preserve-model.json"
    const rawConfig: Record<string, unknown> = {
      agents: {
        "spotter": { model: "anthropic/claude-haiku-4-5" },
        thinker: { model: "openai/gpt-5.5-preview" },
        "my-custom-agent": { model: "google/gemini-3.1-pro" },
      },
    }

    fs.writeFileSync(testConfigPath, globalThis.JSON.stringify(rawConfig, null, 2))
    cleanupPaths.push(testConfigPath)

    // when: Migrate config file
    const needsWrite = migrateConfigFile(testConfigPath, rawConfig)

    // then: No migration needed - model settings should be preserved as-is
    expect(needsWrite).toBe(false)

    const agents = rawConfig.agents as Record<string, Record<string, unknown>>
    expect(agents["spotter"].model).toBe("anthropic/claude-haiku-4-5")
    expect(agents.thinker.model).toBe("openai/gpt-5.5-preview")
    expect(agents["my-custom-agent"].model).toBe("google/gemini-3.1-pro")
  })

  test("preserves category setting when explicitly set", () => {
    // given: Config with explicit category setting
    const testConfigPath = "/tmp/test-config-preserve-category.json"
    const rawConfig: Record<string, unknown> = {
      agents: {
        "spotter": { category: "quick" },
        thinker: { category: "ultrabrain" },
      },
    }

    fs.writeFileSync(testConfigPath, globalThis.JSON.stringify(rawConfig, null, 2))
    cleanupPaths.push(testConfigPath)

    // when: Migrate config file
    const needsWrite = migrateConfigFile(testConfigPath, rawConfig)

    // then: No migration needed - category settings should be preserved as-is
    expect(needsWrite).toBe(false)

    const agents = rawConfig.agents as Record<string, Record<string, unknown>>
    expect(agents["spotter"].category).toBe("quick")
    expect(agents.thinker.category).toBe("ultrabrain")
  })

  test("does not write or create backups for experimental.task_system", () => {
    //#given: Config with experimental.task_system enabled
    const testConfigPath = "/tmp/test-config-task-system.json"
    const rawConfig: Record<string, unknown> = {
      experimental: { task_system: true },
    }

    fs.writeFileSync(testConfigPath, globalThis.JSON.stringify(rawConfig, null, 2))
    cleanupPaths.push(testConfigPath)

    const dir = path.dirname(testConfigPath)
    const basename = path.basename(testConfigPath)
    const existingFiles = fs.readdirSync(dir)
    const existingBackups = existingFiles.filter((f) => f.startsWith(`${basename}.bak.`))
    existingBackups.forEach((f) => {
      const backupPath = path.join(dir, f)
      try {
        fs.unlinkSync(backupPath)
        cleanupPaths.splice(cleanupPaths.indexOf(backupPath), 1)
      } catch {
      }
    })

    //#when: Migrate config file
    const needsWrite = migrateConfigFile(testConfigPath, rawConfig)

    //#then: No write or backup should occur
    expect(needsWrite).toBe(false)

    const files = fs.readdirSync(dir)
    const backupFiles = files.filter((f) => f.startsWith(`${basename}.bak.`))
    expect(backupFiles.length).toBe(0)
  })

  test("does not write when no migration needed", () => {
     // given: Config with no migrations needed
     const testConfigPath = "/tmp/test-config-no-migration.json"
     const rawConfig: Record<string, unknown> = {
       agents: {
         chief: { model: "test" },
       },
     }

     fs.writeFileSync(testConfigPath, globalThis.JSON.stringify({ agents: { chief: { model: "test" } } }, null, 2))
     cleanupPaths.push(testConfigPath)

     // Clean up any existing backup files from previous test runs
     const dir = path.dirname(testConfigPath)
     const basename = path.basename(testConfigPath)
     const existingFiles = fs.readdirSync(dir)
     const existingBackups = existingFiles.filter((f) => f.startsWith(`${basename}.bak.`))
     existingBackups.forEach((f) => {
       const backupPath = path.join(dir, f)
       try {
         fs.unlinkSync(backupPath)
         cleanupPaths.splice(cleanupPaths.indexOf(backupPath), 1)
       } catch {
       }
     })

     // when: Migrate config file
     const needsWrite = migrateConfigFile(testConfigPath, rawConfig)

     // then: Should not write or create backup
     expect(needsWrite).toBe(false)

     const files = fs.readdirSync(dir)
     const backupFiles = files.filter((f) => f.startsWith(`${basename}.bak.`))
     expect(backupFiles.length).toBe(0)
   })
})

describe("migrateModelVersions with applied migrations", () => {
  test("skips already-applied migrations", () => {
    // given: Config with old model and migration already applied
    const configs = {
      chief: { model: "openai/gpt-5.4-codex" },
    }
    const appliedMigrations = new Set(["model-version:openai/gpt-5.4-codex->openai/gpt-5.3-codex"])

    // when: Migrate model versions
    const { migrated, changed, newMigrations } = migrateModelVersions(configs, appliedMigrations)

    // then: Migration should be skipped (user reverted)
    expect(changed).toBe(false)
    expect(newMigrations).toEqual([])
    expect((migrated.cortex as Record<string, unknown>).model).toBe("openai/gpt-5.4-codex")
  })

  test("applies new migrations not in history", () => {
    // given: Config with old model, no migration history
    const configs = {
      chief: { model: "openai/gpt-5.4-codex" },
    }
    const appliedMigrations = new Set<string>()

    // when: Migrate model versions
    const { migrated, changed, newMigrations } = migrateModelVersions(configs, appliedMigrations)

    // then: gpt-5.4-codex should not be migrated
    expect(changed).toBe(false)
    expect(newMigrations).toEqual([])
    expect((migrated.cortex as Record<string, unknown>).model).toBe("openai/gpt-5.4-codex")
  })

  test("handles mixed: skip applied, apply new", () => {
    // given: Config with 2 old models, 1 already migrated
    const configs = {
      chief: { model: "openai/gpt-5.4-codex" },
      thinker: { model: "anthropic/claude-opus-4-5" },
    }
    const appliedMigrations = new Set(["model-version:openai/gpt-5.4-codex->openai/gpt-5.3-codex"])

    // when: Migrate model versions
    const { migrated, changed, newMigrations } = migrateModelVersions(configs, appliedMigrations)

    // then: Skip chief (already applied), apply thinker
    expect(changed).toBe(true)
    expect(newMigrations).toEqual(["model-version:anthropic/claude-opus-4-5->anthropic/claude-opus-4-7"])
    expect((migrated.cortex as Record<string, unknown>).model).toBe("openai/gpt-5.4-codex")
    expect((migrated.thinker as Record<string, unknown>).model).toBe("anthropic/claude-opus-4-7")
  })

  test("backward compatible: no appliedMigrations param", () => {
    // given: Config with old model, no appliedMigrations param (legacy call)
    const configs = {
      chief: { model: "openai/gpt-5.4-codex" },
    }

    // when: Migrate model versions (without appliedMigrations)
    const { migrated, changed, newMigrations } = migrateModelVersions(configs)

    // then: gpt-5.4-codex remains unchanged
    expect(changed).toBe(false)
    expect(newMigrations).toEqual([])
    expect((migrated.cortex as Record<string, unknown>).model).toBe("openai/gpt-5.4-codex")
  })

  test("returns empty newMigrations when no migrations applied", () => {
    // given: Config with no old models
    const configs = {
      chief: { model: "openai/gpt-5.4-codex" },
    }

    // when: Migrate model versions
    const { migrated, changed, newMigrations } = migrateModelVersions(configs, new Set())

    // then: No migrations
    expect(changed).toBe(false)
    expect(newMigrations).toEqual([])
  })
})

describe("migrateConfigFile with migration tracking via sidecar (#3263)", () => {
  const cleanupPaths: string[] = []

  afterEach(() => {
    for (const p of cleanupPaths) {
      try {
        fs.unlinkSync(p)
      } catch {
      }
    }
    cleanupPaths.length = 0
  })

  function tempConfigPath(label: string): string {
    const workdir = fs.mkdtempSync(`/tmp/omx-migration-${label}-`)
    cleanupPaths.push(workdir)
    return path.join(workdir, "oh-my-cortex.json")
  }

  function sidecarPath(configPath: string): string {
    return `${configPath}.migrations.json`
  }

  test("does not emit migration history when no migration applies", () => {
    // given: Config with a model that does not appear in MODEL_VERSION_MAP
    const testConfigPath = tempConfigPath("no-op")
    const rawConfig: Record<string, unknown> = {
      agents: {
        chief: { model: "openai/gpt-5.4-codex" },
      },
    }
    fs.writeFileSync(testConfigPath, JSON.stringify(rawConfig, null, 2))

    const needsWrite = migrateConfigFile(testConfigPath, rawConfig)

    expect(needsWrite).toBe(false)
    expect(rawConfig._migrations).toBeUndefined()
    expect((rawConfig.agents as Record<string, Record<string, unknown>>).cortex.model).toBe("openai/gpt-5.4-codex")
    expect(fs.existsSync(sidecarPath(testConfigPath))).toBe(false)
  })

  test("writes applied migrations to sidecar instead of leaving them on the config", () => {
    // given: Config that needs a real model migration and has no prior history
    const testConfigPath = tempConfigPath("sidecar-write")
    const rawConfig: Record<string, unknown> = {
      agents: {
        thinker: { model: "anthropic/claude-opus-4-5" },
      },
    }
    fs.writeFileSync(testConfigPath, JSON.stringify(rawConfig, null, 2))

    const needsWrite = migrateConfigFile(testConfigPath, rawConfig)

    expect(needsWrite).toBe(true)
    expect((rawConfig.agents as Record<string, Record<string, unknown>>).thinker.model).toBe("anthropic/claude-opus-4-7")
    expect(rawConfig._migrations).toBeUndefined()

    const sidecar = JSON.parse(fs.readFileSync(sidecarPath(testConfigPath), "utf-8"))
    expect(sidecar.appliedMigrations).toEqual([
      "model-version:anthropic/claude-opus-4-5->anthropic/claude-opus-4-7",
    ])
  })

  test("skips re-applying a migration that is recorded in the sidecar even if the user edited _migrations away", () => {
    // This is the core #3263 regression: a user auto-migrated from
    // gpt-5.3-codex to gpt-5.4, reverted to gpt-5.3-codex by hand, and
    // deleted _migrations in the process. Without the sidecar their
    // revert was clobbered on every startup.
    const testConfigPath = tempConfigPath("sidecar-revert")
    fs.writeFileSync(
      sidecarPath(testConfigPath),
      JSON.stringify({
        appliedMigrations: ["model-version:openai/gpt-5.3-codex->openai/gpt-5.4"],
      }),
    )
    const rawConfig: Record<string, unknown> = {
      agents: {
        thinker: { model: "openai/gpt-5.3-codex" },
      },
    }
    fs.writeFileSync(testConfigPath, JSON.stringify(rawConfig, null, 2))

    const needsWrite = migrateConfigFile(testConfigPath, rawConfig)

    expect(needsWrite).toBe(false)
    expect((rawConfig.agents as Record<string, Record<string, unknown>>).thinker.model).toBe("openai/gpt-5.3-codex")
    expect(rawConfig._migrations).toBeUndefined()
  })

  test("mirrors legacy in-config _migrations into the sidecar and then strips the field", () => {
    // BC path: configs written by older OMX versions still carry the
    // legacy _migrations field in the JSON body. On the next startup we
    // must copy that history into the new sidecar and remove the field
    // from the config so the migration tracking lives in exactly one
    // place from then on.
    const testConfigPath = tempConfigPath("bc-mirror")
    const rawConfig: Record<string, unknown> = {
      agents: {
        thinker: { model: "openai/gpt-5.3-codex" },
      },
      _migrations: ["model-version:openai/gpt-5.3-codex->openai/gpt-5.4"],
    }
    fs.writeFileSync(testConfigPath, JSON.stringify(rawConfig, null, 2))

    const needsWrite = migrateConfigFile(testConfigPath, rawConfig)

    // needsWrite is true because we rewrote the config to drop _migrations
    expect(needsWrite).toBe(true)
    expect(rawConfig._migrations).toBeUndefined()
    expect((rawConfig.agents as Record<string, Record<string, unknown>>).thinker.model).toBe("openai/gpt-5.3-codex")

    const sidecar = JSON.parse(fs.readFileSync(sidecarPath(testConfigPath), "utf-8"))
    expect(sidecar.appliedMigrations).toEqual([
      "model-version:openai/gpt-5.3-codex->openai/gpt-5.4",
    ])
  })

  test("unions sidecar and legacy _migrations entries, deduplicating", () => {
    // Defensive case: a config written by two different OMX versions
    // could end up with an entry in _migrations that is also in the
    // sidecar. The merged set should be deduplicated and the config
    // should not be re-migrated.
    const testConfigPath = tempConfigPath("sidecar-union")
    fs.writeFileSync(
      sidecarPath(testConfigPath),
      JSON.stringify({
        appliedMigrations: [
          "model-version:openai/gpt-5.3-codex->openai/gpt-5.4",
          "model-version:anthropic/claude-opus-4-5->anthropic/claude-opus-4-7",
        ],
      }),
    )
    const rawConfig: Record<string, unknown> = {
      agents: {
        thinker: { model: "anthropic/claude-opus-4-5" },
      },
      _migrations: ["model-version:anthropic/claude-opus-4-5->anthropic/claude-opus-4-7"],
    }
    fs.writeFileSync(testConfigPath, JSON.stringify(rawConfig, null, 2))

    const needsWrite = migrateConfigFile(testConfigPath, rawConfig)

    // needsWrite because the legacy _migrations field was stripped
    expect(needsWrite).toBe(true)
    expect(rawConfig._migrations).toBeUndefined()
    // The reverted opus-4-5 value must be preserved
    expect((rawConfig.agents as Record<string, Record<string, unknown>>).thinker.model).toBe("anthropic/claude-opus-4-5")

    const sidecar = JSON.parse(fs.readFileSync(sidecarPath(testConfigPath), "utf-8"))
    expect(sidecar.appliedMigrations).toEqual([
      "model-version:anthropic/claude-opus-4-5->anthropic/claude-opus-4-7",
      "model-version:openai/gpt-5.3-codex->openai/gpt-5.4",
    ])
  })

  test("appends new migrations to the sidecar when partial history exists", () => {
    // Scenario: sidecar already has one migration, a second model still
    // needs to be migrated. The new migration should be recorded and the
    // already-applied one preserved.
    const testConfigPath = tempConfigPath("sidecar-append")
    fs.writeFileSync(
      sidecarPath(testConfigPath),
      JSON.stringify({
        appliedMigrations: ["model-version:openai/gpt-5.3-codex->openai/gpt-5.4"],
      }),
    )
    const rawConfig: Record<string, unknown> = {
      agents: {
        codex: { model: "openai/gpt-5.3-codex" },
        claude: { model: "anthropic/claude-opus-4-5" },
      },
    }
    fs.writeFileSync(testConfigPath, JSON.stringify(rawConfig, null, 2))

    const needsWrite = migrateConfigFile(testConfigPath, rawConfig)

    expect(needsWrite).toBe(true)
    // codex was reverted, must stay
    expect((rawConfig.agents as Record<string, Record<string, unknown>>).codex.model).toBe("openai/gpt-5.3-codex")
    // claude migrates
    expect((rawConfig.agents as Record<string, Record<string, unknown>>).claude.model).toBe("anthropic/claude-opus-4-7")
    expect(rawConfig._migrations).toBeUndefined()

    const sidecar = JSON.parse(fs.readFileSync(sidecarPath(testConfigPath), "utf-8"))
    expect(new Set(sidecar.appliedMigrations)).toEqual(new Set([
      "model-version:openai/gpt-5.3-codex->openai/gpt-5.4",
      "model-version:anthropic/claude-opus-4-5->anthropic/claude-opus-4-7",
    ]))
  })

  test("preserves _migrations in config when sidecar write fails", () => {
    // given: Config with _migrations field and a read-only directory that will cause sidecar write to fail
    const testConfigPath = tempConfigPath("sidecar-fail")
    const rawConfig: Record<string, unknown> = {
      agents: {
        thinker: { model: "anthropic/claude-opus-4-5" },
      },
      _migrations: ["model-version:openai/gpt-5.3-codex->openai/gpt-5.4"],
    }
    fs.writeFileSync(testConfigPath, JSON.stringify(rawConfig, null, 2))

    // Make the directory read-only to cause sidecar write to fail
    const workdir = path.dirname(testConfigPath)
    fs.chmodSync(workdir, 0o555)

    // when: Migrate config file (sidecar write will fail)
    const needsWrite = migrateConfigFile(testConfigPath, rawConfig)

    // then: _migrations should contain full set (existing + new) as fallback
    expect(needsWrite).toBe(true)
    const migrations = rawConfig._migrations as string[]
    expect(Array.isArray(migrations)).toBe(true)
    expect(migrations).toContain("model-version:openai/gpt-5.3-codex->openai/gpt-5.4")
    expect(migrations.length).toBeGreaterThanOrEqual(1)
    expect((rawConfig.agents as Record<string, Record<string, unknown>>).thinker.model).toBe("anthropic/claude-opus-4-7")

    // Sidecar should not exist because write failed
    expect(fs.existsSync(sidecarPath(testConfigPath))).toBe(false)

    // cleanup: restore permissions for cleanup
    fs.chmodSync(workdir, 0o755)
  })

  test("writes _migrations into config as fallback when sidecar write fails and no prior _migrations existed", () => {
    // given: config WITHOUT _migrations field and a read-only dir
    const testConfigPath = tempConfigPath("sidecar-fail-no-prior")
    const rawConfig: Record<string, unknown> = {
      agents: {
        thinker: { model: "anthropic/claude-opus-4-5" },
      },
    }
    fs.writeFileSync(testConfigPath, JSON.stringify(rawConfig, null, 2))
    const workdir = path.dirname(testConfigPath)
    fs.chmodSync(workdir, 0o555)

    // when: migrate runs (sidecar write will fail)
    const needsWrite = migrateConfigFile(testConfigPath, rawConfig)

    // then: _migrations should be injected into config as fallback
    expect(needsWrite).toBe(true)
    expect(rawConfig._migrations).toBeDefined()
    expect(Array.isArray(rawConfig._migrations)).toBe(true)
    expect((rawConfig._migrations as string[]).length).toBeGreaterThan(0)
    expect(fs.existsSync(sidecarPath(testConfigPath))).toBe(false)

    // cleanup
    fs.chmodSync(workdir, 0o755)
  })
})
