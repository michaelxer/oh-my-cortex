import { join } from "node:path";
import { OPENCODE_STORAGE } from "../../shared";
export const INTERACTIVE_BASH_SESSION_STORAGE = join(
  OPENCODE_STORAGE,
  "interactive-bash-session",
);

export const OMX_SESSION_PREFIX = "omx-";

export function buildSessionReminderMessage(sessions: string[]): string {
  if (sessions.length === 0) return "";
  return `\n\n[System Reminder] Active omx-* tmux sessions: ${sessions.join(", ")}`;
}
