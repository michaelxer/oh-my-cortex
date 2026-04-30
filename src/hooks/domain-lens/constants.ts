import type { DomainType } from "./types"

export const LENS_COMMAND_MARKER = "Domain lens activated:"

export const DOMAIN_KEYWORDS: Record<DomainType, RegExp> = {
  health: /\b(diagnosis|symptom|medication|dosage|treatment|medical|prescription|side.?effect|disease|therapy|clinical|surgery|chronic|acute|prognosis)\b/i,
  legal: /\b(lawsuit|liability|contract|statute|regulation|legal.?advice|attorney|court|litigation|compliance|tort|jurisdiction|subpoena|deposition)\b/i,
  financial: /\b(investment|portfolio|tax.?advice|fiduciary|securities|trading|financial.?advice|stock.?pick|dividend|capital.?gains|hedge.?fund|retirement.?fund)\b/i,
  security: /\b(vulnerability|exploit|CVE|penetration.?test|zero.?day|breach|malware|attack.?vector|privilege.?escalation|ransomware|phishing|incident.?response)\b/i,
  political: /\b(election|legislation|partisan|lobby|campaign.?finance|political.?party|gerrymandering|voter.?suppression|political.?donation|caucus)\b/i,
}

export const DOMAIN_CAUTION_PROMPTS: Record<DomainType, string> = {
  health: `[Domain Lens: Health]
CAUTION: This conversation touches health/medical territory.
- You are NOT a medical professional. Do not diagnose or prescribe.
- Provide evidence-informed information only, not medical advice.
- Recommend consulting a healthcare provider for specific symptoms or conditions.
- Focus on general wellness, safe protocols, and questions to ask a doctor.
- Flag any red-flag symptoms that require immediate professional attention.`,

  legal: `[Domain Lens: Legal]
CAUTION: This conversation touches legal territory.
- You are NOT a lawyer. This is legal information, NOT legal advice.
- Recommend consulting a qualified attorney for specific situations.
- Be jurisdiction-aware: laws vary by country, state, and municipality.
- Take the conservative interpretation when in doubt.
- Issue-spot and flag risks, but do not declare legal conclusions.`,

  financial: `[Domain Lens: Financial]
CAUTION: This conversation touches financial/investment territory.
- You are NOT a financial advisor. This is information, NOT financial advice.
- Recommend consulting a qualified financial professional for investment decisions.
- State assumptions explicitly. Flag when data may be stale.
- Always acknowledge risk tolerance before discussing options.
- Past performance does not guarantee future results.`,

  security: `[Domain Lens: Security]
CAUTION: This conversation touches security territory.
- Triage first: What is the immediate threat? What is the blast radius?
- Defensive guidance only. Never provide exploit code or attack tools.
- Preserve evidence before remediation.
- Recommend responsible disclosure for discovered vulnerabilities.
- Escalate to qualified security professionals for active incidents.`,

  political: `[Domain Lens: Political]
CAUTION: This conversation touches political territory.
- Present multiple perspectives. Acknowledge legitimate disagreements.
- Be stakeholder-aware: identify who benefits and who is affected.
- Provide face-saving paths for all parties where possible.
- Respect cultural and protocol norms.
- Lawful approaches only. No manipulation tactics.`,
}
