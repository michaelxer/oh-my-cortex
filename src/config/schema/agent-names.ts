import { z } from "zod"

export const BuiltinAgentNameSchema = z.enum([
  "chief",
  "founder",
  "planner",
  "thinker",
  "researcher",
  "tracker",
  "spotter",
  "reviewer",
  "critic",
  "lead",
  "worker",
])

export const BuiltinSkillNameSchema = z.enum([
  "playwright",
  "agent-browser",
  "dev-browser",
  "frontend-ui-ux",
  "git-master",
  "review-work",
  "ai-slop-remover",
  "session-guardian",
  "reasoning-toolkit",
  "sensitive-drafting",
  "domain-health",
  "domain-legal",
  "domain-financial",
  "domain-security",
  "domain-political",
  "team-mode",
  "hyperplan",
])

export const OverridableAgentNameSchema = z.enum([
  "build",
  "plan",
  "chief",
  "founder",
  "worker",
  "OpenCode-Builder",
  "planner",
  "reviewer",
  "critic",
  "thinker",
  "researcher",
  "tracker",
  "spotter",
  "lead",
])

export const AgentNameSchema = BuiltinAgentNameSchema
export type AgentName = z.infer<typeof AgentNameSchema>

export type BuiltinSkillName = z.infer<typeof BuiltinSkillNameSchema>
