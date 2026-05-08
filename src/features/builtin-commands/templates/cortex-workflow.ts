export const CORTEX_WORKFLOW_TEMPLATE = `Run the OMX-native brainstorm -> plan -> implement workflow.

Goal:
- Coordinate deep project work without importing micode's agent model.
- Use OMX roles, Team Mode, Hyperplan, ledgers, and checkpoints as appropriate.

Instructions:
1. Start by searching memory with cortex_search for relevant ledgers, plans, evidence, and handoffs.
2. If the request is ambiguous or high-risk, run a brainstorm phase and optionally write .cortex/designs/YYYY-MM-DD-<topic>-design.md.
3. Create or update a plan under .cortex/plans/YYYY-MM-DD-<topic>.md.
4. Implement in small checkpoints. After each checkpoint, run relevant tests, commit, push when requested, and update /ledger.
5. Use existing OMX agents only:
   - Chief for synthesis and final coordination.
   - Planner for plan quality.
   - Lead/Worker for implementation.
   - Reviewer/Critic for verification and adversarial review.
   - Researcher/Thinker/Tracker/Spotter for focused support.
6. Prefer Team Mode or Hyperplan only when the task benefits from parallel work or adversarial planning.
7. End every durable phase with a clear resume note.`
