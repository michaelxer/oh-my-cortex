# Oh My Cortex User Guide

This guide explains Oh My Cortex in everyday language. You do not need to be a programmer to use it well. Think of OMX as a way to turn one OpenCode chat into a thoughtful AI team that can discuss ideas, challenge assumptions, analyze situations, plan next steps, check risks, do work, remember what happened, and continue across long sessions.

OMX can write and edit code, but coding is not its main identity. Its priority is broader: critical thinking, planning, analysis, business strategy, communication, research, decision support, and work in fields where ordinary coding agents are usually too narrow.

If you have not installed it yet, start with the [Installation Guide](./installation.md).

## The Simple Idea

OpenCode normally gives you one AI assistant. OMX adds a team with different strengths:

- One agent leads the work.
- Some agents research and search the project.
- Some agents plan before anything changes.
- Some agents review and challenge weak ideas.
- Some agents execute focused tasks.
- Some memory tools help the next session continue where the last one stopped.

You can still talk normally. Most of the time, you ask for the result you want and OMX chooses the right workflow.

Use OMX for code when you need code. Use it for non-code thinking when you need a serious thinking partner.

## Quick Start

After installation and restarting OpenCode, try one of these prompts.

```text
deepwork
Please check this project, understand what it does, find obvious problems, fix what is safe to fix, and verify your work.
```

```text
Plan first. I want to add a new feature. Ask me the important questions before changing files.
```

```text
hyperplan
I want the best plan for launching this app. Challenge the idea from multiple angles before making the final plan.
```

```text
team mode
Use a small team to research, plan, and review this task before implementing it.
```

```text
/ledger release prep
Create a resume note so another session can continue if this one stops.
```

## Main Features

### OMX Agents

OMX has two primary agents you normally see in the OpenCode dropdown:

| Agent | Best For | Example |
| --- | --- | --- |
| Chief | Leading complex work, choosing specialists, keeping the task moving | `Chief, finish this task end to end and verify it.` |
| Founder | Autonomous deep work with GPT-style reasoning | `Use Founder to investigate and solve this without hand-holding.` |

OMX also has subagents that Chief, Founder, Lead, Team Mode, or workflow commands can call automatically:

| Agent | Plain-Language Role |
| --- | --- |
| Thinker | Gives careful advice without editing files. Good for architecture, strategy, risk, and decisions. |
| Researcher | Looks up documentation, standards, examples, and outside references. |
| Tracker | Searches the project quickly and finds where things live. |
| Planner | Asks questions and creates a step-by-step plan before work begins. |
| Reviewer | Finds missing details, unclear requirements, and hidden risks. |
| Critic | Reviews plans strictly and rejects weak plans. |
| Lead | Runs an approved plan through smaller work steps. |
| Worker | Executes one focused task. Usually used automatically. |
| Spotter | Reads screenshots, diagrams, PDFs, and images. |

You do not have to memorize these names. For normal use, start with `deepwork`, `team mode`, `hyperplan`, or a plain planning request.

### Deepwork

Use `deepwork` or `dw` when you want OMX to take a broad task and push it to completion.

What it does:

- Understands the project before acting.
- Breaks the request into smaller tasks.
- Uses research, planning, search, implementation, and review when useful.
- Keeps working until the task is genuinely handled.
- Verifies with tests, builds, or other checks when available.

Example:

```text
dw
Add a settings page for notification preferences. Follow the existing design, update tests, and verify the build.
```

Deepwork is not only for programming. You can also use it for strategy, writing, research, operations, planning, negotiation prep, product thinking, and other serious work.

```text
deepwork
Help me evaluate whether this business idea is worth pursuing. Challenge the assumptions, compare options, and give me the strongest next step.
```

### Planning Mode

Use planning when the work is important, unclear, expensive, or risky.

What it does:

- Clarifies what you really want.
- Finds missing decisions.
- Creates a structured plan.
- Lets you review before execution.
- Works well for large refactors, launches, migrations, and production changes.

Example:

```text
Plan first. I want to redesign the onboarding flow. Ask me questions, then create a step-by-step plan with risks and verification.
```

After the plan is ready, say:

```text
/start-work
```

