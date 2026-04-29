/// <reference types="bun-types" />

import { describe, expect, test } from "bun:test";
import {
  getFounderPromptSource,
  getFounderPrompt,
  createFounderAgent,
} from "./index";

describe("getFounderPromptSource", () => {
  test("returns 'gpt-5-4' for gpt-5.4 models", () => {
    // given
    const model1 = "openai/gpt-5.4";
    const model2 = "openai/gpt-5.4-codex";
    const model3 = "github-copilot/gpt-5.4";

    // when
    const source1 = getFounderPromptSource(model1);
    const source2 = getFounderPromptSource(model2);
    const source3 = getFounderPromptSource(model3);

    // then
    expect(source1).toBe("gpt-5-4");
    expect(source2).toBe("gpt-5-4");
    expect(source3).toBe("gpt-5-4");
  });

  test("returns 'gpt-5-5' for gpt-5.5 models", () => {
    // given
    const model1 = "openai/gpt-5.5";
    const model2 = "openai/gpt-5-5";
    const model3 = "github-copilot/gpt-5.5";

    // when
    const source1 = getFounderPromptSource(model1);
    const source2 = getFounderPromptSource(model2);
    const source3 = getFounderPromptSource(model3);

    // then
    expect(source1).toBe("gpt-5-5");
    expect(source2).toBe("gpt-5-5");
    expect(source3).toBe("gpt-5-5");
  });

  test("returns 'gpt-5-3-codex' for GPT 5.3 Codex models", () => {
    // given
    const model1 = "openai/gpt-5.3-codex";
    const model2 = "github-copilot/gpt-5.3-codex";

    // when
    const source1 = getFounderPromptSource(model1);
    const source2 = getFounderPromptSource(model2);

    // then
    expect(source1).toBe("gpt-5-3-codex");
    expect(source2).toBe("gpt-5-3-codex");
  });

  test("returns 'gpt' for generic GPT models", () => {
    // given
    const model1 = "openai/gpt-4o";
    const model2 = "github-copilot/gpt-4o";
    const model3 = "openai/gpt-4o";

    // when
    const source1 = getFounderPromptSource(model1);
    const source2 = getFounderPromptSource(model2);
    const source3 = getFounderPromptSource(model3);

    // then
    expect(source1).toBe("gpt");
    expect(source2).toBe("gpt");
    expect(source3).toBe("gpt");
  });

  test("returns 'gpt' for non-GPT models and undefined", () => {
    // given
    const model1 = "anthropic/claude-opus-4-7";
    const model2 = undefined;

    // when
    const source1 = getFounderPromptSource(model1);
    const source2 = getFounderPromptSource(model2);

    // then
    expect(source1).toBe("gpt");
    expect(source2).toBe("gpt");
  });
});

describe("getFounderPrompt", () => {
  test("GPT 5.4 model returns GPT-5.4 optimized prompt", () => {
    // given
    const model = "openai/gpt-5.4";

    // when
    const prompt = getFounderPrompt(model);

    // then
    expect(prompt).toContain("You build context by examining");
    expect(prompt).toContain("Never chain together bash commands");
    expect(prompt).toContain("<tool_usage_rules>");
  });

  test("GPT 5.4-codex model returns GPT-5.4 optimized prompt", () => {
    // given
    const model = "openai/gpt-5.4-codex";

    // when
    const prompt = getFounderPrompt(model);

    // then
    expect(prompt).toContain("You build context by examining");
    expect(prompt).toContain("Never chain together bash commands");
    expect(prompt).toContain("<tool_usage_rules>");
  });

  test("GPT 5.5 model returns GPT-5.5 optimized prompt", () => {
    // given
    const model = "openai/gpt-5.5";

    // when
    const prompt = getFounderPrompt(model);

    // then
    expect(prompt).toContain("You build context by examining");
    expect(prompt).toContain("Forbidden stops");
    expect(prompt).toContain("Three-attempt failure protocol");
  });

  test("GPT 5.3-codex model returns GPT-5.3 prompt", () => {
    // given
    const model = "openai/gpt-5.3-codex";

    // when
    const prompt = getFounderPrompt(model);

    // then
    expect(prompt).toContain("Senior Staff Engineer");
    expect(prompt).toContain("Hard Constraints");
    expect(prompt).toContain("<tool_usage_rules>");
  });

  test("generic GPT model returns generic GPT prompt", () => {
    // given
    const model = "openai/gpt-4o";

    // when
    const prompt = getFounderPrompt(model);

    // then
    expect(prompt).toContain("Senior Staff Engineer");
    expect(prompt).toContain("KEEP GOING");
    expect(prompt).not.toContain("intent_extraction");
  });

  test("Claude model returns generic GPT prompt (Founder default)", () => {
    // given
    const model = "anthropic/claude-opus-4-7";

    // when
    const prompt = getFounderPrompt(model);

    // then
    expect(prompt).toContain("autonomous deep worker");
    expect(prompt).toContain("Founder");
  });

  test("useTaskSystem=true includes Task Discipline for GPT models", () => {
    // given
    const model = "openai/gpt-5.4";

    // when
    const prompt = getFounderPrompt(model, true);

    // then
    expect(prompt).toContain("Task Discipline");
    expect(prompt).toContain("task_create");
    expect(prompt).toContain("task_update");
  });

  test("useTaskSystem=false includes Todo Discipline for Claude models", () => {
    // given
    const model = "anthropic/claude-opus-4-7";

    // when
    const prompt = getFounderPrompt(model, false);

    // then
    expect(prompt).toContain("Todo Discipline");
    expect(prompt).toContain("todowrite");
  });
});

