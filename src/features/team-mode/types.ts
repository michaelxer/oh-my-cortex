import { z } from "zod"
import { createParseMember } from "./member-parser"

export const MESSAGE_KINDS = [
  "message",
  "shutdown_request",
  "shutdown_approved",
  "shutdown_rejected",
  "announcement",
] as const

export const MEMBER_KINDS = ["category", "subagent_type"] as const

export const TASK_STATUSES = ["pending", "claimed", "in_progress", "completed", "deleted"] as const

export const RUNTIME_STATUSES = [
  "creating",
  "active",
  "shutdown_requested",
  "deleting",
  "deleted",
  "failed",
  "orphaned",
] as const

const MemberBaseSchema = z.object({
  name: z.string().min(1).regex(/^[a-z0-9-]+$/),
  cwd: z.string().optional(),
  worktreePath: z.string().optional(),
  subscriptions: z.array(z.string()).optional(),
  backendType: z.enum(["in-process", "tmux"]).default("in-process"),
  color: z.string().optional(),
  isActive: z.boolean().default(true),
}).strict()

export const CategoryMemberSchema = MemberBaseSchema.extend({
  kind: z.literal("category"),
  category: z.string().min(1),
  prompt: z.string().min(1),
})

export const SubagentMemberSchema = MemberBaseSchema.extend({
  kind: z.literal("subagent_type"),
  subagent_type: z.string().min(1),
  prompt: z.string().optional(),
})

export const MemberSchema = z.discriminatedUnion("kind", [CategoryMemberSchema, SubagentMemberSchema])

const TeamReferenceSchema = z.object({
  path: z.string(),
  description: z.string().optional(),
}).strict()

const MISSING_TEAM_LEAD_MESSAGE =
  "leadAgentId required (or write a `lead: {...}` field, or mark one member with `isLead: true`)"

export const TeamSpecSchema = z.object({
  version: z.literal(1).default(1),
  name: z.string().min(1).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  createdAt: z.number().int().positive().default(() => Date.now()),
  leadAgentId: z.string().optional(),
  teamAllowedPaths: z.array(z.string()).optional(),
  sessionPermission: z.string().optional(),
  members: z.array(MemberSchema).min(1).max(8),
}).superRefine((teamSpec, ctx) => {
  if (teamSpec.leadAgentId === undefined && teamSpec.members.length > 1) {
    ctx.addIssue({
      code: "custom",
      message: MISSING_TEAM_LEAD_MESSAGE,
      path: ["leadAgentId"],
    })
  }
}).transform((teamSpec) => {
  if (teamSpec.leadAgentId !== undefined) {
    return teamSpec
  }

  const firstMember = teamSpec.members[0]
  if (!firstMember) {
    throw new Error(MISSING_TEAM_LEAD_MESSAGE)
  }

  return {
    ...teamSpec,
    leadAgentId: firstMember.name,
  }
})

export const MessageSchema = z.object({
  version: z.literal(1),
  messageId: z.string().uuid(),
  from: z.string(),
  to: z.string(),
  kind: z.enum(MESSAGE_KINDS),
  body: z.string().max(32 * 1024),
  summary: z.string().optional(),
  references: z.array(TeamReferenceSchema).optional(),
  timestamp: z.number().int().positive(),
  correlationId: z.string().uuid().optional(),
  color: z.string().optional(),
})

export const TaskSchema = z.object({
  version: z.literal(1),
  id: z.string(),
  subject: z.string(),
  description: z.string(),
  activeForm: z.string().optional(),
  status: z.enum(TASK_STATUSES),
  owner: z.string().optional(),
  blocks: z.array(z.string()).default([]),
  blockedBy: z.array(z.string()).default([]),
  metadata: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
  claimedAt: z.number().int().positive().optional(),
})

const RuntimeStateMemberModelSchema = z.object({
  providerID: z.string(),
  modelID: z.string(),
  variant: z.string().optional(),
  reasoningEffort: z.string().optional(),
  temperature: z.number().optional(),
  top_p: z.number().optional(),
  maxTokens: z.number().optional(),
  thinking: z.object({
    type: z.enum(["enabled", "disabled"]),
    budgetTokens: z.number().int().positive().optional(),
  }).optional(),
}).strict()

const RuntimeStateMemberSchema = z.object({
  name: z.string(),
  sessionId: z.string().optional(),
  tmuxPaneId: z.string().optional(),
  tmuxGridPaneId: z.string().optional(),
  agentType: z.enum(["leader", "general-purpose"]),
  subagent_type: z.string().optional(),
  category: z.string().optional(),
  model: RuntimeStateMemberModelSchema.optional(),
  status: z.enum(["pending", "running", "idle", "errored", "completed", "shutdown_approved"]),
  color: z.string().optional(),
  worktreePath: z.string().optional(),
  lastInjectedTurnMarker: z.string().optional(),
  pendingInjectedMessageIds: z.array(z.string()).default([]),
}).strict()

