export const AGENT_NAME_MAP: Record<string, string> = {
  // Chief variants → "chief"
  omx: "chief",
  cortex: "chief",
  OMX: "chief",
  Chief: "chief",
  "Chief - Deepworker": "chief",
  "Chief (Deepworker)": "chief",
  chief: "chief",

  // Founder variants → "founder"
  "Founder (Deep Agent)": "founder",
  "Founder - Deep Agent": "founder",
  founder: "founder",

  // Planner variants → "planner"
  "OMX-Plan": "planner",
  "omx-plan": "planner",
  "Planner-Chief": "planner",
  "planner-chief": "planner",
  "Planner - Plan Builder": "planner",
  "Planner (Plan Builder)": "planner",
  planner: "planner",

  // Lead variants → "lead"
  "orchestrator-chief": "lead",
  Lead: "lead",
  "Lead (Plan Executor)": "lead",
  lead: "lead",

  // Reviewer variants → "reviewer"
  "plan-consultant": "reviewer",
  "Reviewer - Plan Consultant": "reviewer",
  "Reviewer (Plan Consultant)": "reviewer",
  reviewer: "reviewer",

  // Critic variants → "critic"
  "Critic - Plan Critic": "critic",
  "Critic (Plan Critic)": "critic",
  critic: "critic",

  // Worker → "worker"
  "Worker": "worker",
  "worker": "worker",

  // Already lowercase - passthrough
  build: "build",
  thinker: "thinker",
  researcher: "researcher",
  tracker: "tracker",
  "spotter": "spotter",
}

export const BUILTIN_AGENT_NAMES = new Set([
  "chief", // was "Chief"
  "founder",
  "thinker",
  "researcher",
  "tracker",
  "spotter",
  "reviewer", // was "Reviewer - Plan Consultant"
  "critic", // was "Critic - Plan Critic"
  "planner", // was "Planner - Plan Builder"
  "lead", // was "Lead"
  "worker",
  "build",
])

export function migrateAgentNames(
  agents: Record<string, unknown>
): { migrated: Record<string, unknown>; changed: boolean } {
  const migrated: Record<string, unknown> = {}
  let changed = false

  for (const [key, value] of Object.entries(agents)) {
    const newKey = AGENT_NAME_MAP[key.toLowerCase()] ?? AGENT_NAME_MAP[key] ?? key
    if (newKey !== key) {
      changed = true
    }
    migrated[newKey] = value
  }

  return { migrated, changed }
}
