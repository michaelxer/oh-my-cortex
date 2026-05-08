import type { BuiltinSkill } from "../types"

export const hyperplanSkill: BuiltinSkill = {
  name: "hyperplan",
  description:
    "Adversarial planning workflow for Team Mode. Uses a lead plus hostile specialist members to critique and synthesize a plan.",
  template: `# Hyperplan

Hyperplan is an adversarial planning workflow built on Team Mode. Use it when the user asks for \`hyperplan\`, \`hpp\`, \`/hyperplan\`, or combines hyperplan with \`deepwork\`.

## Requirements

- Team Mode must be enabled with \`team_mode.enabled: true\`.
- The \`team_*\` tools must be available.
- If Team Mode is unavailable, tell the user to enable it in \`~/.config/opencode/oh-my-cortex.jsonc\` and restart OpenCode.

## Roster

Create a team named \`hyperplan\` with category members:

- \`unspecified-low\`: low-cost ambiguity hunter.
- \`unspecified-high\`: high-quality risk and requirement critic.
- \`ultrabrain\`: deep systems and architecture critic.
- \`artistry\`: creative alternatives and UX/product critic.
- \`deep\`: optional, include only if that category is enabled.

Use \`team_create\` with \`inline_spec\`. If \`deep\` is unavailable, retry without only that member and state that the roster is degraded.

## Workflow

1. Restate the user's planning request and success criteria.
2. Create the hyperplan team.
3. Send each member the same planning request plus its adversarial role.
4. Ask members to identify hidden assumptions, failure modes, missing constraints, and better approaches.
5. Use \`team_task_create\` and \`team_send_message\` to run at least one critique round.
6. Synthesize the strongest objections into a concrete plan with risks and validation steps.
7. Present the plan agent's final output with a short provenance line, then clean up the team with \`team_delete\`.

Do not skip critique rounds. Do not write the final plan before collecting member responses unless a team tool fails and you clearly report the degraded path.
`,
}