describe("createFounderAgent", () => {
  test("returns AgentConfig with required fields", () => {
    // given
    const model = "openai/gpt-5.4";

    // when
    const config = createFounderAgent(model);

    // then
    expect(config).toHaveProperty("description");
    expect(config).toHaveProperty("mode", "primary");
    expect(config).toHaveProperty("model", "openai/gpt-5.4");
    expect(config).toHaveProperty("maxTokens", 32000);
    expect(config).toHaveProperty("prompt");
    expect(config).toHaveProperty("color", "#D97706");
    expect(config).toHaveProperty("permission");
    expect(config.permission).toHaveProperty("question", "allow");
    expect(config.permission).toHaveProperty("call_cortex_agent", "deny");
    expect(config).toHaveProperty("reasoningEffort", "medium");
  });

  test("GPT 5.4 model includes GPT-5.4 specific prompt content", () => {
    // given
    const model = "openai/gpt-5.4";

    // when
    const config = createFounderAgent(model);

    // then
    expect(config.prompt).toContain("You build context by examining");
    expect(config.prompt).toContain("Never chain together bash commands");
    expect(config.prompt).toContain("<tool_usage_rules>");
    expect(config.prompt).toContain("Do not use `apply_patch`");
    expect(config.prompt).toContain("`edit` and `write`");
  });

  test("GPT 5.3-codex model includes GPT-5.3 specific prompt content", () => {
    // given
    const model = "openai/gpt-5.3-codex";

    // when
    const config = createFounderAgent(model);

    // then
    expect(config.prompt).toContain("Senior Staff Engineer");
    expect(config.prompt).toContain("Hard Constraints");
    expect(config.prompt).toContain("<tool_usage_rules>");
    expect(config.prompt).toContain("Do not use `apply_patch`");
    expect(config.prompt).toContain("`edit` and `write`");
  });

  test("includes Founder identity in prompt", () => {
    // given
    const model = "openai/gpt-5.4";

    // when
    const config = createFounderAgent(model);

    // then
    expect(config.prompt).toContain("Founder");
    expect(config.prompt).toContain("autonomous deep worker");
  });

  test("generic GPT model includes apply_patch workaround guidance", () => {
    // given
    const model = "openai/gpt-4o";

    // when
    const config = createFounderAgent(model);

    // then
    expect(config.prompt).toContain("Do not use `apply_patch`");
    expect(config.prompt).toContain("`edit` and `write`");
  });

  test("GPT models deny apply_patch while non-GPT models do not", () => {
    // given
    const gpt54Model = "openai/gpt-5.4";
    const gptGenericModel = "openai/gpt-4o";
    const claudeModel = "anthropic/claude-opus-4-7";

    // when
    const gpt54Config = createFounderAgent(gpt54Model);
    const gptGenericConfig = createFounderAgent(gptGenericModel);
    const claudeConfig = createFounderAgent(claudeModel);

    // then
    expect(gpt54Config.permission ?? {}).toHaveProperty("apply_patch", "deny");
    expect(gptGenericConfig.permission ?? {}).toHaveProperty("apply_patch", "deny");
    expect(claudeConfig.permission ?? {}).not.toHaveProperty("apply_patch");
  });

  test("useTaskSystem=true produces Task Discipline prompt", () => {
    // given
    const model = "openai/gpt-5.4";

    // when
    const config = createFounderAgent(model, [], [], [], [], true);

    // then
    expect(config.prompt).toContain("task_create");
    expect(config.prompt).toContain("task_update");
    expect(config.prompt).not.toContain("todowrite");
  });

  test("useTaskSystem=false produces Todo Discipline prompt", () => {
    // given
    const model = "openai/gpt-5.4";

    // when
    const config = createFounderAgent(model, [], [], [], [], false);

    // then
    expect(config.prompt).toContain("todowrite");
    expect(config.prompt).not.toContain("task_create");
  });
});

