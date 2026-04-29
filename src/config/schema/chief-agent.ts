import { z } from "zod"

export const ChiefAgentConfigSchema = z.object({
  disabled: z.boolean().optional(),
  default_builder_enabled: z.boolean().optional(),
  planner_enabled: z.boolean().optional(),
  replace_plan: z.boolean().optional(),
  tdd: z.boolean().default(true).optional(),
})

export type ChiefAgentConfig = z.infer<typeof ChiefAgentConfigSchema>
