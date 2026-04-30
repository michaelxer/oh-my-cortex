# OMX Phase 4 Handoff — Next Agent

## Project

**oh-my-cortex (OMX)** — a cognitive operating system for OpenCode.

```
Location: D:\CODING PROJECT\Cortex\oh-my-cortex
Repo: https://github.com/michaelxer/oh-my-cortex
Branch: dev
```

## Owner

- GitHub: `michaelxer`
- Also owns: [oh-my-crew (OMC)](https://github.com/michaelxer/oh-my-crew)
- OMX is NOT by `enowdev` — that was a previous error. All references corrected.

## Constraints

- Work only inside `D:\CODING PROJECT\Cortex\oh-my-cortex`
- Do not edit OmO reference folder, OMC checkout, or global OpenCode install
- Do not run `bun install` unless user explicitly allows
- Do not commit/push unless user explicitly asks
- Git identity already configured globally: `michaelxer` / `michaelxer@users.noreply.github.com`
- Credit `code-yeongyu/oh-my-openagent` in README only — no credit to enowdev or oh-my-china
- Mention `michaelxer/oh-my-crew` in README for marketing only (user owns OMC)

## Current Status

**Phase 1: COMPLETE.** Committed and pushed.
```
Commit: c6f9c398
Message: feat: oh-my-cortex (OMX) - Phase 1 fork complete
```

**Phase 2: COMPLETE.** Committed and pushed.
```
Commit: 382b19a1
Message: feat: Phase 2 prompt rewriting - cognitive framework for all agents
Files: 28 changed, 449 insertions, 193 deletions
```

**Phase 3: COMPLETE.** Committed and pushed.
```
Commit: 90fe349c
Message: feat: Phase 3 OMX-exclusive features - hooks, skills, commands, categories, tool
Files: 45 changed, 1284 insertions, 4631 deletions (snapshot regeneration accounts for deletions)
```

What Phase 3 accomplished:
- **Challenge Engine hook** (`src/hooks/challenge-engine/`): 4-level anti-sycophancy system (Nudge/Probe/Mirror/Red Team). Injects challenge prompts into every message via `chat.message` hook. Per-session state via Map. Detects `/challenge [1-4]` command marker to change levels.
- **Domain Lens hook** (`src/hooks/domain-lens/`): Auto-detects health/legal/financial/security/political territory via keyword regex matching. Injects domain-specific caution prompts. Supports `/lens [domain]` manual override that persists for session.
- **Checkpoint Counter hook** (`src/hooks/checkpoint-counter/`): Counts exchanges per session, triggers structured checkpoint summary at ~20 messages. Supports `/checkpoint` force trigger. Resets counter after injection.
- **7 skills**: `reasoning-toolkit` (14 cognitive frameworks + uncertainty template), `sensitive-drafting` (communication protocols), `domain-health`, `domain-legal`, `domain-financial`, `domain-security`, `domain-political`
- **4 commands**: `/challenge [1-4]`, `/checkpoint`, `/lens [domain]`, `/decide [topic]`
- **5 categories**: `communication` (Claude Opus), `strategic-analysis` (GPT-5.5 xhigh), `coaching` (Claude Opus), `crisis` (GPT-5.5), `research-synthesis` (GPT-5.5) — with full model fallback chains
- **Decision Framework tool** (`src/tools/decision-framework/`): Structured Option A/B/C analysis with evaluation matrix, tradeoffs, second-order effects, and recommendations. Registered in tool-registry.
- **Schema registrations**: 3 hook names, 7 skill names, 4 command names, 5 category names
- **Wiring**: All 3 hooks wired into `chat.message` pipeline in `create-transform-hooks.ts` and `chat-message.ts`
- Typecheck: passed
- Build: passed (4.24 MB bundle)
- Plugin load: verified (`oh-my-cortex`)
- Pre-existing test failures: unchanged (525 failures all from normalizeSDKResponse, os.tmpdir, getConfigDir — not our code)

## Architecture (Finalized)

- **2 primary agents**: Chief (orchestrator), Founder (autonomous deep worker)
- **9 subagents**: Thinker, Researcher, Tracker, Planner, Reviewer, Critic, Lead, Worker, Spotter
- **Model config**: Installer-based — asks user's subscriptions, auto-matches strongest model per agent via fallback chains
- **Activation**: `deepwork` / `dw`
- **No persona names**: Adaptive tone, no J.A.R.V.I.S./Architect identity
- **Cross-plugin safe**: Runs alongside OmO and OMC without conflicts
- **Cognitive framework**: Task classification, challenge behavior, domain lenses, confidence labels, checkpoint tracking — all injected into agent prompts AND enforced via hooks

## What Needs To Be Done Next — Phase 4: Polish

### 4.1 Unit Tests for Phase 3 Hooks (HIGH PRIORITY)
The 3 new hooks have no unit tests yet. Write tests following the project's `bun:test` pattern with given/when/then style.

**Files to create:**
- `src/hooks/challenge-engine/detector.test.ts` — test `parseChallengeCommand()`
- `src/hooks/challenge-engine/hook.test.ts` — test hook injection at each level, command detection, session isolation
- `src/hooks/domain-lens/detector.test.ts` — test `detectDomain()` and `parseLensCommand()`
- `src/hooks/domain-lens/hook.test.ts` — test auto-detection, manual override persistence, caution injection
- `src/hooks/checkpoint-counter/hook.test.ts` — test counter increment, threshold injection, reset, force trigger
- `src/tools/decision-framework/tool.test.ts` — test template generation with various args

### 4.2 Update Main README.md (HIGH PRIORITY)
The README still has upstream OmO content. Needs full rewrite with:
- OMX positioning (cognitive OS, not just coding tool)
- Feature table (Challenge Engine, Domain Lenses, Reasoning Toolkit, etc.)
- New commands table (`/challenge`, `/checkpoint`, `/lens`, `/decide`, `/deepwork`, `/dw-loop`)
- New categories table (communication, strategic-analysis, coaching, crisis, research-synthesis)
- Installation instructions
- Credits section (code-yeongyu/oh-my-openagent only)

### 4.3 Update Translated READMEs
- `README.ja.md` (Japanese)
- `README.ko.md` (Korean)
- `README.ru.md` (Russian)
- `README.zh-cn.md` (Chinese Simplified)

### 4.4 Update docs/ Directory
- OMX-specific guides for each feature
- Challenge Engine usage guide
- Domain Lenses reference
- Reasoning Toolkit framework reference

### 4.5 Update CLI Installer Prompts
- Reflect new skills in installer output
- Update category descriptions shown during setup

### 4.6 npm Publish Prep
- Verify `package.json` name is `oh-my-cortex`
- Verify dual-publish config if needed
- Ensure `bin` field and CLI entry points are correct

## Key Implementation Patterns (Reference)

### Hook pattern (proven in Phase 3):
1. Create `src/hooks/{hook-name}/` with `index.ts`, `hook.ts`, `types.ts`, `constants.ts`
2. Factory: `createXxxHook()` returns `{ "chat.message": async (input, output) => {...} }`
3. Inject into `output.parts[textPartIndex].text` (prepend prompt + `\n\n---\n\n` + original)
4. Register in `src/config/schema/hooks.ts` HookNameSchema
5. Export from `src/hooks/index.ts`
6. Create in `src/plugin/hooks/create-transform-hooks.ts` with `safeCreateHook()`
7. Wire in `src/plugin/chat-message.ts`

### Skill pattern:
1. Create `src/features/builtin-skills/skills/{skill-name}.ts`
2. Export `const xxxSkill: BuiltinSkill = { name, description, template }`
3. Export from `src/features/builtin-skills/skills/index.ts`
4. Add to array in `src/features/builtin-skills/skills.ts`
5. Add name to `src/config/schema/agent-names.ts` BuiltinSkillNameSchema

### Command pattern:
1. Create template in `src/features/builtin-commands/templates/{name}.ts`
2. Export `const XXX_TEMPLATE = \`...\``
3. Import and register in `src/features/builtin-commands/commands.ts`
4. Add name to `src/features/builtin-commands/types.ts` BuiltinCommandName union

### Category pattern:
1. Create definition in `src/tools/delegate-task/omx-categories.ts` (already exists)
2. Add model requirements in `src/shared/model-requirements.ts` CATEGORY_MODEL_REQUIREMENTS
3. Add name to `src/config/schema/categories.ts` BuiltinCategoryNameSchema

## Verification Commands

```bash
bun run typecheck
bun run build
bun -e "const mod = await import('./dist/index.js'); console.log(mod.default?.id ?? 'missing-id')"
# Expected: oh-my-cortex
bun test  # 525 pre-existing failures, 5278 pass — our code has zero new failures
```

## Context Files

| File | Purpose |
|---|---|
| `OMX-ARCHITECTURE.md` (in Cortex/) | v3.0 architecture spec — agents, features, categories, skills, hooks |
| `The Architect v4.0.md` (in Cortex/) | Source material for cognitive framework (used in Phase 2) |
| `handoff-03.md` (in project root) | Phase 3 handoff (predecessor to this file) |

## Resume Prompt

```
You are continuing work on oh-my-cortex (OMX), located at:
D:\CODING PROJECT\Cortex\oh-my-cortex

Repo: https://github.com/michaelxer/oh-my-cortex (branch: dev)
Owner: michaelxer (NOT enowdev)

Read handoff-04.md in the project root for full context.

Phase 1 (fork/rename) is COMPLETE and pushed.
Phase 2 (prompt rewriting) is COMPLETE and pushed.
Phase 3 (OMX-exclusive features) is COMPLETE and pushed.
Start Phase 4: Polish.

Key rules:
- Credit code-yeongyu/oh-my-openagent in README only
- No enowdev references anywhere
- michaelxer/oh-my-crew mentioned for marketing only
- 2 primary agents (Chief, Founder) + 9 subagents
- Activation: deepwork/dw, cortex-loop
- No persona names — adaptive tone
- All changes in oh-my-cortex folder only
- Do not run bun install unless explicitly allowed

Phase 4 priority order:
1. Unit tests for Phase 3 hooks (challenge-engine, domain-lens, checkpoint-counter, decision-framework)
2. Rewrite main README.md with OMX positioning and features
3. Update translated READMEs (ja, ko, ru, zh-cn)
4. Update docs/ with OMX-specific guides
5. Update CLI installer prompts
6. npm publish prep

Reference OMX-ARCHITECTURE.md in D:\CODING PROJECT\Cortex\ for detailed specs of each feature.
```
