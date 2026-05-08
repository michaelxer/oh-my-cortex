import {
  appendFileOperation,
  buildFileOperationRecord,
} from "./file-ops"

type ToolExecuteBeforeInput = {
  tool: string
  sessionID: string
  callID: string
}

type ToolExecuteBeforeOutput = {
  args: Record<string, unknown>
}

export type FileOpsTrackerHook = {
  "tool.execute.before"?: (
    input: ToolExecuteBeforeInput,
    output: ToolExecuteBeforeOutput,
  ) => Promise<void>
}

export function createFileOpsTrackerHook(projectDirectory: string): FileOpsTrackerHook {
  return {
    "tool.execute.before": async (input, output): Promise<void> => {
      if (!input.sessionID) {
        return
      }

      const operation = buildFileOperationRecord({
        tool: input.tool,
        callID: input.callID,
        args: output.args,
      })

      if (!operation) {
        return
      }

      appendFileOperation(projectDirectory, input.sessionID, operation)
    },
  }
}
