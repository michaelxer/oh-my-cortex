export const LEDGER_TEMPLATE = `Create or update an OMX continuity ledger for this session.

Goal:
- Preserve enough durable context that a new agent can continue after context loss, app restart, or network drop.
- Store project memory under .cortex/ledgers, not thoughts/.

Instructions:
1. Inspect the live session, todo state, git status, recent diffs, and any relevant handoff/checkpoint files.
2. Create .cortex/ledgers if it does not exist.
3. Write or update a markdown file named .cortex/ledgers/CONTINUITY_<session-or-topic>.md.
4. Keep the ledger concise but operational. Include:
   - User request as-is
   - Current branch and latest pushed commit if known
   - Work completed
   - Files changed or important files inspected
   - Decisions and constraints
   - Verification already run
   - Next exact tasks
   - Risks or blockers
5. If a ledger already exists for this session/topic, update it instead of creating a duplicate.
6. Do not include secrets, API keys, private tokens, or irrelevant chat transcript.

After writing the ledger, report the ledger path and the next recommended checkpoint.`
