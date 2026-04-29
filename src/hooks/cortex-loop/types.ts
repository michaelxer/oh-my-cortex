import type { CortexLoopConfig } from "../../config"

export interface CortexLoopState {
  active: boolean
  iteration: number
  max_iterations?: number
  message_count_at_start?: number
  completion_promise: string
  initial_completion_promise?: string
  verification_attempt_id?: string
  verification_session_id?: string
  started_at: string
  prompt: string
  session_id?: string
  deepwork?: boolean
  verification_pending?: boolean
  strategy?: "reset" | "continue"
}

export interface CortexLoopOptions {
  config?: CortexLoopConfig
  getTranscriptPath?: (sessionId: string) => string
  apiTimeout?: number
  checkSessionExists?: (sessionId: string) => Promise<boolean>
  backgroundManager?: { getTasksByParentSession: (sessionId: string) => Array<{ status: string }> }
}
