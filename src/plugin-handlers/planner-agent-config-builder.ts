import type { CategoryConfig } from "../config/schema";
import { PLANNER_PERMISSION, getPlannerPrompt } from "../agents/planner";
import { resolvePromptAppend } from "../agents/builtin-agents/resolve-file-uri";
import { AGENT_MODEL_REQUIREMENTS } from "../shared/model-requirements";
import type { FallbackEntry } from "../shared/model-requirements";
import {
  fetchAvailableModels,
  readConnectedProvidersCache,
  resolveModelPipeline,
} from "../shared";
import { resolveCategoryConfig } from "./category-config-resolver";

type PlannerOverride = Record<string, unknown> & {
  category?: string;
  model?: string;
  variant?: string;
  reasoningEffort?: string;
  textVerbosity?: string;
  thinking?: { type: string; budgetTokens?: number };
  temperature?: number;
  top_p?: number;
  maxTokens?: number;
  prompt_append?: string;
};

function isModelInFallbackChain(
  model: string | undefined,
  fallbackChain: FallbackEntry[] | undefined,
): boolean {
  if (!model || !fallbackChain || fallbackChain.length === 0) {
    return false;
  }

  const modelParts = model.split("/");
  const modelName = modelParts.length >= 2 ? modelParts.slice(1).join("/") : model;

  return fallbackChain.some((entry) => entry.model === modelName);
}

export async function buildPlannerAgentConfig(params: {
  configAgentPlan: Record<string, unknown> | undefined;
  pluginPlannerOverride: PlannerOverride | undefined;
  userCategories: Record<string, CategoryConfig> | undefined;
  currentModel: string | undefined;
  disabledTools?: readonly string[];
}): Promise<Record<string, unknown>> {
  const categoryConfig = params.pluginPlannerOverride?.category
    ? resolveCategoryConfig(params.pluginPlannerOverride.category, params.userCategories)
    : undefined;

  const requirement = AGENT_MODEL_REQUIREMENTS["planner"];
  const connectedProviders = readConnectedProvidersCache();
  const availableModels = await fetchAvailableModels(undefined, {
    connectedProviders: connectedProviders ?? undefined,
  });

  const configuredPlannerModel =
    params.pluginPlannerOverride?.model ?? categoryConfig?.model;

  const shouldUseCurrentModel = isModelInFallbackChain(
    params.currentModel,
    requirement?.fallbackChain,
  );

  const modelResolution = resolveModelPipeline({
    intent: {
      uiSelectedModel: configuredPlannerModel
        ? undefined
        : shouldUseCurrentModel
          ? params.currentModel
          : undefined,
      userModel: params.pluginPlannerOverride?.model,
      categoryDefaultModel: categoryConfig?.model,
    },
    constraints: { availableModels },
    policy: {
      fallbackChain: requirement?.fallbackChain,
      systemDefaultModel: undefined,
    },
  });

  const resolvedModel = modelResolution?.model;
  const resolvedVariant = modelResolution?.variant;

  const variantToUse = params.pluginPlannerOverride?.variant ?? resolvedVariant;
  const reasoningEffortToUse =
    params.pluginPlannerOverride?.reasoningEffort ?? categoryConfig?.reasoningEffort;
  const textVerbosityToUse =
    params.pluginPlannerOverride?.textVerbosity ?? categoryConfig?.textVerbosity;
  const thinkingToUse = params.pluginPlannerOverride?.thinking ?? categoryConfig?.thinking;
  const temperatureToUse =
    params.pluginPlannerOverride?.temperature ?? categoryConfig?.temperature;
  const topPToUse = params.pluginPlannerOverride?.top_p ?? categoryConfig?.top_p;
  const maxTokensToUse =
    params.pluginPlannerOverride?.maxTokens ?? categoryConfig?.maxTokens;

  const base: Record<string, unknown> = {
    ...(resolvedModel ? { model: resolvedModel } : {}),
    ...(variantToUse ? { variant: variantToUse } : {}),
    mode: "subagent",
    prompt: getPlannerPrompt(resolvedModel, params.disabledTools),
    permission: PLANNER_PERMISSION,
    description: `${(params.configAgentPlan?.description as string) ?? "Plan agent"} (Planner - OhMyCortex)`,
    color: (params.configAgentPlan?.color as string) ?? "#FF5722",
    ...(temperatureToUse !== undefined ? { temperature: temperatureToUse } : {}),
    ...(topPToUse !== undefined ? { top_p: topPToUse } : {}),
    ...(maxTokensToUse !== undefined ? { maxTokens: maxTokensToUse } : {}),
    ...(categoryConfig?.tools ? { tools: categoryConfig.tools } : {}),
    ...(thinkingToUse ? { thinking: thinkingToUse } : {}),
    ...(reasoningEffortToUse !== undefined
      ? { reasoningEffort: reasoningEffortToUse }
      : {}),
    ...(textVerbosityToUse !== undefined
      ? { textVerbosity: textVerbosityToUse }
      : {}),
  };

  const override = params.pluginPlannerOverride;
  if (!override) return base;

  const { prompt_append, ...restOverride } = override;
  const merged = { ...base, ...restOverride };
  if (prompt_append && typeof merged.prompt === "string") {
    merged.prompt = merged.prompt + "\n" + resolvePromptAppend(prompt_append);
  }
  return merged;
}
