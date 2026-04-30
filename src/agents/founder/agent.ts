import type { AgentConfig } from "@opencode-ai/sdk";
import type { AgentMode, AgentPromptMetadata } from "../types";
import { isGpt5_3CodexModel, isGpt5_5Model, isGptNativeChiefModel } from "../types";
import type {
  AvailableAgent,
  AvailableTool,
  AvailableSkill,
  AvailableCategory,
} from "../dynamic-agent-prompt-builder";
import { categorizeTools, buildAgentIdentitySection } from "../dynamic-agent-prompt-builder";
import { getGptApplyPatchPermission } from "../gpt-apply-patch-guard";
import { getFrontierToolSchemaPermission } from "../frontier-tool-schema-guard";

import { buildFounderPrompt as buildGptPrompt } from "./gpt";
import { buildFounderPrompt as buildGpt53CodexPrompt } from "./gpt-5-3-codex";
import { buildFounderPrompt as buildGpt54Prompt } from "./gpt-5-4";
import { buildGpt55FounderPrompt as buildGpt55Prompt } from "./gpt-5-5";

const MODE: AgentMode = "primary";

export type FounderPromptSource = "gpt-5-5" | "gpt-5-4" | "gpt-5-3-codex" | "gpt";

export function getFounderPromptSource(
  model?: string,
): FounderPromptSource {
  if (model && isGpt5_5Model(model)) {
    return "gpt-5-5";
  }
  if (model && isGptNativeChiefModel(model)) {
    return "gpt-5-4";
  }
  if (model && isGpt5_3CodexModel(model)) {
    return "gpt-5-3-codex";
  }
  return "gpt";
}

export interface FounderContext {
  model?: string;
  availableAgents?: AvailableAgent[];
  availableTools?: AvailableTool[];
  availableSkills?: AvailableSkill[];
  availableCategories?: AvailableCategory[];
  useTaskSystem?: boolean;
}

export function getFounderPrompt(
  model?: string,
  useTaskSystem = false,
): string {
  return buildDynamicFounderPrompt({ model, useTaskSystem });
}

function buildDynamicFounderPrompt(ctx?: FounderContext): string {
  const agents = ctx?.availableAgents ?? [];
  const tools = ctx?.availableTools ?? [];
  const skills = ctx?.availableSkills ?? [];
  const categories = ctx?.availableCategories ?? [];
  const useTaskSystem = ctx?.useTaskSystem ?? false;
  const model = ctx?.model;

  const source = getFounderPromptSource(model);

  let basePrompt: string;
  switch (source) {
    case "gpt-5-5":
      basePrompt = buildGpt55Prompt(
        agents,
        tools,
        skills,
        categories,
        useTaskSystem,
      );
      break;
    case "gpt-5-4":
      basePrompt = buildGpt54Prompt(
        agents,
        tools,
        skills,
        categories,
        useTaskSystem,
      );
      break;
    case "gpt-5-3-codex":
      basePrompt = buildGpt53CodexPrompt(
        agents,
        tools,
        skills,
        categories,
        useTaskSystem,
      );
      break;
    case "gpt":
    default:
      basePrompt = buildGptPrompt(
        agents,
        tools,
        skills,
        categories,
        useTaskSystem,
      );
      break;
  }

  const agentIdentity = buildAgentIdentitySection(
    "Founder",
    "Autonomous deep worker for software engineering from OhMyCortex",
  );

  return `${agentIdentity}\n${basePrompt}`;
}

export function createFounderAgent(
  model: string,
  availableAgents?: AvailableAgent[],
  availableToolNames?: string[],
  availableSkills?: AvailableSkill[],
  availableCategories?: AvailableCategory[],
  useTaskSystem = false,
): AgentConfig {
  const tools = availableToolNames ? categorizeTools(availableToolNames) : [];

  const prompt = buildDynamicFounderPrompt({
    model,
    availableAgents,
    availableTools: tools,
    availableSkills,
    availableCategories,
    useTaskSystem,
  });

  return {
    description:
      "Autonomous Deep Worker - goal-oriented execution across all domains. Explores thoroughly before acting, uses tracker/researcher agents for comprehensive context, completes tasks end-to-end. Handles software engineering, business research, strategy documents, and any domain requiring deep autonomous work. (Founder - OhMyCortex)",
    mode: MODE,
    model,
    maxTokens: 32000,
    prompt,
    color: "#D97706",
    permission: {
      question: "allow",
      call_cortex_agent: "deny",
      ...getFrontierToolSchemaPermission(model),
      ...getGptApplyPatchPermission(model),
    } as AgentConfig["permission"],
    reasoningEffort: "medium",
  };
}
createFounderAgent.mode = MODE;

export const founderPromptMetadata: AgentPromptMetadata = {
  category: "specialist",
  cost: "EXPENSIVE",
  promptAlias: "Founder",
  triggers: [
    {
      domain: "Autonomous deep work",
      trigger: "End-to-end task completion without premature stopping",
    },
    {
      domain: "Complex implementation",
      trigger: "Multi-step implementation requiring thorough exploration",
    },
  ],
  useWhen: [
    "Task requires deep exploration before implementation",
    "User wants autonomous end-to-end completion",
    "Complex multi-file changes needed",
  ],
  avoidWhen: [
    "Simple single-step tasks",
    "Tasks requiring user confirmation at each step",
    "When orchestration across multiple agents is needed (use Lead)",
  ],
  keyTrigger: "Complex implementation task requiring autonomous deep work",
};
