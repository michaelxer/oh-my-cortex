import { z } from "zod"
import { AnyMcpNameSchema } from "../../mcp/types"
import { BuiltinSkillNameSchema } from "./agent-names"
import { AgentDefinitionsConfigSchema } from "./agent-definitions"
import { AgentOverridesSchema } from "./agent-overrides"
import { BabysittingConfigSchema } from "./babysitting"
import { BackgroundTaskConfigSchema } from "./background-task"
import { BrowserAutomationConfigSchema } from "./browser-automation"
import { CategoriesConfigSchema } from "./categories"
import { ClaudeCodeConfigSchema } from "./claude-code"
import { CommentCheckerConfigSchema } from "./comment-checker"
import { BuiltinCommandNameSchema } from "./commands"
import { ExperimentalConfigSchema } from "./experimental"
import { GitMasterConfigSchema } from "./git-master"
import { NotificationConfigSchema } from "./notification"
import { OpenClawConfigSchema } from "./openclaw"
import { ModelCapabilitiesConfigSchema } from "./model-capabilities"
import { CortexLoopConfigSchema } from "./cortex-loop"
import { KeywordDetectorConfigSchema } from "./keyword-detector"
import { RuntimeFallbackConfigSchema } from "./runtime-fallback"
import { SkillsConfigSchema } from "./skills"
import { ChiefConfigSchema } from "./chief"
import { ChiefAgentConfigSchema } from "./chief-agent"
import { TeamModeConfigSchema } from "./team-mode"
import { TmuxConfigSchema } from "./tmux"
import { StartWorkConfigSchema } from "./start-work"
import { WebsearchConfigSchema } from "./websearch"

export const OhMyCortexConfigSchema = z.object({
  $schema: z.string().optional(),
  /** Enable new task system (default: false) */
  new_task_system_enabled: z.boolean().optional(),
  /** Default agent name for `oh-my-cortex run` (env: OPENCODE_DEFAULT_AGENT) */
  default_run_agent: z.string().optional(),
  /** Paths to external agent definition files (.md or .json) */
  agent_definitions: AgentDefinitionsConfigSchema,
  disabled_mcps: z.array(AnyMcpNameSchema).optional(),
  disabled_agents: z.array(z.string()).optional(),
  disabled_skills: z.array(BuiltinSkillNameSchema).optional(),
  disabled_hooks: z.array(z.string()).optional(),
  disabled_commands: z.array(BuiltinCommandNameSchema).optional(),
  /** Disable specific tools by name (e.g., ["todowrite", "todoread"]) */
  disabled_tools: z.array(z.string()).optional(),
  mcp_env_allowlist: z.array(z.string()).optional(),
  /** Enable hashline_edit tool/hook integrations (default: false) */
  hashline_edit: z.boolean().optional(),
  /** Enable model fallback on API errors (default: false). Set to true to enable automatic model switching when model errors occur. */
  model_fallback: z.boolean().optional(),
  agents: AgentOverridesSchema.optional(),
  categories: CategoriesConfigSchema.optional(),
  claude_code: ClaudeCodeConfigSchema.optional(),
  chief_agent: ChiefAgentConfigSchema.optional(),
  comment_checker: CommentCheckerConfigSchema.optional(),
  experimental: ExperimentalConfigSchema.optional(),
  auto_update: z.boolean().optional(),
  skills: SkillsConfigSchema.optional(),
  cortex_loop: CortexLoopConfigSchema.optional(),
  team_mode: TeamModeConfigSchema.optional(),
  /** Per-keyword disable list for keyword-detector. Allowed values: deepwork, search, analyze, team, hyperplan, hyperplan-deepwork. */
  keyword_detector: KeywordDetectorConfigSchema.optional(),
  /**
   * Enable runtime fallback (default: false)
   * Set to false to disable, or use object for advanced config:
   * { "enabled": true, "retry_on_errors": [400, 429], "timeout_seconds": 30 }
   */
  runtime_fallback: z.union([z.boolean(), RuntimeFallbackConfigSchema]).optional(),
  background_task: BackgroundTaskConfigSchema.optional(),
  notification: NotificationConfigSchema.optional(),
  model_capabilities: ModelCapabilitiesConfigSchema.optional(),
  openclaw: OpenClawConfigSchema.optional(),
  babysitting: BabysittingConfigSchema.optional(),
  git_master: GitMasterConfigSchema.default({
    commit_footer: true,
    include_co_authored_by: true,
    git_env_prefix: "GIT_MASTER=1",
  }),
  browser_automation_engine: BrowserAutomationConfigSchema.optional(),
  websearch: WebsearchConfigSchema.optional(),
  tmux: TmuxConfigSchema.optional(),
  chief: ChiefConfigSchema.optional(),
  start_work: StartWorkConfigSchema.optional(),
  /** Migration history to prevent re-applying migrations (e.g., model version upgrades) */
  _migrations: z.array(z.string()).optional(),
})

export type OhMyCortexConfig = z.infer<typeof OhMyCortexConfigSchema>
