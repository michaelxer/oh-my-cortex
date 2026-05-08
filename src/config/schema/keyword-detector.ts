import { z } from "zod"

export const KeywordTypeSchema = z.enum(["deepwork", "search", "analyze", "team", "hyperplan", "hyperplan-deepwork"])
export type KeywordType = z.infer<typeof KeywordTypeSchema>

export const KeywordDetectorConfigSchema = z.object({
  disabled_keywords: z.array(KeywordTypeSchema).optional(),
})

export type KeywordDetectorConfig = z.infer<typeof KeywordDetectorConfigSchema>