### Team Mode

Team Mode lets OMX run a named group of agents for one coordinated job. It is useful when you want several viewpoints at once instead of one assistant thinking alone.

What it does:

- Creates a temporary team run.
- Gives different members different jobs.
- Lets members share messages and findings.
- Tracks team status and team tasks.
- Cleans up when the work is done.

Good use cases:

- Researching a big decision.
- Comparing several possible plans.
- Having one agent implement while another reviews.
- Splitting frontend, backend, testing, and documentation work.

Enable it in `~/.config/opencode/oh-my-cortex.jsonc`:

```jsonc
{
  "team_mode": {
    "enabled": true
  }
}
```

Then restart OpenCode.

Example:

```text
team mode
Create a team for this task: one member researches the current code, one proposes the plan, one reviews risks, and one checks tests. Then give me the final recommendation.
```

### Hyperplan

Hyperplan is a serious planning workflow built on Team Mode. Use it when the plan matters and you do not want the first plausible answer.

What it does:

- Starts a planning team.
- Has agents analyze independently.
- Forces assumptions to be challenged.
- Compares options and risks.
- Produces a stronger final plan.

Example:

```text
hyperplan
I want to migrate this app to a new auth system. Challenge the options, find risks, then produce the best plan.
```

Team Mode must be enabled for the full Hyperplan workflow.

### Hyperplan Deepwork

Hyperplan Deepwork combines hard planning with deep execution.

Use it when you want the plan challenged first, then carried out carefully.

```text
hpp dw
Plan this carefully, challenge the assumptions, then execute the chosen path and verify it.
```

Equivalent forms include `dw hpp`, `hyperplan deepwork`, and `deepwork hyperplan`.

### Cortex Loop

Cortex Loop keeps pushing a task forward until it is done or you cancel it.

Use:

```text
/cortex-loop Fix the failing checkout flow and keep going until verification passes.
```

For Deepwork plus looping:

```text
/dw-loop Finish this release checklist and verify each step.
```

To stop the loop:

```text
/cancel-cortex
```

### Challenge Engine

OMX is designed to push back when it should. It can challenge assumptions at four levels:

| Level | Meaning |
| --- | --- |
| 1 Nudge | A gentle improvement or missing assumption. |
| 2 Probe | Tradeoffs, risks, blind spots, and better options. |
| 3 Mirror | Names weak logic or avoidance and recommends a stronger path. |
| 4 Red Team | Attacks the idea from skeptical stakeholder perspectives. |

Use:

```text
/challenge 3
```

or simply say:

```text
Be honest. What am I missing?
```

### Domain Lenses

OMX adapts when your request touches sensitive areas.

| Lens | How OMX Behaves |
| --- | --- |
| Health | Careful, non-diagnostic, encourages professional care when needed. |
| Legal | Conservative, separates information from legal advice. |
| Financial | Risk-aware, avoids pretending to be personal financial advice. |
| Security | Defensive, evidence-preserving, triages before action. |
| Political | Stakeholder-aware and careful with protocol or reputation risk. |

Example:

```text
/lens security
Review this incident response plan defensively and preserve evidence.
```

### Decision Framework

Use `/decide` when you have several options and want a clear recommendation.

What it does:

- Lists the real options.
- Compares tradeoffs.
- Looks at risks and second-order effects.
- Gives a recommendation with confidence.

Example:

```text
/decide Should I outsource this MVP or hire in-house?
```

### Cortex Memory

Cortex Memory helps long work survive restarts, context loss, and internet drops.

It has several parts:

| Feature | What It Means |
| --- | --- |
| `/ledger` | Creates or updates a continuity note in `.cortex/ledgers`. |
| Ledger Loader | Automatically brings the latest ledger into future sessions. |
| File-Ops Tracker | Records important files read, searched, edited, or touched under `.cortex/file-ops`. |
| `cortex_search` | Searches ledgers, plans, evidence, file traces, and handoff docs. |
| `/cortex-search` | A simple command that tells the agent to search memory before answering. |

Good use cases:

- A task may continue tomorrow.
- You want another agent to resume safely.
- You are preparing a release.
- You need to remember why a decision was made.

Example:

