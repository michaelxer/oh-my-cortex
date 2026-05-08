import type { BuiltinSkill } from "./types"
import type { BrowserAutomationProvider } from "../../config/schema"

import {
  playwrightSkill,
  agentBrowserSkill,
  playwrightCliSkill,
  frontendUiUxSkill,
  gitMasterSkill,
  devBrowserSkill,
  reviewWorkSkill,
  aiSlopRemoverSkill,
  sessionGuardianSkill,
  reasoningToolkitSkill,
  sensitiveDraftingSkill,
  domainHealthSkill,
  domainLegalSkill,
  domainFinancialSkill,
  domainSecuritySkill,
  domainPoliticalSkill,
  teamModeSkill,
  hyperplanSkill,
} from "./skills/index"

export interface CreateBuiltinSkillsOptions {
  browserProvider?: BrowserAutomationProvider
  disabledSkills?: Set<string>
  teamModeEnabled?: boolean
}

export function createBuiltinSkills(options: CreateBuiltinSkillsOptions = {}): BuiltinSkill[] {
  const { browserProvider = "playwright", disabledSkills, teamModeEnabled = false } = options

  let browserSkill: BuiltinSkill
	if (browserProvider === "agent-browser") {
		browserSkill = agentBrowserSkill
	} else if (browserProvider === "dev-browser") {
		browserSkill = devBrowserSkill
	} else if (browserProvider === "playwright-cli") {
		browserSkill = playwrightCliSkill
	} else {
		browserSkill = playwrightSkill
	}

	const skills = [
		browserSkill,
		frontendUiUxSkill,
		gitMasterSkill,
		reviewWorkSkill,
		aiSlopRemoverSkill,
		sessionGuardianSkill,
		reasoningToolkitSkill,
		sensitiveDraftingSkill,
		domainHealthSkill,
		domainLegalSkill,
		domainFinancialSkill,
		domainSecuritySkill,
		domainPoliticalSkill,
	]

  if (teamModeEnabled && !disabledSkills?.has("team-mode")) {
    skills.push(teamModeSkill)
  }

  if (teamModeEnabled && !disabledSkills?.has("hyperplan")) {
    skills.push(hyperplanSkill)
  }

  if (!disabledSkills) {
    return skills
  }

  return skills.filter((skill) => !disabledSkills.has(skill.name))
}
