# OMX Next-Agent Handoff

## Project

Project: **oh-my-cortex (OMX)**

Location:

```text
D:\CODING PROJECT\handover\Cortex\oh-my-cortex
```

OMX is a fork inspired by `oh-my-openagent`, rebuilt as a multi-agent cognitive operating system for OpenCode. The goal is to keep the strong OpenCode agent/plugin infrastructure while replacing inherited product identity, old agent names, and old prompt assumptions with the OMX architecture.

## User Constraints

- Work only inside:

```text
D:\CODING PROJECT\handover\Cortex\oh-my-cortex
```

- Do not edit the original OmO reference folder, OMC checkout, global OpenCode install, or files outside `oh-my-cortex`.
- Do not run `bun install` unless the user explicitly allows it.
- Do not create a git repo, commit, push, or install globally unless the user explicitly asks.
- Keep OmO credit in the README, but do not keep OmO/old agent branding in runtime source or product-facing docs.

## Current Status

Phase 1 fork/rename is substantially complete.

Completed:

- Package identity renamed to `oh-my-cortex`.
- Runtime plugin ID smoke test returns `oh-my-cortex`.
- Agent names changed to OMX architecture:
  - Primary: `chief`, `founder`
  - Subagents: `thinker`, `researcher`, `tracker`, `planner`, `reviewer`, `critic`, `lead`, `worker`, `spotter`
- Old OmO/Greek agent names removed from source/build search results:
  - Sisyphus, Hephaestus, Prometheus, Atlas, Oracle, Librarian, Metis, Momus
- Tool rename completed:
  - `call_omo_agent` -> `call_cortex_agent`
  - folder: `src/tools/call-cortex-agent`
- Runtime project state path renamed:
  - old `.sisyphus/` and accidental `.chief/` -> `.cortex/`
  - old `boulder.json` -> `workstate.json`
- Loop/activation naming:
  - `deepwork` / `dw`
  - `cortex-loop`
- Session Guardian skill added and included in built-in skills/schema.
- Shared Cortex Operating Principles added to agent identity preamble:
  - classify goal/stakes/risk/urgency
  - challenge assumptions
  - use domain lenses
  - separate facts/inferences/speculation
  - confidence labels for material uncertainty
  - forwardable/auditable communication
- README replaced with OMX-specific content and a clean credit line to `oh-my-openagent`.

Verification already run:

```bash
bun run typecheck
bun run build
bun -e "const mod = await import('./dist/index.js'); console.log(mod.default?.id ?? 'missing-id')"
```

Results:

- Typecheck passed.
- Build passed.
- Runtime smoke printed:

```text
oh-my-cortex
```

Cleanup scan already run against source/build/schema found no inherited old agent/tool/state names, except the intentional README credit link to `oh-my-openagent`.

## Important Current Design Choices

- Keep installer-based model config. Do not hardcode local models as the only path.
- Keep only 2 primary agents: Chief and Founder.
- Planner is a subagent, not a primary UI agent.
- Lead is a subagent and activated through `/start-work`.
- No persona names or myth identity in prompts.
- Runtime state should use `.cortex/`.
- OmO is credited in README only.
- OMX must coexist safely with OmO and OMC when all three are loaded.

## Cross-Plugin Isolation (Added Post-Phase-1)

OMX is designed to run alongside OmO and OMC simultaneously. The user uses OmO/OMC for coding and OMX for general-purpose work (business, strategy, health, communication).

Isolation mechanisms added:

1. **`src/shared/omx-agent-guard.ts`** — `isOmxAgent()` function that checks whether an agent belongs to OMX. Use this in hooks to skip execution when the active agent belongs to another plugin.

2. **`src/shared/agent-tool-restrictions.ts`** — All OMX agents now deny `call_omo_agent` via `FOREIGN_AGENT_TOOLS`. This prevents Chief/Founder/Workers from accidentally spawning OmO/OMC subagents (Oracle, Librarian, etc.) when those plugins are also loaded.

3. **Hook guards** — OMX-exclusive hooks (challenge-engine, domain-lens-detector, checkpoint-counter, etc.) should use `isOmxAgent()` to skip execution when the active agent is not an OMX agent. This prevents OMX hooks from interfering with OmO/OMC sessions.

