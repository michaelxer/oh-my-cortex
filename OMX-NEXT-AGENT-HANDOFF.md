# OMX Next-Agent Handoff

## Project

**oh-my-cortex (OMX)** — a cognitive operating system for OpenCode.

```
Location: D:\CODING PROJECT\handover\Cortex\oh-my-cortex
Repo: https://github.com/michaelxer/oh-my-cortex
Branch: dev
```

## Owner

- GitHub: `michaelxer`
- Also owns: [oh-my-crew (OMC)](https://github.com/michaelxer/oh-my-crew)
- OMX is NOT by `enowdev` — that was a previous error. All references corrected.

## Constraints

- Work only inside `D:\CODING PROJECT\handover\Cortex\oh-my-cortex`
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
Files: 833 changed
```

What Phase 1 accomplished:
- Package identity: `oh-my-cortex`
- 11 agents renamed: Chief, Founder, Thinker, Researcher, Tracker, Planner, Reviewer, Critic, Lead, Worker, Spotter
- 2 primary agents (Chief, Founder) + 9 subagents
- Activation: `deepwork` / `dw` (replaces ultrawork/ulw)
- Loop: `cortex-loop` (replaces ralph-loop)
- Tool: `call_cortex_agent` (replaces call_omo_agent)
- State: `.cortex/` and `workstate.json` (replaces .sisyphus/ and boulder.json)
- System directive: `OH-MY-CORTEX`
- Cross-plugin isolation: `isOmxAgent()` guard + `call_omo_agent` blocked on all agents
- Session Guardian skill added
- Cortex Operating Principles injected into agent prompts
- Installer redesigned: agent-model table, commands list, coexistence note, post-install model customization
- All URLs: `michaelxer/oh-my-cortex`
- README: product-focused, showcases OMX unique features, minimal OmO mention
- Zero inherited OmO/OMC/enowdev branding in runtime source
- Typecheck: passed
- Build: passed (verified by previous agent)

## Architecture (Finalized)

- **2 primary agents**: Chief (orchestrator), Founder (autonomous deep worker)
- **9 subagents**: Thinker, Researcher, Tracker, Planner, Reviewer, Critic, Lead, Worker, Spotter
- **Model config**: Installer-based — asks user's subscriptions, auto-matches strongest model per agent via fallback chains
- **Post-install**: User can customize any agent's model after seeing the auto-assignment
- **Activation**: `deepwork` / `dw`
- **No persona names**: Adaptive tone, no J.A.R.V.I.S./Architect identity
- **Cross-plugin safe**: Runs alongside OmO and OMC without conflicts

## OMX-Exclusive Features (To Be Built in Phase 2-3)

1. **Challenge Engine** — 4-level anti-sycophancy hook (Nudge/Probe/Mirror/Red Team)
2. **Domain Lenses** — Auto-detect health/legal/financial/security/political and adjust caution
3. **Reasoning Toolkit** — Loadable skill with cognitive frameworks + confidence labels
4. **Checkpoint Protocol** — Auto-summary at ~20 exchanges
5. **Communication Mode** — Category + skill for sensitive message drafting
6. **Decision Framework** — Custom tool for structured Option A/B/C analysis
7. **5 new categories**: communication, strategic-analysis, coaching, crisis, research-synthesis
8. **5 new commands**: /challenge, /checkpoint, /lens, /decide, /dw-loop

## What Needs To Be Done Next

### Phase 2: Prompt Rewriting (NEXT)

This is where OMX stops being a renamed OmO and becomes its own product. Rewrite all agent system prompts:

1. **Chief** — Full cognitive framework: task classification (goal/stakes/risk/urgency), challenge behavior (Level 1 default), domain awareness, adaptive tone, checkpoint tracking
2. **Thinker** — All-domain expertise: business strategy, risk/security, health, legal, financial, political + code architecture. Confidence labels. Challenge weak reasoning.
3. **Planner** — Domain-adaptive interview styles: code refactoring gets safety questions, business decisions get stakeholder questions, crisis gets triage questions
4. **Founder** — Autonomous deep worker for ANY domain, not just code
5. **All agents** — Inject Cortex Operating Principles (classify, challenge, separate facts/inferences, confidence labels)

Source material for prompts: `D:\CODING PROJECT\handover\Cortex\The Architect v4.0.md` — extract domain expertise content for Thinker, challenge protocols for Chief, interview styles for Planner. Do NOT copy directly — rebuild for multi-agent context.

### Phase 3: OMX-Exclusive Features

6. Implement Challenge Engine hook
7. Implement Domain Lens Detector hook
8. Implement Checkpoint Counter hook
9. Create Reasoning Toolkit skill
10. Create Sensitive Drafting skill
11. Create 5 Domain Lens skills
12. Implement Decision Framework tool
13. Create new commands (/challenge, /checkpoint, /lens, /decide)
14. Add new categories (communication, strategic-analysis, coaching, crisis, research-synthesis)

### Phase 4: Polish

15. Update translated READMEs (ja, ko, ru, zh-cn) with OMX content
16. Update docs/ with OMX-specific guides
17. Update CLI installer prompts
18. End-to-end testing
19. npm publish as oh-my-cortex

## Verification Commands

```bash
bun run typecheck
bun run build
bun -e "const mod = await import('./dist/index.js'); console.log(mod.default?.id ?? 'missing-id')"
# Expected: oh-my-cortex
```

## Forbidden Terms Audit

```bash
# Run from oh-my-cortex/
# Should return ZERO results (except credit lines in README)
rg -n "oh-my-opencode|oh-my-crew|oMoMoMo|sisyphuslabs|justsisyphus|Legitimate Craftsman|on steroids|OH-MY-OPENCODE|generateOmo|writeOmo|OmoConfig|isOmoSession|enowdev" src README.md docs script bin assets package.json --glob "!dist/**" --glob "!node_modules/**"
```

Allowed exceptions:
- `README.md`: credit line linking to `code-yeongyu/oh-my-openagent`
- `package.json`: `@code-yeongyu/comment-checker` dependency
- `src/hooks/comment-checker/`: references to `@code-yeongyu/comment-checker` npm package
- `src/shared/agent-tool-restrictions.ts`: `call_omo_agent: false` (blocking OmO's tool)

## Context Files

| File | Purpose |
|---|---|
| `OMX-ARCHITECTURE.md` (in Cortex/) | v3.0 architecture spec — agents, features, categories, skills, hooks |
| `The Architect v4.0.md` (in Cortex/) | Source material for Phase 2 prompt rewriting |
| `NEXUS-ARCHITECT-UNIFIED.md` (in Cortex/) | Historical — merged prompt, superseded |

## Resume Prompt

```
You are continuing work on oh-my-cortex (OMX), located at:
D:\CODING PROJECT\handover\Cortex\oh-my-cortex

Repo: https://github.com/michaelxer/oh-my-cortex (branch: dev)
Owner: michaelxer (NOT enowdev)

Read OMX-NEXT-AGENT-HANDOFF.md in the project root for full context.

Phase 1 (fork/rename) is COMPLETE and pushed. Start Phase 2: prompt rewriting.

Key rules:
- Credit code-yeongyu/oh-my-openagent in README only
- No enowdev references anywhere
- michaelxer/oh-my-crew mentioned for marketing only
- 2 primary agents (Chief, Founder) + 9 subagents
- Activation: deepwork/dw, cortex-loop
- No persona names — adaptive tone
- All changes in oh-my-cortex folder only
```