```text
/ledger release-0.2
Summarize what is done, what was pushed, what still needs testing, and the exact next step.
```

Then later:

```text
/cortex-search release-0.2
Find the latest release notes and continue from there.
```

### Cortex Project Init

Use `/cortex-init` when you want OMX to create beginner-friendly project memory for a repository.

What it can create:

- `ARCHITECTURE.md` for how the project is organized.
- `CODE_STYLE.md` for local rules and habits.
- `.cortex/plans/README.md` for how plans should be stored.

It respects existing `AGENTS.md` and avoids overwriting human-written docs unless you ask.

Example:

```text
/cortex-init
Create missing project memory docs. Do not overwrite existing docs without asking.
```

### Brainstorm, Plan, Workflow

These commands help turn a vague idea into durable work.

| Command | Use It When |
| --- | --- |
| `/brainstorm` | You want to explore ideas before choosing a direction. |
| `/cortex-plan` | You want a clear implementation plan stored under `.cortex/plans`. |
| `/cortex-workflow` | You want the full brainstorm -> plan -> implement flow using OMX agents. |

Examples:

```text
/brainstorm
I want to make onboarding easier for first-time users. Explore options before we choose.
```

```text
/cortex-plan
Turn the onboarding idea into a safe implementation plan with checkpoints and tests.
```

```text
/cortex-workflow
Search memory, brainstorm if needed, make the plan, implement in checkpoints, and update the ledger after each finished step.
```

### Mindmodel

Mindmodel is project-specific wisdom. It captures rules that future sessions should remember.

Use it for:

- Coding patterns your project always follows.
- Release rules that must not be forgotten.
- Testing habits.
- Mistakes you do not want repeated.

Mindmodel files live in `.cortex/mindmodel`. When they exist, OMX can inject them automatically as local project guidance.

Example:

```text
/mindmodel release safety
Create project rules for publishing: what must be tested, what must never be restored, and what needs a checkpoint.
```

### Handoff And Checkpoint

Use these when you want clear session continuity.

| Command | What It Does |
| --- | --- |
| `/checkpoint` | Creates a quick summary of decisions, status, assumptions, and next steps. |
| `/handoff` | Creates a detailed resume summary for a new session. |
| `/ledger` | Writes durable project memory under `.cortex/ledgers`. |

Simple habit:

```text
/checkpoint
```

after a meaningful step, and:

```text
/ledger
```

after a task that another session may need to continue.

### Background Agents

Background agents let OMX do more than one thing at a time.

What they do:

- Send research or review to another agent.
- Let the main agent keep working.
- Report back when background work is ready.
- Help with large tasks where several checks can happen in parallel.

You usually do not call background tools manually. Tell OMX:

```text
Use background agents where helpful. I want one agent to research the API, one to inspect existing patterns, and one to review the final changes.
```

### Built-In Research And Code Tools

OMX includes practical tools for research, project search, and safer changes.

In plain language:

- Web search can check current information when available.
- Documentation lookup helps confirm library behavior.
- Code search finds patterns in your project or public examples.
- LSP tools give the agent IDE-like abilities such as "go to definition" and "find references."
- AST-Grep searches code by structure, not only text.
- Spotter can inspect images, screenshots, PDFs, and diagrams.

Example:

```text
Before coding, use official docs and project search to confirm the right approach.
```

### Skills

Skills are reusable instruction packs for special kinds of work.

Examples include:

- Git cleanup and commit help.
- Browser testing.
- Frontend UI/UX work.
- Review workflows.
- Security, legal, health, financial, and political caution.

You usually do not need to choose a skill manually. If you know one is useful, say:

```text
Use the relevant skill for this task and tell me which one you used.
```

### Model Fallbacks

OMX does not require one model for everything. Different agents can use different models, and configured fallback models can keep work moving if one provider fails.

This helps with:

- Provider downtime.
- Rate limits.
- Missing access to a model.
- Different agents needing different strengths.

For deeper detail, read the [Agent-Model Matching Guide](./agent-model-matching.md).

### Installer And Provider Setup

OMX includes an installer so you do not have to hand-edit every OpenCode file.

What it does:

