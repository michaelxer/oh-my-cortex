export const MINDMODEL_TEMPLATE = `Create or update OMX project mindmodel constraints.

Goal:
- Capture project-specific patterns, preferences, invariants, and "do not repeat this mistake" guidance.
- Store them under .cortex/mindmodel so OMX can inject them automatically in future sessions.

Instructions:
1. Inspect existing AGENTS.md, ARCHITECTURE.md, CODE_STYLE.md, .cortex/mindmodel, and recent repo patterns.
2. Create .cortex/mindmodel if it does not exist.
3. Write focused markdown files such as:
   - .cortex/mindmodel/coding-patterns.md
   - .cortex/mindmodel/testing.md
   - .cortex/mindmodel/release-safety.md
4. Keep each rule concrete and verifiable. Include examples only when they prevent ambiguity.
5. Do not duplicate generic coding advice or overwrite AGENTS.md.
6. Mark uncertain rules as provisional and cite the files that justify them.
7. After updating mindmodel files, recommend /ledger so the new constraint set is visible in continuity memory.`
