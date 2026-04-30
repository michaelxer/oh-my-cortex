export const CHECKPOINT_THRESHOLD = 20

export const CHECKPOINT_COMMAND_MARKER = "Force checkpoint summary"

export const CHECKPOINT_PROMPT = `[Checkpoint Reminder]
You have been working for approximately 20 exchanges in this session. Before continuing, provide a brief checkpoint:

1. **Progress:** What has been accomplished so far?
2. **Current state:** What are you working on right now?
3. **Remaining:** What still needs to be done?
4. **Decisions:** Any key decisions made or assumptions taken?
5. **Concerns:** Any blockers, risks, or things that need clarification?

Present this concisely (not a wall of text), then continue with the next task.`