- Adds `oh-my-cortex` to OpenCode.
- Writes `oh-my-cortex.json` or `oh-my-cortex.jsonc`.
- Preserves existing provider settings.
- Helps configure Claude, OpenAI, Gemini, Copilot, OpenCode, Z.ai, Kimi, OpenCode Go, Vercel AI Gateway, AXR AI, or custom OpenAI-compatible providers.
- Backs up config files before writing.

Use:

```bash
npx oh-my-cortex@latest install
```

or:

```bash
bunx oh-my-cortex@latest install
```

Then fully restart OpenCode.

OMX is a single npm package. It does not use separate Windows, Linux, or macOS packages.

### Claude Code Compatibility

OMX can read many Claude Code-style settings, commands, skills, hooks, agents, and MCP files.

What this means:

- Existing commands and skills can often carry over.
- Teams can keep many project instructions.
- You do not need this for basic use.

### Recovery And Safety

OMX has background helpers that reduce common failures.

They can:

- Preserve important context during long sessions.
- Recover from some message or tool-result problems.
- Protect against overwriting files too casually.
- Truncate huge tool outputs so the session stays usable.
- Remind agents to use the right specialists.
- Continue through configured model fallback paths.

You do not need to operate these manually. They work in the background.

## Which Mode Should I Use?

| Situation | Use |
| --- | --- |
| You want OMX to handle everything | `deepwork` or `dw` |
| You want it to keep going until complete | `/cortex-loop` or `/dw-loop` |
| The task is risky or unclear | Planner / planning prompt |
| You want several agents to discuss or split work | Team Mode |
| You want a plan challenged from many angles | Hyperplan |
| You want hard planning plus execution | `hpp dw` |
| You want advice without edits | Thinker |
| You want fast project search | Tracker |
| You want docs or web examples | Researcher |
| You want visual/PDF/image analysis | Spotter |
| You want autonomous GPT-style deep work | Founder |
| You may need to resume later | `/ledger` |
| You want to find old project memory | `/cortex-search` |
| You want project memory docs | `/cortex-init` |
| You want project-specific rules remembered | `/mindmodel` |
| You have several options and need a recommendation | `/decide` |

## Beginner-Friendly Prompt Recipes

### Fix A Bug

```text
deepwork
Find why this bug happens, fix it, and verify the fix. Explain the cause in simple language when done.
```

### Add A Feature

```text
Plan briefly, then implement this feature. Follow the existing project style, update tests if needed, and verify the result.
```

### Make A Serious Plan

```text
hyperplan
I need a strong plan for this project. Challenge assumptions, compare options, identify risks, and give me the best final plan.
```

### Continue From Memory

```text
/cortex-search checkout bug
Find previous ledgers, plans, handoffs, and file traces about this work. Then continue from the current repo state.
```

### Create A Resume Point

```text
/ledger
Create a clear resume note with what is done, what changed, what was verified, and the next exact step.
```

### Review Work

```text
Review the current changes for bugs, regressions, missing tests, and confusing code. Do not change files unless you find a clear fix.
```

### Learn A Project

```text
Read this project and explain what it does in plain language. Then tell me the safest next steps.
```

### Prepare A Release

```text
/cortex-workflow
Prepare this release carefully. Search memory first, make a checkpoint plan, verify each step, push when done, and update the ledger.
```

## Use Case Ideas

OMX is not only for software projects. You can use it whenever you need structured thinking, careful questions, or a second brain that will not simply agree with you.

The best prompts usually say:

- What you are trying to decide or solve.
- What country, state, industry, role, or situation applies.
- What you already know.
- What you are worried about.
- Whether you want advice, a plan, a checklist, a draft, or questions first.

### Tax Planning

OMX can help you prepare for tax planning by asking for the missing context and organizing the questions you should bring to a qualified tax professional.

For example, it should ask things like:

- What country and state/province are you in?
- Are you an employee, freelancer, company owner, investor, or mixed?
- What type of business do you run?
- Is this personal tax, business tax, payroll tax, sales/VAT/GST, or cross-border tax?
- What income, expenses, assets, or transactions are involved?
- Are there deadlines, audits, penalties, or reporting obligations?

Example:

```text
/lens financial
I want help preparing for tax planning. Ask me the important questions first: country, business type, income sources, expenses, deadlines, and what I should discuss with a tax professional.
```

OMX can help you understand the shape of the problem, prepare documents, compare options, and make a checklist. It should not pretend to be your tax advisor or give final legal/tax rulings.

### Business Strategy

Use OMX for business decisions where you want challenge, structure, and clear tradeoffs.

Good uses:

- Choosing a business model.
- Pricing a product.
- Evaluating a competitor.
- Planning a launch.
- Deciding whether to hire, outsource, or automate.
- Preparing investor, partner, or customer communication.

Example:

```text
hyperplan
I want to launch a small AI automation service for local businesses. Challenge the idea, ask what market details are missing, compare possible offers, and recommend the strongest next step.
```

### Relationship And Communication

OMX can help you think through difficult conversations without escalating them.

Good uses:

- Drafting a message that is honest but not harsh.
- Understanding another person's likely perspective.
- Preparing for a sensitive conversation.
- Separating facts, feelings, assumptions, and requests.
- Choosing whether to reply now or wait.

Example:

```text
I need to talk to my business partner about missed deadlines. Help me understand the situation from both sides, ask me what context matters, then draft a calm message that protects the relationship.
```

OMX should not manipulate people for you. It should help you communicate clearly, respectfully, and with awareness of consequences.

### Mental Health Support

OMX can help with reflection, journaling, planning, and emotional organization. It should be supportive and careful, but it is not a therapist, doctor, or emergency service.

Good uses:

- Sorting out what you are feeling.
- Creating a simple routine for sleep, work, or stress.
- Preparing what to tell a counselor, doctor, friend, or family member.
- Writing a grounding plan for a difficult week.
- Separating facts from spiraling thoughts.

Example:

```text
/lens health
I feel overwhelmed and stuck. Please help me organize what is going on, ask gentle questions, suggest simple next steps for today, and tell me when I should reach out to a real person or professional.
```

If someone may be in immediate danger or thinking about self-harm, OMX should encourage contacting local emergency services, a crisis line, or a trusted person right away.

### Legal Or Contract Review

OMX can help you understand a contract or legal situation at a high level and prepare questions for a lawyer.

It should ask:

- What country/state jurisdiction applies?
- Is this employment, business, real estate, family, immigration, intellectual property, or another area?
- Are there deadlines?
- What outcome do you want?
- What documents or clauses matter most?

Example:

```text
/lens legal
Help me understand this contract in plain language. Flag risky clauses, ask what jurisdiction applies, and prepare questions I should ask a lawyer before signing.
```

### Learning And Career Planning

OMX can act like a study partner or career planning assistant.

Good uses:

- Building a learning plan.
- Breaking a big goal into weekly steps.
- Reviewing a resume or portfolio.
- Preparing for interviews.
- Explaining hard topics in simple language.

Example:

```text
I want to learn data analysis for a better job. Ask about my current skill level, time per week, budget, and target role. Then create a 12-week plan.
```

### Personal Decision Making

Use `/decide` when you are stuck between options.

Example:

```text
/decide
Should I stay at my current job, look for a new role, or start freelancing? Ask me the important questions first, then compare the options clearly.
```

OMX is good at naming tradeoffs, risks, reversibility, and hidden costs.

### Research And Sensemaking

Use OMX when you have too much information and need a clean summary.

Good uses:

- Comparing tools or products.
- Summarizing long articles.
- Understanding a market.
- Preparing a briefing.
- Finding what evidence is strong, weak, or missing.

Example:

```text
Research this market and give me a plain-language briefing. Separate confirmed facts, likely trends, weak evidence, and open questions.
```

### Long Projects

For work that may take more than one session, combine planning and memory:

```text
/cortex-workflow
Help me plan this project, break it into checkpoints, execute the first checkpoint, verify it, push when done, and update the ledger so the next session can continue.
```

After each meaningful checkpoint:

```text
/ledger
Write what changed, what was verified, what is still open, and the exact next step.
```

## Common Commands

