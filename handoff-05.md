# OMX Final Handoff — Project Complete + Upstream Sync Guide

## Project

**oh-my-cortex (OMX)** — a cognitive operating system for OpenCode.

```
Location: D:\CODING PROJECT\Cortex\oh-my-cortex
Repo: https://github.com/michaelxer/oh-my-cortex
Branch: dev
npm: https://www.npmjs.com/package/oh-my-cortex
Version: 0.1.0 (published)
Upstream: https://github.com/code-yeongyu/oh-my-openagent (NOT a GitHub fork)
```

## Owner

- GitHub: `michaelxer`
- Also owns: [oh-my-crew (OMC)](https://github.com/michaelxer/oh-my-crew)
- OMX is NOT by `enowdev` — that was a previous error. All references corrected.

## Project Relationships

| Project | Owner | Relationship to OMX |
|---------|-------|---------------------|
| [oh-my-openagent (OmO)](https://github.com/code-yeongyu/oh-my-openagent) | code-yeongyu | **Upstream source.** OMX is built on OmO's codebase. Credited in README. Not a GitHub fork — standalone repo with OmO's git history preserved. |
| [oh-my-crew (OMC)](https://github.com/michaelxer/oh-my-crew) | michaelxer | **Sibling project.** Another fork of OmO with nautical/crew theming. Mentioned in OMX README for marketing only. |
| [OpenCode](https://opencode.ai) | OpenCode team | **Platform.** OMX is a plugin for OpenCode. Uses `@opencode-ai/plugin` SDK. |

---

## CRITICAL: Upstream Sync Protocol

OMX is a standalone repo (NOT a GitHub fork). It does NOT automatically receive bug fixes, new model support, or feature updates from OmO. Syncing must be done manually.

### Setup (one-time)

```bash
cd "D:\CODING PROJECT\Cortex\oh-my-cortex"
git remote add upstream https://github.com/code-yeongyu/oh-my-openagent.git
```

### Check What's New

```bash
git fetch upstream
git log upstream/master --oneline -30
```

### Sync Procedure

```bash
# 1. Fetch upstream changes
git fetch upstream

# 2. Review what changed (DO NOT blindly merge)
git log upstream/master --oneline -30
git diff dev..upstream/master --stat

# 3. Cherry-pick SPECIFIC commits you want (never merge entire branch)
git cherry-pick <commit-hash>

# 4. If conflicts arise, resolve them maintaining OMX naming/branding
# 5. Run verification after every sync
bun run typecheck
bun run build
bun test src/hooks/challenge-engine/ src/hooks/domain-lens/ src/hooks/checkpoint-counter/ src/tools/decision-framework/
```

### WHAT TO SYNC (safe to port)

| Category | Examples | Why Safe |
|----------|----------|----------|
| Bug fixes in core hooks | hashline-edit, session-recovery, runtime-fallback, model-fallback | Infrastructure code, no branding |
| New model/provider support | New model IDs, provider configs, fallback chains | Additive, no conflicts |
| OpenCode SDK compatibility | Plugin API updates, new hook events | Required to stay compatible |
| Tool improvements | LSP tools, AST-grep, grep, glob | Pure utility, no branding |
| Build/CI fixes | Build scripts, test infrastructure | Infrastructure |
| Security fixes | Any vulnerability patches | Critical |

### WHAT TO NEVER SYNC (will break OMX)

| Category | Why Dangerous |
|----------|---------------|
| Agent prompts (`src/agents/`) | OMX has completely rewritten prompts with cognitive framework. OmO uses Greek mythology names (Sisyphus, Hephaestus, etc.) |
| Agent names/display names | OMX uses Chief/Founder/Thinker/etc. OmO uses Sisyphus/Hephaestus/Oracle/etc. |
| Keyword detector (`deepwork` vs `ultrawork`) | OMX activation is `deepwork`/`dw`. OmO uses `ultrawork`/`ulw`. |
| Loop hooks (`cortex-loop` vs `ralph-loop`) | Completely renamed in OMX |
| README / docs / branding | OMX has its own identity |
| Package name / config file names | `oh-my-cortex` not `oh-my-opencode` |
| Any file that references "Sisyphus", "Hephaestus", "Atlas", "Prometheus", "Momus", "Metis" | These are OmO agent names, not OMX |

### WHAT NEEDS ADAPTATION (sync but modify)

| Category | What To Change |
|----------|----------------|
| New hooks that reference agent names | Replace OmO names with OMX names (Sisyphus→Chief, etc.) |
| New categories with model requirements | Add to OMX's model requirements with OMX agent names |
| CLI installer changes | Keep OMX branding, port functionality |
| New skills | Port the skill, ensure it references OMX agents/commands |
| Schema changes | Port but ensure `oh-my-cortex` naming |

### Agent Name Mapping (for adaptation)

| OmO Name | OMX Name |
|----------|----------|
| Sisyphus | Chief |
| Hephaestus | Founder |
| Oracle | Thinker |
| Librarian | Researcher |
| Explore | Tracker |
| Prometheus | Planner |
| Metis | Reviewer |
| Momus | Critic |
| Atlas | Lead |
| Sisyphus-Junior | Worker |
| Multimodal-Looker | Spotter |

### Command Mapping

| OmO | OMX |
|-----|-----|
| `ultrawork` / `ulw` | `deepwork` / `dw` |
| `ralph-loop` / `/ulw-loop` | `cortex-loop` / `/dw-loop` |
| `/cancel-ralph` | `/cancel-cortex` |

---

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
- **README.md** — full rewrite with OMX positioning, badges
- **Translated READMEs** — ja, ko, ru, zh-cn all rewritten
- **docs/guide/overview.md** — updated for OMX
- **npm published** — `oh-my-cortex@0.1.0` live

---

## Architecture Summary

- **2 primary agents**: Chief (orchestrator), Founder (autonomous deep worker)
- **9 subagents**: Thinker, Researcher, Tracker, Planner, Reviewer, Critic, Lead, Worker, Spotter
- **Model config**: Installer-based — asks user's subscriptions, auto-matches strongest model per agent via fallback chains
- **Activation**: `deepwork` / `dw`
- **No persona names**: Adaptive tone
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

## Constraints

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
| `handoff-05.md` | This file (final state + sync guide) |

---

## Resume Prompt (copy-paste for next agent)

```
You are working on oh-my-cortex (OMX), located at:
D:\CODING PROJECT\Cortex\oh-my-cortex

Repo: https://github.com/michaelxer/oh-my-cortex (branch: dev)
Upstream: https://github.com/code-yeongyu/oh-my-openagent (NOT a GitHub fork)
npm: oh-my-cortex@0.1.0 (published)
Owner: michaelxer (NOT enowdev)

Read handoff-05.md in the project root for FULL context including:
- Project relationships and history
- Upstream sync protocol (CRITICAL — read the sync rules)
- Agent name mapping (OmO → OMX)
- What to sync vs what to NEVER sync vs what needs adaptation

YOUR ASSIGNMENT: Sync upstream updates from oh-my-openagent into oh-my-cortex.

RULES:
1. NEVER blindly merge upstream. Cherry-pick specific commits only.
2. NEVER sync agent prompts, agent names, or branding — OMX has its own identity.
3. SAFE to sync: bug fixes, new model support, SDK compatibility, tool improvements, security fixes.
4. ADAPT when syncing: anything that references OmO agent names must be renamed to OMX names (see mapping in handoff-05.md).
5. After every sync: run typecheck, build, and tests. All must pass.
6. OMX agents: Chief, Founder, Thinker, Researcher, Tracker, Planner, Reviewer, Critic, Lead, Worker, Spotter
7. OMX activation: deepwork/dw (NOT ultrawork/ulw)
8. OMX loop: cortex-loop/dw-loop (NOT ralph-loop/ulw-loop)
9. Do not run bun install unless explicitly allowed.
10. Do not commit/push unless explicitly asked.

WORKFLOW:
1. git remote add upstream https://github.com/code-yeongyu/oh-my-openagent.git (if not already added)
2. git fetch upstream
3. git log upstream/master --oneline -30 (show user what's new)
4. Discuss with user which commits to port
5. Cherry-pick and adapt (rename OmO references to OMX)
6. Verify: typecheck + build + tests
7. Commit only when user approves
```
