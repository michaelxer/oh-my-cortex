<div align="center">

# oh-my-cortex

**The cognitive operating system for OpenCode.**

[![npm version](https://img.shields.io/npm/v/oh-my-cortex?style=flat-square&color=cb3837&logo=npm&logoColor=white)](https://www.npmjs.com/package/oh-my-cortex)
[![npm downloads](https://img.shields.io/npm/dm/oh-my-cortex?style=flat-square&color=blue&logo=npm&logoColor=white)](https://www.npmjs.com/package/oh-my-cortex)
[![GitHub stars](https://img.shields.io/github/stars/michaelxer/oh-my-cortex?style=flat-square&color=gold&logo=github&logoColor=white)](https://github.com/michaelxer/oh-my-cortex)
[![License](https://img.shields.io/badge/license-SUL--1.0-green?style=flat-square)](LICENSE.md)
[![OpenCode Plugin](https://img.shields.io/badge/OpenCode-plugin-8A2BE2?style=flat-square&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiPjxwYXRoIGQ9Ik0xMiAyTDIgN2wxMCA1IDEwLTV6Ii8+PHBhdGggZD0iTTIgMTdsMTAgNSAxMC01Ii8+PHBhdGggZD0iTTIgMTJsMTAgNSAxMC01Ii8+PC9zdmc+)](https://opencode.ai)

---

*11 agents. 4-level challenge engine. 5 domain lenses. One command: `deepwork`.*

</div>

oh-my-cortex (OMX) is a multi-agent plugin that turns OpenCode into a thinking partner: not just for code, but for discussion, critical thinking, analysis, planning, business strategy, communication, risk, and everything in between.

Install OMX. Type `deepwork`. Get a team of 11 specialized agents that challenge your assumptions, adapt to sensitive domains, structure your decisions, and execute with precision.

---

## User Documentation

- **Start here:** [Beginner-friendly OMX User Guide](docs/guide/user-guide.md)
- **Install:** [Installation Guide](docs/guide/installation.md)
- **Model matching:** [OMX Agent-Model Matching Guide](docs/guide/agent-model-matching.md)
- **Orchestration:** [Orchestration Guide](docs/guide/orchestration.md)
- **Advanced reference:** [Complete Features Reference](docs/reference/features.md)

---

## Feature Snapshot

OMX is built for people who want an AI assistant that can think, discuss, analyze, plan, remember, and finish work instead of only answering one prompt at a time. Coding is supported, but it is not the whole point: OMX is meant for business decisions, strategy, research, writing, risk review, personal planning, operations, and other fields where ordinary coding agents usually feel too narrow.

| Feature | Short Explanation |
|---|---|
| **Chief and Founder** | Two primary agents: Chief leads and delegates, Founder handles autonomous deep work. |
| **Specialist subagents** | Thinker, Researcher, Tracker, Planner, Reviewer, Critic, Lead, Worker, and Spotter support the main agents. |
| **Deepwork** | Type `deepwork` or `dw` when you want OMX to understand the task, reason deeply, act, and verify. |
| **Cortex Loop** | `/cortex-loop` and `/dw-loop` keep a task moving until it is done or cancelled. |
| **Team Mode** | Creates a temporary team of agents for research, planning, review, and execution. |
| **Hyperplan** | Uses adversarial planning so weak assumptions get challenged before you trust the plan. |
| **Challenge Engine** | Four levels of pushback, from gentle nudge to red-team review. |
| **Domain Lenses** | Health, legal, financial, security, and political caution modes. |
| **Decision Framework** | `/decide` compares options, tradeoffs, risks, and recommendations. |
| **Cortex Memory** | `/ledger`, file-operation traces, and `cortex_search` help future sessions resume safely. |
| **Project Memory Init** | `/cortex-init` creates beginner-friendly project memory docs when they are missing. |
| **Workflow Commands** | `/brainstorm`, `/cortex-plan`, `/cortex-workflow`, and `/mindmodel` turn vague ideas into durable plans and project rules. |
| **Background Agents** | Lets research, implementation, and review happen in parallel. |
| **Code Navigation Tools** | LSP, AST-Grep, grep, glob, and visual inspection help the agent avoid guessing. |
| **Skills and MCPs** | Reusable workflows and extra tools for docs, browser work, git, review, frontend, and more. |
| **Model Fallbacks** | Agents can move through configured backup models if a provider fails. |
| **Installer** | `npx oh-my-cortex@latest install` sets up OpenCode, providers, agents, and config backups. |

For a plain-language walkthrough with examples, read the [User Guide](docs/guide/user-guide.md).

---

## Why OMX?

Most AI tools agree with everything you say. OMX pushes back.

Most AI tools only write code. OMX helps you think.

Most AI tools use one model for everything. OMX routes the right brain to the right job — automatically.

---

## What Makes OMX Different

### Challenge Engine

Your agents don't just execute — they challenge weak reasoning before it becomes a bad decision.

4 levels of pushback, from gentle nudge to full adversarial review:

| Level | Name | What Happens |
|---|---|---|
| 1 | **Nudge** | Points out one assumption or improvement (always active) |
| 2 | **Probe** | Shows tradeoffs, risks, blind spots, better options |
| 3 | **Mirror** | Names avoidance, weak logic, opportunity cost — then prescribes |
| 4 | **Red Team** | Attacks from competitor, skeptic, investor, regulator perspectives |

Set it manually with `/challenge 3` or let it activate automatically when you say "be honest" or "what am I missing."

### Domain Lenses

OMX detects when your conversation enters sensitive territory and adjusts automatically:

| Domain | What Changes |
|---|---|
| **Health** | Non-diagnostic. Recommends professional care. Evidence-informed only. |
| **Legal** | Conservative. Distinguishes information from advice. Jurisdiction-aware. |
| **Financial** | Data-driven. Flags risk tolerance. Separates info from financial advice. |
| **Security** | Triage first. Defensive only. Preserve evidence. Escalate to professionals. |
| **Political** | Stakeholder-aware. Face-saving. Protocol-conscious. |

Activate manually with `/lens security` or let OMX detect it from context.

### Beyond Code

OMX handles what other coding tools can't:

- **Discussion and critical thinking** - slow down, question assumptions, find better angles, and pressure-test ideas
- **Business strategy** — competitive analysis, M&A evaluation, go-to-market planning
- **Sensitive communication** — draft messages with audience awareness, leverage preservation, screenshot-proofing
- **Risk assessment** — threat triage, crisis planning, incident response
- **Research synthesis** — multi-source triangulation, evidence review, executive summaries
- **Decision support** — structured Option A/B/C analysis with tradeoffs and recommendations
- **Coaching** — skill development, reflection exercises, constructive challenge

### Structured Reasoning

Every OMX agent uses confidence labels when uncertainty matters:

- **Confirmed** — verified, sourced, directly known
- **Likely** — well-supported inference
- **Possible** — plausible but unverified
- **Speculative** — hypothesis only

No fake certainty. No unsupported claims. When the agent doesn't know, it says so.

---

## The OMX Team

### Primary Agents (selectable via Tab)

| Agent | What It Does |
|---|---|
| **Chief** | Main orchestrator. Classifies every request by goal, stakes, risk, and urgency. Delegates to specialists. Challenges weak assumptions. Drives tasks to completion. |
| **Founder** | Autonomous deep worker. Give a goal, not instructions. Explores context, researches patterns, executes end-to-end without hand-holding. |

### Subagents (called automatically by Chief)

| Agent | What It Does |
|---|---|
| **Thinker** | All-domain consultant. Architecture, business strategy, risk, health, legal, financial, political analysis. Read-only — pure reasoning, zero action. |
| **Researcher** | Knowledge finder. Documentation, open-source examples, standards, best practices. |
| **Tracker** | Codebase explorer. Fast file discovery, pattern search, local context mapping. |
| **Planner** | Strategic interviewer. Questions first, plan second. Creates detailed work plans through iterative questioning. |
| **Reviewer** | Gap finder. Catches hidden assumptions, ambiguity, missing acceptance criteria, stakeholder blind spots. |
| **Critic** | Quality gate. Only approves plans when references are verified and acceptance criteria are concrete. |
| **Lead** | Project manager. Delegates implementation tasks to Workers, accumulates learnings, verifies completion. |
| **Worker** | Task executor. Focused, disciplined, scoped. Cannot re-delegate. |
| **Spotter** | Visual analyst. Screenshots, diagrams, PDFs, images. |

---

## Commands

| Command | What It Does |
|---|---|
| `deepwork` or `dw` | Full activation — all agents, maximum intensity, autonomous execution |
| `/dw-loop` | Cortex loop — keeps working until 100% done |
| `/challenge [1-4]` | Set challenge level (1=nudge, 2=probe, 3=mirror, 4=red-team) |
| `/checkpoint` | Force a conversation summary — decisions, assumptions, action items |
| `/lens [domain]` | Activate domain lens (health, legal, financial, security, political) |
| `/decide` | Structured decision framework — options, tradeoffs, risks, recommendation |
| `/start-work` | Execute from a Planner-generated plan |
| `/cancel-cortex` | Stop the cortex loop |

---

## Example Prompts

**Strategy:**
> "I'm considering acquiring a competitor. Help me evaluate the tradeoffs."

**Communication:**
> "Draft a message to my CTO explaining why the deadline needs to move. Keep it firm but preserve the relationship."

**Challenge:**
> "Red team my startup idea. Attack it from every angle."

**Risk:**
> "Someone may have accessed our production database. Walk me through incident response."

**Decision:**
> "Should I outsource the MVP or hire in-house? Structure the decision for me."

**Code (yes, it does that too):**
> "deepwork — refactor the auth module to support OAuth2. Follow existing patterns."

---

## Installation

### Agent-Guided Install

Paste this into your OpenCode session:

```
Install and configure oh-my-cortex by following the instructions here:
https://raw.githubusercontent.com/michaelxer/oh-my-cortex/refs/heads/dev/docs/guide/installation.md
```

The agent should read the guide, ask your provider questions in chat, then run the non-interactive installer with your answers.

### Terminal Wizard

If you are installing yourself in a real terminal:

```bash
npx oh-my-cortex@latest install
```

or:

```bash
bunx oh-my-cortex@latest install
```

The installer asks first whether you are a Mettle community member with an active AXR AI plan. AXR users can choose Trial/Pilot, Pro/Core/Builder/Scale, or Owner / Full Access; general users can choose No and continue with their own Claude, ChatGPT, Gemini, Copilot, OpenCode, Z.ai, Kimi, OpenCode Go, or Vercel provider setup.

The installer automatically matches the strongest available model to each agent. It also writes the OpenCode plugin entry, visible OMX agent/MCP entries, and `oh-my-cortex.json`. AXR Owner / Full Access uses `AXRAI_API_KEY` only to fetch the owner catalog and does not write raw API keys into config.

### Updating Existing Installs

Run the installer again, then fully restart OpenCode:

```bash
npx oh-my-cortex@latest install
```

The npm package runs the JavaScript installer directly. OMX does **not** use separate Windows, Linux, or macOS platform packages.

### Manual Config

```bash
# Add to your OpenCode config
# ~/.config/opencode/opencode.jsonc
{
  "plugin": ["oh-my-cortex"]
}

# Restart OpenCode — the plugin auto-installs from npm
# Or install manually:
cd ~/.config/opencode
npm install oh-my-cortex
```

### Works Alongside Other Plugins

OMX runs safely alongside [oh-my-openagent](https://github.com/code-yeongyu/oh-my-openagent) and [oh-my-crew](https://github.com/michaelxer/oh-my-crew). No conflicts, no cross-contamination.

Use **Chief** for general work. Use **Sisyphus** or **Captain** for coding. Each plugin's agents stay in their own lane.

```jsonc
{
  "plugin": ["oh-my-openagent@latest", "oh-my-crew", "oh-my-cortex"]
}
```

---

## How It Works

### Multi-Model Routing

OMX doesn't lock you into one model. It routes tasks to the right brain automatically:

- **Orchestration** — Claude Opus (best at planning and delegation)
- **Deep reasoning** — GPT-5.4 (strongest analytical depth)
- **Visual/frontend** — Gemini Pro (excels at visual tasks)
- **Fast utility** — GPT-5.4-mini, MiniMax, Haiku (speed over depth)

The installer configures this based on your subscriptions. No manual model juggling.

### Parallel Execution

Chief fires multiple agents simultaneously. While Thinker analyzes architecture, Researcher looks up documentation, and Tracker greps the codebase — all in parallel. Like a real team, not a single brain doing everything sequentially.

### Team Mode And Hyperplan

OMX includes the newer teamwork layer:

- **Team Mode** - creates a temporary coordinated team with shared status, tasks, and messages.
- **Hyperplan** - adversarial planning where agents challenge assumptions before the final plan.
- **Hyperplan Deepwork** - combine `hpp dw` or `deepwork hyperplan` for planning pressure plus execution intensity.

Enable Team Mode in `oh-my-cortex.jsonc`:

```jsonc
{
  "team_mode": {
    "enabled": true
  }
}
```

Then restart OpenCode and try:

```text
team mode
Use a small team to research, plan, review, and implement this change.
```

```text
hyperplan
Challenge this product plan from multiple angles before recommending the best path.
```

### Session Continuity

- **Session Guardian** — auto git checkpoints after each task, context monitoring, structured handoff documents
- **Cortex Loop** — autonomous execution that keeps working until the task is 100% done
- **Work State** — persists across sessions. Start Monday, crash, resume Tuesday — picks up exactly where it left off

### Hash-Anchored Edits

Every line the agent reads is tagged with a content hash. Edits are validated before applying — if the file changed since the last read, the edit is rejected. Zero stale-line errors.

---

## Configuration

OMX is opinionated by default, configurable when you need it.

```jsonc
// ~/.config/opencode/oh-my-cortex.jsonc
{
  "agents": {
    "chief": { "model": "anthropic/claude-opus-4-7" },
    "thinker": { "model": "openai/gpt-5.4", "variant": "high" }
  },
  "categories": {
    "communication": { "model": "anthropic/claude-opus-4-7" },
    "strategic-analysis": { "model": "openai/gpt-5.4", "variant": "xhigh" }
  }
}
```

Restart OpenCode after install and confirm **Chief** and **Founder** are the only selectable OMX agents. The rest of the OMX team should be called automatically as subagents.

---

## Diagnostics

The npm CLI is installer-focused. Runtime behavior is handled inside OpenCode after `oh-my-cortex` is registered in your OpenCode config.

Useful checks:

```bash
npx oh-my-cortex@latest install
opencode agent list
```

After restart, **Chief** and **Founder** should be the selectable OMX primary agents. Other OMX roles are subagents called by Chief, Founder, Lead, Team Mode, or runtime delegation.

---

## Credits

OMX is built on the foundation of [oh-my-openagent](https://github.com/code-yeongyu/oh-my-openagent) by [@code-yeongyu](https://github.com/code-yeongyu) — the original multi-agent orchestration architecture that makes this possible. Licensed under SUL-1.0.

Also from the same ecosystem: [oh-my-crew](https://github.com/michaelxer/oh-my-crew) — a role-based agent fork with content-filter-safe prompts and Session Guardian.

OMX's recent continuity-memory and workflow ideas were also inspired by [micode](https://github.com/vtemian/micode) by [@vtemian](https://github.com/vtemian), especially the ideas of ledgers, artifact search, project memory, brainstorm/plan/implement flow, and mindmodel-style project guidance. OMX adapts those ideas into its own priority: broad discussion, critical thinking, analysis, planning, business/general-domain reasoning, and coding as one supported use case rather than the whole identity.

---

## License

[SUL-1.0](LICENSE.md)

---

*OMX... Think deeper.*
