# OMX Final Handoff — Project Complete

## Project

**oh-my-cortex (OMX)** — a cognitive operating system for OpenCode.

```
Location: D:\CODING PROJECT\Cortex\oh-my-cortex
Repo: https://github.com/michaelxer/oh-my-cortex
Branch: dev
npm: https://www.npmjs.com/package/oh-my-cortex
Version: 0.1.0 (published)
```

## Owner

- GitHub: `michaelxer`
- Also owns: [oh-my-crew (OMC)](https://github.com/michaelxer/oh-my-crew)
- OMX is NOT by `enowdev` — that was a previous error. All references corrected.

## Project Relationships

| Project | Owner | Relationship to OMX |
|---------|-------|---------------------|
| [oh-my-openagent (OmO)](https://github.com/code-yeongyu/oh-my-openagent) | code-yeongyu | **Upstream source.** OMX is built on OmO's codebase. Credited in README. Not a GitHub fork — standalone repo with OmO's git history preserved (hence 200+ contributors showing). |
| [oh-my-crew (OMC)](https://github.com/michaelxer/oh-my-crew) | michaelxer | **Sibling project.** Another fork of OmO with nautical/crew theming. Mentioned in OMX README for marketing. Separate repo, separate npm package. |
| [OpenCode](https://opencode.ai) | OpenCode team | **Platform.** OMX is a plugin for OpenCode. Uses `@opencode-ai/plugin` SDK. |

### Key Distinctions

- OMX is NOT a GitHub fork of OmO — it's a standalone repo that contains OmO's git history
- OMX credits `code-yeongyu/oh-my-openagent` in README and LICENSE (SUL-1.0)
- No references to `enowdev` anywhere
- OMC is mentioned for marketing only (same owner)
- The 200+ contributors on GitHub are from the inherited git history — this is intentional and left as-is

## Completed Phases

### Phase 1: Fork & Rename (commit c6f9c398)
- Package renamed to `oh-my-cortex`
- Config files renamed (`oh-my-cortex.jsonc`, `oh-my-cortex.schema.json`)
- All internal references updated
- Plugin ID: `oh-my-cortex`

### Phase 2: Prompt Rewriting (commit 382b19a1)
- All 11 agent prompts rewritten with cognitive framework
- Agent names: Chief, Founder, Thinker, Researcher, Tracker, Planner, Reviewer, Critic, Lead, Worker, Spotter
- 2 primary agents (Chief, Founder) + 9 subagents
- Activation keyword: `deepwork` / `dw` (not `ultrawork`)
- Loop command: `cortex-loop` / `dw-loop` (not `ralph-loop`)
- No persona names — adaptive tone
- Cortex Operating Principles injected into all agents

### Phase 3: OMX-Exclusive Features (commit 90fe349c)
- **Challenge Engine hook** — 4-level anti-sycophancy (Nudge/Probe/Mirror/Red Team)
- **Domain Lens hook** — auto-detects health/legal/financial/security/political
- **Checkpoint Counter hook** — triggers summary at ~20 exchanges
- **Decision Framework tool** — structured Option A/B/C analysis
- **7 skills** — reasoning-toolkit, sensitive-drafting, 5 domain skills
- **4 commands** — /challenge, /checkpoint, /lens, /decide
- **5 categories** — communication, strategic-analysis, coaching, crisis, research-synthesis

### Phase 4: Polish (commits 9964a9f6, 6635f75d)
- **96 unit tests** across 6 test files for all Phase 3 hooks/tools
- **README.md** — full rewrite with OMX positioning, badges (npm version, downloads, stars, license, OpenCode plugin)
- **Translated READMEs** — ja, ko, ru, zh-cn all rewritten with OMX content
- **docs/guide/overview.md** — title and intro updated for OMX
- **CLI installer** — already OMX-branded (verified, no changes needed)
- **npm published** — `oh-my-cortex@0.1.0` live on npmjs.com

## Architecture Summary

- **2 primary agents**: Chief (orchestrator), Founder (autonomous deep worker)
- **9 subagents**: Thinker, Researcher, Tracker, Planner, Reviewer, Critic, Lead, Worker, Spotter
- **Model config**: Installer-based — asks user's subscriptions, auto-matches strongest model per agent via fallback chains
- **Activation**: `deepwork` / `dw`
- **No persona names**: Adaptive tone, no J.A.R.V.I.S./Architect identity
- **Cross-plugin safe**: Runs alongside OmO and OMC without conflicts
- **Cognitive framework**: Task classification, challenge behavior, domain lenses, confidence labels, checkpoint tracking

## Verification Commands

```bash
bun run typecheck          # tsc --noEmit (zero errors)
bun run build              # 4.24 MB bundle + schema
bun test src/hooks/challenge-engine/ src/hooks/domain-lens/ src/hooks/checkpoint-counter/ src/tools/decision-framework/
                           # 96 tests, 0 failures
bun -e "const mod = await import('./dist/index.js'); console.log(mod.default?.id ?? 'missing-id')"
                           # Expected: oh-my-cortex
npm view oh-my-cortex version
                           # Expected: 0.1.0
```

## Constraints for Future Work

- Work only inside `D:\CODING PROJECT\Cortex\oh-my-cortex`
- Do not run `bun install` unless user explicitly allows
- Do not commit/push unless user explicitly asks
- Git identity: `michaelxer` / `michaelxer@users.noreply.github.com`
- Credit `code-yeongyu/oh-my-openagent` in README only
- No `enowdev` references anywhere
- `michaelxer/oh-my-crew` mentioned for marketing only

## Key Files

| File | Purpose |
|------|---------|
| `README.md` | Main README with badges, features, installation |
| `README.ja.md` / `README.ko.md` / `README.ru.md` / `README.zh-cn.md` | Translated READMEs |
| `package.json` | npm package config (name: oh-my-cortex, version: 0.1.0) |
| `src/hooks/challenge-engine/` | 4-level anti-sycophancy hook |
| `src/hooks/domain-lens/` | Auto-detecting domain caution hook |
| `src/hooks/checkpoint-counter/` | Exchange counter with auto-summary |
| `src/tools/decision-framework/` | Structured decision analysis tool |
| `OMX-ARCHITECTURE.md` (in D:\CODING PROJECT\Cortex\) | Full architecture spec v3.0 |
| `handoff-04.md` | Previous handoff (Phase 4 start) |
| `handoff-05.md` | This file (final state) |

## Resume Prompt

```
You are continuing work on oh-my-cortex (OMX), located at:
D:\CODING PROJECT\Cortex\oh-my-cortex

Repo: https://github.com/michaelxer/oh-my-cortex (branch: dev)
npm: oh-my-cortex@0.1.0 (published)
Owner: michaelxer (NOT enowdev)

Read handoff-05.md in the project root for full context.

All 4 phases are COMPLETE:
- Phase 1: Fork/rename
- Phase 2: Prompt rewriting
- Phase 3: OMX-exclusive features
- Phase 4: Polish, tests, READMEs, npm publish

Key relationships:
- Built on code-yeongyu/oh-my-openagent (credited in README, not a GitHub fork)
- Sibling project: michaelxer/oh-my-crew (marketing mention only)
- Plugin for OpenCode (opencode.ai)

Key rules:
- Credit code-yeongyu/oh-my-openagent in README only
- No enowdev references anywhere
- michaelxer/oh-my-crew mentioned for marketing only
- 2 primary agents (Chief, Founder) + 9 subagents
- Activation: deepwork/dw, cortex-loop/dw-loop
- No persona names — adaptive tone
- All changes in oh-my-cortex folder only
- Do not run bun install unless explicitly allowed
```
