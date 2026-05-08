import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"

import {
  searchCortexArtifacts,
  type CortexArtifactType,
} from "../../features/cortex-memory"

const ARTIFACT_TYPES: CortexArtifactType[] = ["ledger", "plan", "evidence", "file_ops", "handoff"]

function normalizeTypes(types: string[] | undefined): CortexArtifactType[] | undefined {
  if (!types || types.length === 0) {
    return undefined
  }

  const allowed = new Set<CortexArtifactType>(ARTIFACT_TYPES)
  return types
    .map((type) => type.trim().toLowerCase())
    .filter((type): type is CortexArtifactType => allowed.has(type as CortexArtifactType))
}

export function createCortexSearchTool(projectDirectory: string): ToolDefinition {
  return tool({
    description:
      "Search OMX memory artifacts from .cortex ledgers, plans, evidence, file operation traces, and nearby HANDOFF_DOC files. " +
      "Use this before resuming long-running work, looking for prior decisions, or checking what the previous agent did.",
    args: {
      query: tool.schema
        .string()
        .describe("Search query. Use a focused phrase, feature name, file path, or decision keyword."),
      types: tool.schema
        .array(tool.schema.string())
        .optional()
        .describe("Optional artifact types: ledger, plan, evidence, file_ops, handoff."),
      limit: tool.schema
        .number()
        .optional()
        .describe("Maximum number of results, from 1 to 50. Defaults to 10."),
    },
    execute: async (args) => {
      const results = searchCortexArtifacts(projectDirectory, args.query, {
        types: normalizeTypes(args.types),
        limit: args.limit,
      })

      if (results.length === 0) {
        return JSON.stringify({
          query: args.query,
          results: [],
          message: "No OMX memory artifacts matched the query.",
        }, null, 2)
      }

      return JSON.stringify({
        query: args.query,
        results,
      }, null, 2)
    },
  })
}