What OMX cannot control: OmO/OMC hooks will still fire on OMX agent sessions (e.g., OmO's keyword detector scans for "ultrawork" in Chief sessions). This is harmless because OMX uses different keywords ("deepwork") and different agent names.

Typecheck passed after these changes.

## Remaining Forbidden Name Cleanup (Completed Post-Phase-1)

The following files were cleaned of inherited OmO/OMC names:

- `src/shared/system-directive.ts` — `OH-MY-OPENCODE` → `OH-MY-CORTEX`, `RALPH_LOOP` → `CORTEX_LOOP`
- `src/tools/delegate-task/category-resolver.ts` — `Oh-My-OpenCode` → `Oh-My-Cortex`
- `src/hooks/cortex-loop/continuation-prompt-builder.ts` — `RALPH LOOP` → `CORTEX LOOP`
- `src/features/builtin-commands/templates/cortex-loop.ts` — `RALPH_LOOP_TEMPLATE` → `CORTEX_LOOP_TEMPLATE`, `ULW_LOOP_TEMPLATE` → `DEEPWORK_LOOP_TEMPLATE`, `CANCEL_RALPH_TEMPLATE` → `CANCEL_CORTEX_TEMPLATE`
- `src/features/builtin-commands/commands.ts` — updated imports to match renamed exports
- Multiple test files updated to use OMX names instead of OmO names

Final sweep confirmed zero forbidden names in source.

## Likely Next Work

1. ~~Review the current diff for accidental over-broad rename artifacts.~~ DONE — cleaned up in post-Phase-1 session.
   - ~~Earlier broad replacements caused words like `autonomous` to become malformed, then were fixed.~~
   - ~~Still worth scanning natural-language docs/prompts for awkward wording.~~

2. Run targeted tests beyond typecheck/build.
   Suggested first tests:

```bash
bun test src/agents/types.test.ts
bun test src/plugin-handlers/agent-config-handler.test.ts
bun test src/tools/call-cortex-agent/tools.test.ts
bun test src/hooks/planner-md-only/index.test.ts
bun test src/features/work-state/storage.test.ts
```

3. Inspect the generated schema:

```text
assets/oh-my-cortex.schema.json
```

Confirm it exposes `chief_agent`, `cortex_loop`, `.cortex` examples, and no inherited old agent keys.

4. Continue Phase 2 prompt rewrite.
   - Chief should become a true OMX orchestrator, not just a renamed coding orchestrator.
   - Founder should support autonomous work beyond code when appropriate.
   - Thinker should be all-domain, not just code architecture.
   - Planner/Reviewer/Critic should include domain-adaptive planning, stakeholder/risk/communication checks.

5. Continue Phase 3 OMX-exclusive features.
   - Domain lenses
   - challenge protocols
   - confidence labels
   - session lifecycle/checkpoint behavior
   - anti-sycophancy behavior

## Suggested Audit Commands

Run from:

```text
D:\CODING PROJECT\handover\Cortex\oh-my-cortex
```

Search for forbidden inherited names:

```bash
rg -n "Sisyphus|sisyphus|Hephaestus|hephaestus|Prometheus|prometheus|Atlas|atlas|Oracle|oracle|Librarian|librarian|Metis|metis|Momus|momus|call_omo_agent|omo_agent|\\.sisyphus|\\.chief/|\\.chief\\\\|boulder|Greek|Legitimate Craftsman|justsisyphus|sisyphuslabs|clio-agent|OhMyOpenCode|oh-my-opencode|oh-my-crew" src README.md docs script bin assets package.json --glob "!dist/**" --glob "!node_modules/**"
```

Intentional allowed result:

```text
README.md: credit line to https://github.com/code-yeongyu/oh-my-openagent
```

Build verification:

```bash
bun run typecheck
bun run build
bun -e "const mod = await import('./dist/index.js'); console.log(mod.default?.id ?? 'missing-id')"
```

Expected smoke output:

```text
oh-my-cortex
```

## Prompt To Give Another Agent

Use this exact prompt:

```text
You are continuing work on oh-my-cortex (OMX), located at:

D:\CODING PROJECT\handover\Cortex\oh-my-cortex

Work only inside this folder. Do not edit the original OmO reference, OMC checkout, global OpenCode install, or anything outside oh-my-cortex. Do not run bun install, create a git repo, commit, push, or install globally unless explicitly asked.

OMX is a fork inspired by oh-my-openagent, but it must have its own runtime identity. Keep OmO credit in README only. Do not keep inherited old agent/product names in source, docs, build output, schema, prompts, or runtime config.

Current architecture:
- Primary agents: chief, founder
- Subagents: thinker, researcher, tracker, planner, reviewer, critic, lead, worker, spotter
- Activation: deepwork / dw
- Loop: cortex-loop
- Direct agent tool: call_cortex_agent
- Runtime project state directory: .cortex/
- Work state file: workstate.json
- README may mention oh-my-openagent only in the credits section.

Already completed:
- Package/runtime identity renamed to oh-my-cortex.
- Old agent names such as Sisyphus, Hephaestus, Prometheus, Atlas, Oracle, Librarian, Metis, and Momus were removed from source/build scans.
- call_omo_agent was renamed to call_cortex_agent.
- .sisyphus and accidental .chief runtime state paths were renamed to .cortex.
- boulder.json was renamed to workstate.json.
- Session Guardian skill was added.
- Cortex Operating Principles were injected into shared agent identity prompts.
- README was rewritten for OMX and includes OmO credit.
- bun run typecheck passed.
- bun run build passed.
- Runtime smoke import printed oh-my-cortex.

Your first job:
1. Audit the current tree for accidental rename artifacts or lingering inherited names.
2. Run focused tests around agent registration, call_cortex_agent, planner-md-only, and work-state.
3. Inspect assets/oh-my-cortex.schema.json for old keys and wrong examples.
4. Continue Phase 2 prompt rewriting so Chief, Founder, Thinker, Planner, Reviewer, Critic, Lead, Worker, Researcher, Tracker, and Spotter match the OMX architecture rather than merely renamed OmO prompts.

Use these verification commands from oh-my-cortex:

bun run typecheck
bun run build
bun -e "const mod = await import('./dist/index.js'); console.log(mod.default?.id ?? 'missing-id')"

Expected smoke output:
oh-my-cortex

Forbidden inherited terms to search for:
Sisyphus, Hephaestus, Prometheus, Atlas, Oracle, Librarian, Metis, Momus, call_omo_agent, .sisyphus, .chief, boulder, oh-my-opencode, oh-my-crew.

Allowed exception:
The README credits line may link to https://github.com/code-yeongyu/oh-my-openagent.

Be careful with broad replacements. Preserve valid OMX terms like cortex-loop and call_cortex_agent. Prefer targeted edits and run typecheck after each large rename.
```
