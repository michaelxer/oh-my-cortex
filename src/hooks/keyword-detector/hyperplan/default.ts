/**
 * Hyperplan keyword detector.
 *
 * Triggers adversarial multi-agent planning via Team Mode.
 */

export const HYPERPLAN_PATTERN = /\b(hyperplan|hpp)\b/i

export const HYPERPLAN_MESSAGE = `<hyperplan-mode>
**MANDATORY**: Say "HYPERPLAN MODE ENABLED!" as your first response, exactly once.

The user invoked hyperplan mode: adversarial multi-agent planning via Team Mode.

LOAD THE HYPERPLAN SKILL IMMEDIATELY:

\`\`\`
skill(name="hyperplan")
\`\`\`

After loading, follow the skill's full workflow EXACTLY:
1. Acknowledge and capture the planning request
2. Spawn the adversarial team via team_create with category members unspecified-low, unspecified-high, ultrabrain, and artistry; include deep only if the category is enabled
3. Round 1: independent analysis from each member
4. Round 2: cross-attack, where each member attacks the other members' findings
5. Round 3: defend, refine, or concede
6. Distill defensible insights into a structured bundle. Lead does NOT write the plan
7. Hand the bundle to the planner agent via task(subagent_type="planner", ...). The planner agent owns sequencing, parallelization, and verification gates
8. Present the planner agent's output with provenance, then clean up the team

Do NOT improvise. Do NOT skip rounds. Do NOT write the plan yourself in step 6. Be the lead orchestrator and let the adversarial members do the cross-critique.

If Team Mode is unavailable (team_* tools missing), instruct the user to set team_mode.enabled=true in oh-my-cortex.jsonc and restart OpenCode.
</hyperplan-mode>`