import { maybeCreateFounderConfig } from "../builtin-agents/founder-agent";
import type { AgentOverrides } from "../types";
import type { CategoryConfig } from "../../config/schema";

describe("maybeCreateFounderConfig GPT apply_patch guard", () => {
  describe("#given GPT model with user override allowing apply_patch", () => {
    test("#when config is created #then apply_patch is still denied", () => {
      // given
      const agentOverrides: AgentOverrides = {
        founder: {
          model: "openai/gpt-5.4",
          permission: {
            apply_patch: "allow",
          } as Record<string, "allow">,
        },
      };
      const mergedCategories: Record<string, CategoryConfig> = {};

      // when
      const config = maybeCreateFounderConfig({
        disabledAgents: [],
        agentOverrides,
        availableModels: new Set(["openai/gpt-5.4"]),
        systemDefaultModel: "openai/gpt-5.4",
        isFirstRunNoCache: false,
        availableAgents: [],
        availableSkills: [],
        availableCategories: [],
        mergedCategories,
        useTaskSystem: false,
      });

      // then
      expect(config).toBeDefined();
      expect(config?.model).toBe("openai/gpt-5.4");
      expect(config?.permission).toHaveProperty("apply_patch", "deny");
    });
  });

  describe("#given non-GPT model with user override allowing apply_patch", () => {
    test("#when config is created #then user override is respected", () => {
      // given
      const agentOverrides: AgentOverrides = {
        founder: {
          model: "anthropic/claude-opus-4-7",
          permission: {
            apply_patch: "allow",
          } as Record<string, "allow">,
        },
      };
      const mergedCategories: Record<string, CategoryConfig> = {};

      // when
      const config = maybeCreateFounderConfig({
        disabledAgents: [],
        agentOverrides,
        availableModels: new Set(["anthropic/claude-opus-4-7"]),
        systemDefaultModel: "anthropic/claude-opus-4-7",
        isFirstRunNoCache: false,
        availableAgents: [],
        availableSkills: [],
        availableCategories: [],
        mergedCategories,
        useTaskSystem: false,
      });

      // then
      expect(config).toBeDefined();
      expect(config?.model).toBe("anthropic/claude-opus-4-7");
      expect(config?.permission).toHaveProperty("apply_patch", "allow");
    });
  });

  describe("#given generic GPT model with user override allowing apply_patch", () => {
    test("#when config is created #then apply_patch is still denied", () => {
      // given
      const agentOverrides: AgentOverrides = {
        founder: {
          model: "openai/gpt-4o",
          permission: {
            apply_patch: "allow",
          } as Record<string, "allow">,
        },
      };
      const mergedCategories: Record<string, CategoryConfig> = {};

      // when
      const config = maybeCreateFounderConfig({
        disabledAgents: [],
        agentOverrides,
        availableModels: new Set(["openai/gpt-4o"]),
        systemDefaultModel: "openai/gpt-4o",
        isFirstRunNoCache: false,
        availableAgents: [],
        availableSkills: [],
        availableCategories: [],
        mergedCategories,
        useTaskSystem: false,
      });

      // then
      expect(config).toBeDefined();
      expect(config?.model).toBe("openai/gpt-4o");
      expect(config?.permission).toHaveProperty("apply_patch", "deny");
    });
  });

  describe("#given Opus 4.7 model with user override allowing grep and glob", () => {
    test("#when config is created #then grep and glob are still denied", () => {
      // given
      const agentOverrides: AgentOverrides = {
        founder: {
          model: "anthropic/claude-opus-4-7",
          permission: {
            grep: "allow",
            glob: "allow",
          } as Record<string, "allow">,
        },
      };
      const mergedCategories: Record<string, CategoryConfig> = {};

      // when
      const config = maybeCreateFounderConfig({
        disabledAgents: [],
        agentOverrides,
        availableModels: new Set(["anthropic/claude-opus-4-7"]),
        systemDefaultModel: "anthropic/claude-opus-4-7",
        isFirstRunNoCache: false,
        availableAgents: [],
        availableSkills: [],
        availableCategories: [],
        mergedCategories,
        useTaskSystem: false,
      });

      // then
      expect(config?.permission).toHaveProperty("grep", "deny");
      expect(config?.permission).toHaveProperty("glob", "deny");
    });
  });

  describe("#given dotted Opus 4.7 model with user override allowing grep and glob", () => {
    test("#when config is created #then grep and glob are still denied", () => {
      // given
      const agentOverrides: AgentOverrides = {
        founder: {
          model: "anthropic/claude-opus-4.7",
          permission: {
            grep: "allow",
            glob: "allow",
          } as Record<string, "allow">,
        },
      };
      const mergedCategories: Record<string, CategoryConfig> = {};

      // when
      const config = maybeCreateFounderConfig({
        disabledAgents: [],
        agentOverrides,
        availableModels: new Set(["anthropic/claude-opus-4.7"]),
        systemDefaultModel: "anthropic/claude-opus-4.7",
        isFirstRunNoCache: false,
        availableAgents: [],
        availableSkills: [],
        availableCategories: [],
        mergedCategories,
        useTaskSystem: false,
      });

      // then
      expect(config?.permission).toHaveProperty("grep", "deny");
      expect(config?.permission).toHaveProperty("glob", "deny");
    });
  });

  describe("#given GPT 5.5 model with user override allowing grep and glob", () => {
    test("#when config is created #then grep and glob are still denied", () => {
      // given
      const agentOverrides: AgentOverrides = {
        founder: {
          model: "openai/gpt-5.5",
          permission: {
            grep: "allow",
            glob: "allow",
          } as Record<string, "allow">,
        },
      };
      const mergedCategories: Record<string, CategoryConfig> = {};

      // when
      const config = maybeCreateFounderConfig({
        disabledAgents: [],
        agentOverrides,
        availableModels: new Set(["openai/gpt-5.5"]),
        systemDefaultModel: "openai/gpt-5.5",
        isFirstRunNoCache: false,
        availableAgents: [],
        availableSkills: [],
        availableCategories: [],
        mergedCategories,
        useTaskSystem: false,
      });

      // then
      expect(config?.permission).toHaveProperty("grep", "deny");
      expect(config?.permission).toHaveProperty("glob", "deny");
    });
  });

  describe("#given frontier default model with category override to non-frontier model", () => {
    test("#when config is created #then stale grep and glob denies are cleared", () => {
      // given
      const agentOverrides: AgentOverrides = {
        founder: {
          category: "non-frontier",
        },
      };
      const mergedCategories: Record<string, CategoryConfig> = {
        "non-frontier": {
          model: "openai/gpt-5.4",
        },
      };

      // when
      const config = maybeCreateFounderConfig({
        disabledAgents: [],
        agentOverrides,
        availableModels: new Set(["openai/gpt-5.5", "openai/gpt-5.4"]),
        systemDefaultModel: "openai/gpt-5.5",
        isFirstRunNoCache: false,
        availableAgents: [],
        availableSkills: [],
        availableCategories: [],
        mergedCategories,
        useTaskSystem: false,
      });

      // then
      expect(config?.model).toBe("openai/gpt-5.4");
      expect(config?.permission).not.toHaveProperty("grep");
      expect(config?.permission).not.toHaveProperty("glob");
    });
  });

  describe("#given non-frontier model with user override denying grep and glob", () => {
    test("#when config is created #then explicit user denies are preserved", () => {
      // given
      const agentOverrides: AgentOverrides = {
        founder: {
          model: "openai/gpt-5.4",
          permission: {
            grep: "deny",
            glob: "deny",
          } as Record<string, "deny">,
        },
      };
      const mergedCategories: Record<string, CategoryConfig> = {};

      // when
      const config = maybeCreateFounderConfig({
        disabledAgents: [],
        agentOverrides,
        availableModels: new Set(["openai/gpt-5.4"]),
        systemDefaultModel: "openai/gpt-5.4",
        isFirstRunNoCache: false,
        availableAgents: [],
        availableSkills: [],
        availableCategories: [],
        mergedCategories,
        useTaskSystem: false,
      });

      // then
      expect(config?.permission).toHaveProperty("grep", "deny");
      expect(config?.permission).toHaveProperty("glob", "deny");
    });
  });

  describe("#given non-frontier model with legacy user tools denying grep and glob", () => {
    test("#when config is created #then explicit legacy denies are preserved", () => {
      // given
      const legacyOverride = {
        model: "openai/gpt-5.4",
        tools: {
          grep: false,
          glob: false,
        },
      };
      const agentOverrides: AgentOverrides = {
        founder: legacyOverride,
      };
      const mergedCategories: Record<string, CategoryConfig> = {};

      // when
      const config = maybeCreateFounderConfig({
        disabledAgents: [],
        agentOverrides,
        availableModels: new Set(["openai/gpt-5.4"]),
        systemDefaultModel: "openai/gpt-5.4",
        isFirstRunNoCache: false,
        availableAgents: [],
        availableSkills: [],
        availableCategories: [],
        mergedCategories,
        useTaskSystem: false,
      });

      // then
      expect(config?.permission).toHaveProperty("grep", "deny");
      expect(config?.permission).toHaveProperty("glob", "deny");
    });
  });
});
