import type { BuiltinSkill } from "../types"

export const teamModeSkill: BuiltinSkill = {
  name: "team-mode",
  description:
    "Team orchestration - create and manage parallel cortex teams (OFF by default; enable via team_mode.enabled in config).",
  template: `# Team Mode

Team Mode gives Oh My Cortex a parallel multi-agent coordination layer. It is off by default. Enable it only when you want a lead cortex agent coordinating member sessions.

## When To Use

- Split a large job across several agents.
- Keep a lead agent focused while member agents work in parallel.
- Use worktree mode for isolated code changes, or tmux visualization when you want live session layout.

## Declare A Team

Create a team at \`~/.cortex/teams/{name}/config.json\`, or set \`team_mode.base_dir\` if you want a custom location. Project-scoped teams can live under \`.cortex/teams/{name}/config.json\`.

You can also pass the same object directly to \`team_create({ inline_spec: ... })\`.

Example:

\`\`\`json
{
  "name": "release-squad",
  "lead": {
    "kind": "subagent_type",
    "subagent_type": "chief"
  },
  "members": [
    {
      "kind": "category",
      "category": "quick",
      "prompt": "review small changes and report risks"
    },
    {
      "kind": "subagent_type",
      "subagent_type": "lead"
    }
  ]
}
\`\`\`

Use \`kind: "category"\` for a category-backed worker. It must include both \`category\` and \`prompt\`. Category members route through \`worker\` (Worker) internally.

Use \`kind: "subagent_type"\` only for eligible agents:

- \`chief\` (Chief - Deepworker)
- \`lead\` (Lead)
- \`worker\` (Worker)
- \`founder\` (Founder - Deep Agent, conditional; use only when teammate permissions allow it)

Do not use \`thinker\`, \`researcher\`, \`tracker\`, \`spotter\`, \`reviewer\`, \`critic\`, \`planner\`, or other read-only/planning-only agents as team members. Use \`delegate-task\` for those.

## Lifecycle

1. Lead creates the team with \`team_create({ teamName: "existing-team" })\` or \`team_create({ inline_spec: { name: "team-name", members: [...] } })\`.
2. Lead assigns work with \`team_send_message\` or \`team_task_create\`.
3. Members report progress with \`team_send_message\` plus \`team_task_update\`.
4. Lead and members track progress with \`team_task_list\`, \`team_task_get\`, and \`team_status\`.
5. Lead requests shutdown with \`team_shutdown_request\`.
6. The targeted member or lead handles \`team_approve_shutdown\` or \`team_reject_shutdown\`.
7. Lead removes the team with \`team_delete\`.

## Coordination Rules

- Messages sent via \`team_send_message\` are automatically delivered as new conversation turns.
- If a recipient is mid-turn, the message is queued and injected when its turn ends.
- Teammates go idle after every turn; idle means waiting for input, not failure.
- Use \`team_status({ teamRunId })\` to see active members, session IDs, backlog, and tmux panes.
- Refer to teammates by member name, never by raw session ID.
- Members should check \`team_task_list\`, claim tasks with \`team_task_update\`, and mark completed tasks before asking for more work.
- Do not inspect another teammate's session, inbox, or pane with terminal tools. Coordinate through \`team_send_message\` and \`team_status\`.
- Members must not call \`delegate-task\`; use team messages to coordinate.

## Tools

Lead-only:

- \`team_create\`
- \`team_delete\`
- \`team_shutdown_request\`

Lead or target-member shutdown:

- \`team_approve_shutdown\`
- \`team_reject_shutdown\`

Universal team-run tools:

- \`team_send_message\`
- \`team_task_create\`
- \`team_task_list\`
- \`team_task_update\`
- \`team_task_get\`
- \`team_status\`

Global query:

- \`team_list\`

## Bounds

- Max 8 members.
- Max 4 parallel workers.
- Max 32KB per message.
- Max 256KB unread inbox.

Team Mode is a docs skill. The \`team_*\` tools are registered globally only when \`team_mode.enabled=true\`.
`,
}
