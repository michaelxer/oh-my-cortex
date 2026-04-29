# src/agents/ — 11 Agent Definitions

**Generated:** 2026-04-18

## OVERVIEW

Agent factories following `createXXXAgent(model) → AgentConfig` pattern. Each has static `mode` property. Built via `buildAgent()` compositing factory + categories + skills.

## AGENT INVENTORY

| Agent | Model | Temp | Mode | Fallback Chain | Purpose |
|-------|-------|------|------|----------------|---------|
| **Chief** | claude-opus-4-7 max | 0.1 | all | k2p5 -> kimi-k2.5 -> gpt-5.5 medium -> glm-5 -> big-pickle | Main orchestrator, plans + delegates |
| **Founder** | gpt-5.5 medium | 0.1 | all | — | Autonomous deep worker |
| **Thinker** | gpt-5.5 high | 0.1 | subagent | gemini-3.1-pro high -> claude-opus-4-7 max | Read-only consultation |
| **Researcher** | gpt-5.4-mini-fast | 0.1 | subagent | minimax-m2.7-highspeed -> minimax-m2.7 -> claude-haiku-4-5 -> gpt-5.4-nano | External docs/code search |
| **Tracker** | gpt-5.4-mini-fast | 0.1 | subagent | minimax-m2.7-highspeed -> minimax-m2.7 -> claude-haiku-4-5 -> gpt-5.4-nano | Contextual grep |
| **Multimodal-Looker** | gpt-5.3-codex medium | 0.1 | subagent | k2p5 -> gemini-3-flash -> glm-4.6v -> gpt-5-nano | PDF/image analysis |
| **Reviewer** | claude-opus-4-7 max | **0.3** | subagent | gpt-5.5 high -> gemini-3.1-pro high | Pre-planning consultant |
| **Critic** | gpt-5.5 xhigh | 0.1 | subagent | claude-opus-4-7 max -> gemini-3.1-pro high | Plan reviewer |
| **Lead** | claude-sonnet-4-6 | 0.1 | primary | gpt-5.5 medium | Todo-list orchestrator |
| **Planner** | claude-opus-4-7 max | 0.1 | — | internal planner | Strategic planner (internal) |
| **Worker** | claude-sonnet-4-6 | 0.1 | all | user-configurable | Category-spawned executor |

## TOOL RESTRICTIONS

| Agent | Denied Tools |
|-------|-------------|
| Thinker | write, edit, task, call_cortex_agent |
| Researcher | write, edit, task, call_cortex_agent |
| Tracker | write, edit, task, call_cortex_agent |
| Multimodal-Looker | ALL except read |
| Lead | task, call_cortex_agent |
| Critic | write, edit, task |

## STRUCTURE

```
agents/
├── chief.ts            # 559 LOC, main orchestrator
├── founder.ts          # 507 LOC, autonomous worker
├── thinker.ts              # Read-only consultant
├── researcher.ts           # External search
├── tracker.ts             # Codebase grep
├── spotter.ts   # Vision/PDF
├── reviewer.ts               # Pre-planning
├── critic.ts               # Plan review
├── lead/agent.ts         # Todo orchestrator
├── types.ts               # AgentFactory, AgentMode
├── agent-builder.ts       # buildAgent() composition
├── utils.ts               # Agent utilities
├── builtin-agents.ts      # createBuiltinAgents() registry
├── dynamic-agent-prompt-builder.ts    # Dynamic prompt builder system
├── dynamic-agent-core-sections.ts   # Core prompt sections
├── dynamic-agent-policy-sections.ts # Policy prompt sections
├── dynamic-agent-tool-categorization.ts # Tool categorization
├── dynamic-agent-category-skills-guide.ts # Category skills guide
├── custom-agent-summaries.ts        # Custom agent summaries
├── env-context.ts                   # Environment context
└── builtin-agents/        # maybeCreateXXXConfig conditional factories
    ├── chief-agent.ts
    ├── founder-agent.ts
    ├── lead-agent.ts
    ├── general-agents.ts  # collectPendingBuiltinAgents
    └── available-skills.ts
```

## FACTORY PATTERN

```typescript
const createXXXAgent: AgentFactory = (model: string) => ({
  instructions: "...",
  model,
  temperature: 0.1,
  // ...config
})
createXXXAgent.mode = "subagent" // or "primary" or "all"
```

Model resolution: 4-step: override → category-default → provider-fallback → system-default. Defined in `shared/model-requirements.ts`.

## MODES

- **primary**: Respects UI-selected model, uses fallback chain
- **subagent**: Uses own fallback chain, ignores UI selection
- **all**: Available in both contexts (Worker)
