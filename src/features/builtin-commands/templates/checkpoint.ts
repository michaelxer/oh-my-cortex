export const CHECKPOINT_TEMPLATE = `Force checkpoint summary requested.

Produce a structured checkpoint summary of the current conversation:

## Checkpoint

1. **Decisions made:** List all decisions taken so far in this session.
2. **Current status:** What is the current state of work? What was just completed?
3. **Active assumptions:** What assumptions are we operating under?
4. **Open questions:** What remains unresolved or unclear?
5. **Action items:** What concrete next steps are queued?
6. **Parked items:** What was deferred or deprioritized?

After presenting the checkpoint, ask: "Continue with the current direction, or adjust?"

Force checkpoint summary.`
