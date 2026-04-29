import type { OhMyCortexConfig } from "../config";
import { getAgentDisplayName, getAgentListDisplayName } from "../shared/agent-display-names";
import { isTaskSystemEnabled } from "../shared";

type AgentWithPermission = { permission?: Record<string, unknown> };

function getConfigQuestionPermission(): string | null {
  const configContent = process.env.OPENCODE_CONFIG_CONTENT;
  if (!configContent) return null;
  try {
    const parsed = JSON.parse(configContent);
    return parsed?.permission?.question ?? null;
  } catch {
    return null;
  }
}

function agentByKey(agentResult: Record<string, unknown>, key: string): AgentWithPermission | undefined {
  return (agentResult[getAgentListDisplayName(key)] ?? agentResult[getAgentDisplayName(key)] ?? agentResult[key]) as
    | AgentWithPermission
    | undefined;
}

export function applyToolConfig(params: {
  config: Record<string, unknown>;
  pluginConfig: OhMyCortexConfig;
  agentResult: Record<string, unknown>;
}): void {
  const taskSystemEnabled = isTaskSystemEnabled(params.pluginConfig)
  const denyTodoTools = taskSystemEnabled
    ? { todowrite: "deny", todoread: "deny" }
    : {}

  const existingPermission = params.config.permission as Record<string, unknown> | undefined;
  const skillDeniedByHost = existingPermission?.skill === "deny";

  params.config.tools = {
    ...(params.config.tools as Record<string, unknown>),
    "grep_app_*": false,
    LspHover: false,
    LspCodeActions: false,
    LspCodeActionResolve: false,
    "task_*": false,
    teammate: false,
    ...(taskSystemEnabled
      ? { todowrite: false, todoread: false }
      : {}),
    ...(skillDeniedByHost
      ? { skill: false, skill_mcp: false }
      : {}),
  };

  const isCliRunMode = process.env.OPENCODE_CLI_RUN_MODE === "true";
  const configQuestionPermission = getConfigQuestionPermission();
  const isQuestionDisabledByPlugin = params.pluginConfig.disabled_tools?.includes("question") ?? false;
  const questionPermission =
    isQuestionDisabledByPlugin ? "deny" :
    configQuestionPermission === "deny" ? "deny" :
    isCliRunMode ? "deny" :
    "allow";

  const researcher = agentByKey(params.agentResult, "researcher");
  if (researcher) {
    researcher.permission = { ...researcher.permission, "grep_app_*": "allow" };
  }
  const looker = agentByKey(params.agentResult, "spotter");
  if (looker) {
    looker.permission = { ...looker.permission, task: "deny", look_at: "deny" };
  }
  const lead = agentByKey(params.agentResult, "lead");
  if (lead) {
    lead.permission = {
      ...lead.permission,
      task: "allow",
      call_cortex_agent: "deny",
      "task_*": "allow",
      teammate: "allow",
      ...denyTodoTools,
    };
  }
  const chief = agentByKey(params.agentResult, "chief");
  if (chief) {
    chief.permission = {
      ...chief.permission,
      call_cortex_agent: "deny",
      task: "allow",
      question: questionPermission,
      "task_*": "allow",
      teammate: "allow",
      ...denyTodoTools,
    };
  }
  const founder = agentByKey(params.agentResult, "founder");
  if (founder) {
    founder.permission = {
      ...founder.permission,
      call_cortex_agent: "deny",
      task: "allow",
      question: questionPermission,
      ...denyTodoTools,
    };
  }
  const planner = agentByKey(params.agentResult, "planner");
  if (planner) {
    planner.permission = {
      ...planner.permission,
      call_cortex_agent: "deny",
      task: "allow",
      question: questionPermission,
      "task_*": "allow",
      teammate: "allow",
      ...denyTodoTools,
    };
  }
  const junior = agentByKey(params.agentResult, "worker");
  if (junior) {
    junior.permission = {
      ...junior.permission,
      task: "allow",
      "task_*": "allow",
      teammate: "allow",
      ...denyTodoTools,
    };
  }

  params.config.permission = {
    webfetch: "allow",
    external_directory: "allow",
    ...(params.config.permission as Record<string, unknown>),
    task: "deny",
  };
}
