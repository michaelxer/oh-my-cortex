import { PLANNER_AGENT } from "./constants"

export function isPlannerAgent(agentName: string | undefined): boolean {
  return agentName?.toLowerCase().includes(PLANNER_AGENT) ?? false
}
