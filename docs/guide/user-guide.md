# Oh My Cortex User Guide

This guide explains Oh My Cortex in everyday language. You do not need to be a programmer to use it well. Think of OMX as a way to turn one OpenCode chat into a cognitive team: one agent leads, some agents research, some plan, some review, some execute, and the whole system challenges weak assumptions before acting.

If you have not installed it yet, start with the [Installation Guide](./installation.md).

## The Simple Idea

OpenCode normally gives you one AI assistant. OMX adds a set of specialized agents for thinking and execution:

- Chief leads the work.
- Founder handles autonomous deep work.
- Thinker gives read-only advice.
- Researcher and Tracker gather context.
- Planner, Reviewer, and Critic make plans stronger.
- Lead and Worker execute scoped work.
- Spotter inspects images, screenshots, PDFs, and diagrams.

You can still talk normally. Most of the time, ask for the result you want and OMX chooses the workflow.

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

## Main Features

### OMX Agents

| Agent | Best For | Example Prompt |
| --- | --- | --- |
| Chief | Leading complex hands-off work | `Chief, finish this task end to end and verify it.` |
| Founder | Deep autonomous implementation and debugging | `Use Founder to investigate and solve this without hand-holding.` |
| Thinker | Read-only advice, decisions, risk, architecture | `Ask Thinker to review this design without editing files.` |
| Researcher | External docs, standards, examples | `Ask Researcher to find official docs and examples for this library.` |
| Tracker | Fast project search | `Ask Tracker where the login flow is implemented.` |
| Planner | Planning before building | `Use Planner to make a plan before changing code.` |
| Reviewer | Finds hidden gaps before execution | `Ask Reviewer what this plan is missing.` |
| Critic | High-pressure plan review | `Ask Critic to reject this plan unless it is concrete enough.` |
| Lead | Executes an existing plan through Workers | `Lead, work through the plan and keep tasks organized.` |
| Worker | Focused delegated implementation | Usually used automatically by Lead or Chief. |
| Spotter | Images, screenshots, PDFs, diagrams | `Ask Spotter to inspect this screenshot and explain the issue.` |

You do not have to memorize these names. For normal use, start with `deepwork`, `team mode`, `hyperplan`, or planning prompts.

### `deepwork` / `dw`

Use `deepwork` when you want OMX to take a broad task and push it to completion.

What it does:

- Understands the project before acting.
- Breaks the request into smaller tasks.
- Uses research, planning, code search, and review agents when useful.
- Keeps working until the task is genuinely handled.
- Verifies with tests, builds, or other checks when available.

Example:

```text
dw
Add a settings page for notification preferences. Follow the existing design, update tests, and verify the build.
```

### Planning Mode

Use planning when the work is important, unclear, or risky.

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

Hyperplan is adversarial planning built on Team Mode. Use it when the plan matters and you do not want the first plausible answer.

What it does:

- Starts a planning team.
- Has agents analyze independently.
- Forces assumptions to be challenged.
- Produces a stronger final plan.

Example:

```text
hyperplan
I want to migrate this app to a new auth system. Challenge the options, find risks, then produce the best plan.
```

Team Mode must be enabled for the full Hyperplan workflow.

### Hyperplan Deepwork

Use both planning pressure and deep execution intensity:

```text
hpp dw
Plan this carefully, challenge the assumptions, then execute the chosen path and verify it.
```

Equivalent forms include `dw hpp`, `hyperplan deepwork`, and `deepwork hyperplan`.

### Challenge Engine

OMX is designed to push back when it should. It can challenge assumptions at four levels:

| Level | Use |
| --- | --- |
| 1 Nudge | Gentle improvement or missing assumption. |
| 2 Probe | Tradeoffs, risks, blind spots, better options. |
| 3 Mirror | Names weak logic or avoidance and prescribes a better path. |
| 4 Red Team | Attacks the idea from skeptical stakeholder perspectives. |

Use:

```text
/challenge 3
```

or:

```text
Be honest. What am I missing?
```

### Domain Lenses

OMX adapts when your request touches sensitive domains:

- Health
- Legal
- Financial
- Security
- Political

Example:

```text
/lens security
Review this incident response plan defensively and preserve evidence.
```

### Built-In MCPs And Code Tools

OMX includes practical research and code tools:

- Web search when available.
- Context7 documentation lookup.
- Grep.app or GitHub code search when available.
- LSP navigation for definitions, references, diagnostics.
- AST-Grep for structure-aware code search and refactoring.

Example:

```text
Before coding, use official docs and public examples to confirm the right approach.
```

### Model Fallbacks

OMX does not use one global model for every agent. Each agent has its own fallback chain.

This helps with:

- Provider downtime.
- Rate limits.
- Missing access to a model.
- Different agents needing different strengths.

For deeper detail, read the [Agent-Model Matching Guide](./agent-model-matching.md).

## Which Mode Should I Use?

| Situation | Use |
| --- | --- |
| You want OMX to handle everything | `deepwork` or `dw` |
| The task is risky or unclear | Planner / planning prompt |
| You want several agents to discuss or split work | Team Mode |
| You want a plan challenged from many angles | Hyperplan |
| You want advice without edits | Thinker |
| You want fast project search | Tracker |
| You want docs or web examples | Researcher |
| You want visual/PDF/image analysis | Spotter |
| You want autonomous GPT-style deep work | Founder |

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

### Review Work

```text
Review the current changes for bugs, regressions, missing tests, and confusing code. Do not change files unless you find a clear fix.
```

### Learn A Project

```text
Read this project and explain what it does in plain language. Then tell me the safest next steps.
```

### Make A Serious Plan

```text
hyperplan
I need a strong plan for this project. Challenge assumptions, compare options, identify risks, and give me the best final plan.
```

### Continue From A Handoff

```text
Read all files in HANDOFF_DOC, understand the latest state, then continue the unfinished task. Check the repo before editing.
```

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

OMX is a single npm package. It does not use separate Windows, Linux, or macOS packages.

## Updating OMX

Run the installer again:

```bash
npx oh-my-cortex@latest install
```

Then fully restart OpenCode.

If agents are still missing after a full restart, clear only the OMX package cache and reinstall.

Windows PowerShell:

```powershell
$pkg = Join-Path $env:USERPROFILE ".cache\opencode\packages\node_modules"
Remove-Item -LiteralPath (Join-Path $pkg "oh-my-cortex") -Recurse -Force -ErrorAction SilentlyContinue
npx oh-my-cortex@latest install
```

macOS / Linux:

```bash
rm -rf "$HOME/.cache/opencode/packages/node_modules/oh-my-cortex"
npx oh-my-cortex@latest install
```

Do not delete your full OpenCode config folder for a normal update.

## Practical Tips

- Be clear about the result you want, not only the action.
- Say whether OMX may edit files, run tests, commit, push, or publish.
- For risky work, ask for a plan first.
- For hands-off work, include `deepwork`.
- For major decisions, use `hyperplan`.
- Restart OpenCode after changing plugin or OMX config.
- Never paste API keys into chat. Use OpenCode auth or environment variables.

## Troubleshooting

### The agents do not appear

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
