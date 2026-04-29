import { z } from "zod"
import { OhMyCortexConfigSchema } from "../src/config/schema"

export function createOhMyCortexJsonSchema(): Record<string, unknown> {
  const jsonSchema = z.toJSONSchema(OhMyCortexConfigSchema, {
    target: "draft-7",
    unrepresentable: "any",
  }) as Record<string, unknown>

  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    $id: "https://raw.githubusercontent.com/michaelxer/oh-my-cortex/dev/assets/oh-my-cortex.schema.json",
    title: "Oh My Cortex Configuration",
    description: "Configuration schema for oh-my-cortex plugin",
    ...jsonSchema,
  }
}