const RuntimeBoundsSchema = z.object({
  maxMembers: z.number().int().default(8),
  maxParallelMembers: z.number().int().default(4),
  maxMessagesPerRun: z.number().int().default(10000),
  maxWallClockMinutes: z.number().int().default(120),
  maxMemberTurns: z.number().int().default(500),
}).strict()

const ShutdownRequestSchema = z.object({
  memberId: z.string(),
  requesterName: z.string(),
  requestedAt: z.number().int().positive(),
  approvedAt: z.number().int().positive().optional(),
  rejectedReason: z.string().optional(),
  rejectedAt: z.number().int().positive().optional(),
}).strict()

const RuntimeStateTmuxLayoutSchema = z.object({
  ownedSession: z.boolean(),
  targetSessionId: z.string(),
  focusWindowId: z.string().optional(),
  gridWindowId: z.string().optional(),
}).strict()

export const RuntimeStateSchema = z.object({
  version: z.literal(1),
  teamRunId: z.string().uuid(),
  teamName: z.string(),
  specSource: z.enum(["project", "user"]),
  createdAt: z.number().int().positive(),
  status: z.enum(RUNTIME_STATUSES),
  leadSessionId: z.string().optional(),
  tmuxLayout: RuntimeStateTmuxLayoutSchema.optional(),
  members: z.array(RuntimeStateMemberSchema),
  shutdownRequests: z.array(ShutdownRequestSchema).default([]),
  bounds: RuntimeBoundsSchema,
})

export const AGENT_ELIGIBILITY_REGISTRY: Readonly<Record<string, {
  verdict: "eligible" | "conditional" | "hard-reject"
  rejectionMessage?: string
}>> = {
  chief: { verdict: "eligible" },
  founder: {
    verdict: "conditional",
    rejectionMessage:
      "Agent 'founder' lacks teammate permission. Use subagent_type: 'chief' unless founder teammate permissions are explicitly enabled.",
  },
  thinker: {
    verdict: "hard-reject",
    rejectionMessage:
      "Agent 'thinker' is read-only. Team members must write to mailbox inbox files. Use delegate-task with subagent_type: 'thinker' for read-only analysis instead.",
  },
  researcher: {
    verdict: "hard-reject",
    rejectionMessage:
      "Agent 'researcher' is read-only. Cannot write to the team mailbox. Use delegate-task for research queries instead.",
  },
  tracker: {
    verdict: "hard-reject",
    rejectionMessage:
      "Agent 'tracker' is read-only. Cannot write to the team mailbox. Use delegate-task for codebase exploration instead.",
  },
  spotter: {
    verdict: "hard-reject",
    rejectionMessage:
      "Agent 'spotter' has read-only tool access. Cannot write to the team mailbox.",
  },
  reviewer: {
    verdict: "hard-reject",
    rejectionMessage:
      "Agent 'reviewer' is read-only. Use delegate-task for pre-planning analysis instead.",
  },
  critic: {
    verdict: "hard-reject",
    rejectionMessage:
      "Agent 'critic' is read-only. Use delegate-task for plan critique instead.",
  },
  lead: { verdict: "eligible" },
  planner: {
    verdict: "hard-reject",
    rejectionMessage:
      "Agent 'planner' is plan-mode-only and cannot write to the team mailbox. Use category: 'strategic-analysis' or category: 'quick' instead.",
  },
  worker: { verdict: "eligible" },
} as const

const parseMemberBase = createParseMember(MemberSchema, AGENT_ELIGIBILITY_REGISTRY)

export function parseMember(input: unknown): Member {
  if (input == null || typeof input !== "object") {
    return parseMemberBase(input)
  }

  const raw = input as Record<string, unknown>
  if (raw.subagent_type !== undefined) {
    if (typeof raw.subagent_type !== "string" || !(raw.subagent_type in AGENT_ELIGIBILITY_REGISTRY)) {
      return parseMemberBase(input)
    }

    const entry = AGENT_ELIGIBILITY_REGISTRY[raw.subagent_type]
    if (entry.verdict === "hard-reject") {
      throw new Error(entry.rejectionMessage)
    }
  }

  return parseMemberBase(input)
}

export type TeamSpec = z.infer<typeof TeamSpecSchema>
export type Member = z.infer<typeof MemberSchema>
export type CategoryMember = z.infer<typeof CategoryMemberSchema>
export type SubagentMember = z.infer<typeof SubagentMemberSchema>
export type Message = z.infer<typeof MessageSchema>
export type Task = z.infer<typeof TaskSchema>
export type RuntimeStateMember = z.infer<typeof RuntimeStateMemberSchema>
export type RuntimeState = z.infer<typeof RuntimeStateSchema>