| Command | Plain Meaning |
| --- | --- |
| `deepwork` / `dw` | Handle this deeply and push to completion. |
| `/cortex-loop` | Keep working on a task until done. |
| `/dw-loop` | Deepwork plus loop continuation. |
| `/cancel-cortex` | Stop an active Cortex Loop. |
| `/challenge [1-4]` | Set how strongly OMX should push back. |
| `/lens [domain]` | Use a sensitive-domain lens. |
| `/decide` | Compare options and recommend. |
| `/checkpoint` | Summarize the current session state. |
| `/handoff` | Create a detailed resume summary. |
| `/ledger` | Write durable continuity memory. |
| `/cortex-search` | Search OMX memory. |
| `/cortex-init` | Create missing project memory docs. |
| `/brainstorm` | Explore ideas before planning. |
| `/cortex-plan` | Create a durable implementation plan. |
| `/cortex-workflow` | Run brainstorm -> plan -> implement in OMX style. |
| `/mindmodel` | Create project-specific memory rules. |
| `/start-work` | Execute an approved plan. |
| `/stop-continuation` | Stop continuation helpers for the session. |
| `/remove-ai-slops` | Review and clean AI-generated code smells. |
| `/refactor` | Run a safer refactoring workflow. |
| `/init-deep` | Initialize hierarchical project instructions. |

## Installation And Updating

Recommended install:

```bash
npx oh-my-cortex@latest install
```

or:

```bash
bunx oh-my-cortex@latest install
```

Then fully restart OpenCode.

For agent-guided setup, paste:

```text
Install and configure oh-my-cortex by following the instructions here:
https://raw.githubusercontent.com/michaelxer/oh-my-cortex/refs/heads/dev/docs/guide/installation.md
```

To update, run the installer again and restart OpenCode:

```bash
npx oh-my-cortex@latest install
```

Do not delete your full OpenCode config folder for a normal update.

## Practical Tips

- Be clear about the result you want, not only the action.
- Say whether OMX may edit files, run tests, commit, push, or publish.
- For risky work, ask for a plan first.
- For hands-off work, include `deepwork`.
- For major decisions, use `hyperplan`.
- For long work, use `/ledger` after each important checkpoint.
- Restart OpenCode after changing plugin or OMX config.
- Never paste API keys into chat. Use OpenCode auth or environment variables.

## Troubleshooting

### The Agents Do Not Appear

Restart OpenCode. Plugin changes load when OpenCode starts.

If they still do not appear, run:

```bash
npx oh-my-cortex@latest install
```

After restart, Chief and Founder should be selectable primary agents. Other OMX agents are subagents and may not all be intended as primary dropdown choices.

### Deepwork, Team Mode, Or Hyperplan Does Not Trigger

Fully restart OpenCode after installation. If Team Mode or Hyperplan says tools are missing, enable Team Mode:

```jsonc
{
  "team_mode": {
    "enabled": true
  }
}
```

Save it in `~/.config/opencode/oh-my-cortex.jsonc`, then restart OpenCode.

### Memory Search Finds Nothing

That usually means there is no memory yet. Create one:

```text
/ledger
Summarize this session so future work can continue.
```

Then use `/cortex-search` later.

### A Provider Or Model Fails

Check provider login first:

```bash
opencode auth login
```

If you configured fallbacks, OMX may continue with another model.

## More Reading

- [Installation Guide](./installation.md)
- [Orchestration Guide](./orchestration.md)
- [OMX Agent-Model Matching Guide](./agent-model-matching.md)
- [Overview](./overview.md)
- [Configuration Reference](../reference/configuration.md)
- [Features Reference](../reference/features.md)

## Credits

OMX builds on the broader OpenCode agent ecosystem, including [oh-my-openagent](https://github.com/code-yeongyu/oh-my-openagent) and [oh-my-crew](https://github.com/michaelxer/oh-my-crew).

Some of the continuity-memory and workflow ideas in OMX were inspired by [micode](https://github.com/vtemian/micode) by [@vtemian](https://github.com/vtemian), especially ledgers, artifact search, project memory, brainstorm/plan/implement flow, and mindmodel-style project guidance.

OMX adapts those ideas for its own purpose: broad discussion, critical thinking, analysis, planning, business and general-domain reasoning, with coding as one useful capability rather than the whole mission.
