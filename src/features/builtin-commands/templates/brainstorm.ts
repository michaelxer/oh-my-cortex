export const BRAINSTORM_TEMPLATE = `Run an OMX-native brainstorm phase.

Goal:
- Explore a problem space before planning or implementation.
- Produce a durable design artifact under .cortex/designs.

Instructions:
1. Use Chief-style synthesis: clarify the goal, constraints, non-goals, risks, and success criteria.
2. Use Thinker/Researcher/Reviewer/Critic perspectives when useful, but do not create new micode-style agents.
3. Compare at least two viable approaches and one rejected approach.
4. Save the result as .cortex/designs/YYYY-MM-DD-<topic>-design.md when the user wants a durable artifact.
5. End with a crisp recommendation and the next command to run, usually /cortex-plan or /ledger.`
