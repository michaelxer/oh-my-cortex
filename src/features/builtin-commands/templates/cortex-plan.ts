export const CORTEX_PLAN_TEMPLATE = `Create an OMX-native implementation plan.

Goal:
- Convert a request or brainstorm artifact into a durable, testable plan.
- Store the plan under .cortex/plans.

Instructions:
1. Inspect current repo state and search memory with cortex_search when prior context may exist.
2. Use Planner-style structure: objective, constraints, affected files, implementation steps, tests, rollback/resume notes.
3. Decompose work into small checkpoints that can be committed and pushed independently.
4. Save the plan as .cortex/plans/YYYY-MM-DD-<topic>.md when the user wants a durable artifact.
5. Do not assign micode agents. Map work to OMX roles: Chief, Planner, Lead, Worker, Reviewer, Critic, Researcher, Thinker, Tracker, Spotter.
6. End with the first concrete implementation step and recommended verification.`
