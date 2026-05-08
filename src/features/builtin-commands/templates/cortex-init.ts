export const CORTEX_INIT_TEMPLATE = `Initialize OMX project memory for this repository.

Goal:
- Create durable, project-specific context that helps future OMX sessions resume accurately.
- Respect existing project instructions and avoid overwriting human-authored docs.

Instructions:
1. Inspect the repository structure, package/config files, tests, build scripts, and existing instruction files.
2. Read existing AGENTS.md files first. Treat them as project authority.
3. Check for existing ARCHITECTURE.md, CODE_STYLE.md, README.md, docs/, and .cortex/.
4. If durable docs are missing, create concise drafts:
   - ARCHITECTURE.md: system map, key modules, data/control flow, extension points, test strategy.
   - CODE_STYLE.md: local conventions, naming, formatting, testing, dependency rules, safety constraints.
   - .cortex/plans/README.md: how OMX plans should be stored for this project.
5. If durable docs already exist, update only when the user explicitly asked for updates. Otherwise report recommended changes.
6. Do not replace AGENTS.md. If AGENTS.md needs changes, propose a focused patch and explain why.
7. Do not invent architecture. Mark uncertain areas as "needs verification" and list the files that should be checked next.
8. After changes, report files created or updated and recommend a /ledger checkpoint.

Keep the result operational and compact. This is project memory, not marketing copy.`
