import type { BuiltinSkill } from "../types"

export const sensitiveDraftingSkill: BuiltinSkill = {
  name: "sensitive-drafting",
  description:
    "Communication protocols for sensitive messages - audience analysis, tone calibration, and screenshot-proofing",
  template: `# Sensitive Drafting Protocol

You have the Sensitive Drafting skill loaded. Apply these protocols when drafting any high-stakes communication.

## Before Drafting

1. **Audience Analysis**: Who reads this? What do they care about? What is their emotional state? What power dynamic exists between sender and recipient?
2. **Desired Outcome**: What should the reader think, feel, or do after reading? Define success before writing.
3. **Context Assessment**: Is this a first communication or part of an ongoing thread? What history exists?
4. **Risk Scan**: Could this be forwarded, screenshotted, or read by unintended audiences?

## Drafting Principles

- **Leverage Preservation**: Do not give away position unnecessarily. Keep options open. Do not over-explain or over-apologize. Every concession should be deliberate.
- **Face-Saving Language**: Reduce blame. Preserve relationships. Allow the other party to maintain dignity. Use "we" over "you" when addressing shared problems.
- **Screenshot-Proofing**: Consider how every sentence looks forwarded out of context. Remove anything that could be weaponized, misquoted, or taken as an admission.
- **Tone Calibration**: Firm but professional. Specific but not attacking. Direct but not aggressive. Warm but not weak.
- **Precision Over Length**: Say exactly what needs to be said. Every extra sentence is a surface for misinterpretation.

## Output Format

Unless the user specifies a single tone, provide 2-3 variants:
- **Diplomatic**: Maximum relationship preservation, softer language, more collaborative framing
- **Direct**: Clear and unambiguous, minimal softening, professional but firm
- **Formal**: Suitable for documentation, legal-adjacent contexts, or hierarchical communication

## Red Flags to Catch

Review every draft for these patterns and remove them:
- Passive aggression masquerading as politeness
- Unnecessary apologies that weaken the sender's position
- Vague threats or ultimatums that escalate without purpose
- Emotional leakage (frustration, sarcasm, or resentment bleeding through)
- Over-sharing context the recipient does not need
- Under-sharing context the recipient needs to act
- Hedging language that undermines the core message

## Sensitive Scenarios

- **Delivering bad news**: Lead with the decision, then explain. Do not bury the lead.
- **Setting boundaries**: Be specific about what is and is not acceptable. No ambiguity.
- **Declining requests**: Acknowledge the request, state the decision, offer alternatives if possible.
- **Addressing conflict**: Separate the person from the behavior. Focus on impact, not intent.
- **Escalation**: State facts, not interpretations. Document the timeline. Propose next steps.`,
}
