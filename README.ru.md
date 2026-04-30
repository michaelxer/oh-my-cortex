# oh-my-cortex

**Cognitive operating system for OpenCode.**

oh-my-cortex (OMX) -- multi-agent plugin, which transforms OpenCode into a thinking partner -- not just for code, but for decisions, strategy, communication, risk management and everything in between.

Install OMX. Type `deepwork`. Get a team of 11 specialized agents that challenge your assumptions, adapt to sensitive domains, structure your decisions, and execute with precision.

---

## Why OMX?

Most AI tools agree with everything you say. OMX pushes back.

Most AI tools only write code. OMX helps you think.

Most AI tools use one model for everything. OMX routes the right brain to the right job -- automatically.

---

## What Makes OMX Different

### Challenge Engine

Agents don't just execute -- they challenge weak reasoning before it becomes a bad decision.

4 levels of pushback, from gentle nudge to full adversarial review:

| Level | Name | What Happens |
|---|---|---|
| 1 | **Nudge** | Points out one assumption or improvement (always active) |
| 2 | **Probe** | Shows tradeoffs, risks, blind spots, better options |
| 3 | **Mirror** | Names avoidance, weak logic, opportunity cost -- then prescribes |
| 4 | **Red Team** | Attacks from competitor, skeptic, investor, regulator perspectives |

Set manually with `/challenge 3` or let it activate automatically when you say "be honest" or "what am I missing."

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

- **Business strategy** -- competitive analysis, M&A evaluation, go-to-market planning
- **Sensitive communication** -- draft messages with audience awareness, leverage preservation, screenshot-proofing
- **Risk assessment** -- threat triage, crisis planning, incident response
- **Research synthesis** -- multi-source triangulation, evidence review, executive summaries
- **Decision support** -- structured Option A/B/C analysis with tradeoffs and recommendations
- **Coaching** -- skill development, reflection exercises, constructive challenge

### Structured Reasoning

Every OMX agent uses confidence labels when uncertainty matters:

- **Confirmed** -- verified, sourced, directly known
- **Likely** -- well-supported inference
- **Possible** -- plausible but unverified
- **Speculative** -- hypothesis only

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
| **Thinker** | All-domain consultant. Architecture, business strategy, risk, health, legal, financial, political analysis. Read-only -- pure reasoning, zero action. |
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
| `deepwork` or `dw` | Full activation -- all agents, maximum intensity, autonomous execution |
| `/dw-loop` | Cortex loop -- keeps working until 100% done |
| `/challenge [1-4]` | Set challenge level (1=nudge, 2=probe, 3=mirror, 4=red-team) |
| `/checkpoint` | Force a conversation summary -- decisions, assumptions, action items |
| `/lens [domain]` | Activate domain lens (health, legal, financial, security, political) |
| `/decide` | Structured decision framework -- options, tradeoffs, risks, recommendation |
| `/start-work` | Execute from a Planner-generated plan |
| `/cancel-cortex` | Stop the cortex loop |

---

## Installation

### Quick Start

Paste this into your OpenCode session:

```
Install and configure oh-my-cortex by following the instructions here:
https://raw.githubusercontent.com/michaelxer/oh-my-cortex/refs/heads/dev/docs/guide/installation.md
```

### Manual Install

```bash
# Add to your OpenCode config
# ~/.config/opencode/opencode.jsonc
{
  "plugin": ["oh-my-cortex"]
}

# Restart OpenCode -- the plugin auto-installs from npm
# Or install manually:
cd ~/.config/opencode
npm install oh-my-cortex
```

### Interactive Setup

```bash
bunx oh-my-cortex install
```

The installer asks what AI providers you have and automatically matches the strongest available model to each agent. Any model works -- OMX adapts to what you have.

---

## Credits

OMX is built on the foundation of [oh-my-openagent](https://github.com/code-yeongyu/oh-my-openagent) by [@code-yeongyu](https://github.com/code-yeongyu) -- the original multi-agent orchestration architecture that makes this possible. Licensed under SUL-1.0.

Also from the same ecosystem: [oh-my-crew](https://github.com/michaelxer/oh-my-crew) -- a role-based agent fork with content-filter-safe prompts and Session Guardian.

---

## License

[SUL-1.0](LICENSE.md)

---

*OMX... Think deeper.*
