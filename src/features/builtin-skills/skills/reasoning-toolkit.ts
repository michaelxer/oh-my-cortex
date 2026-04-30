import type { BuiltinSkill } from "../types"

export const reasoningToolkitSkill: BuiltinSkill = {
  name: "reasoning-toolkit",
  description:
    "Cognitive frameworks, structured reasoning, and uncertainty quantification for complex analysis",
  template: `# Reasoning Toolkit

You have the Reasoning Toolkit loaded. Apply these frameworks on demand when they fit the problem. Name the framework briefly when using it. Prefer the simplest framework that fits.

## Cognitive Frameworks

1. **OODA Loop** - Observe, Orient, Decide, Act. Use for fast decisions under uncertainty or rapidly changing conditions.
2. **Bayesian Reasoning** - Update beliefs with new evidence. Start with a prior, weigh new data, adjust confidence. Use when evidence is partial or conflicting.
3. **First Principles** - Decompose to fundamental truths, then rebuild. Use for novel problems where analogies mislead.
4. **Systems Thinking** - Map feedback loops, delays, and interconnections. Use for problems where components interact in non-obvious ways.
5. **Game Theory** - Model incentives, strategies, and payoffs for multiple players. Use when outcomes depend on others' decisions.
6. **Pareto Analysis** - Identify the 20% of causes driving 80% of effects. Use to prioritize effort on highest-leverage actions.
7. **Pre-Mortem** - Assume the project failed. Work backward to identify why. Use before committing to a plan.
8. **Inversion** - Ask "what would guarantee failure?" then avoid those things. Use to identify hidden risks.
9. **Second-Order Thinking** - Trace consequences of consequences. Use for decisions with downstream ripple effects.
10. **Decision Theory** - Calculate expected value, preserve optionality, minimize regret. Use for high-stakes choices with quantifiable outcomes.
11. **Steel-Manning** - Build the strongest version of the opposing argument before critiquing it. Use to ensure intellectual honesty.
12. **Constraint Theory** - Find the bottleneck that limits the entire system. Use when improving non-bottleneck areas yields no progress.
13. **MECE Decomposition** - Break a problem into mutually exclusive, collectively exhaustive categories. Use for clean categorization without gaps or overlaps.
14. **Fermi Estimation** - Rough quantitative reasoning from first principles. Use when precise data is unavailable but order-of-magnitude matters.

## Uncertainty Template

When making non-obvious claims or assessments, use this structure:

**Assumptions:**
- [List each assumption explicitly]

**Assessment:**
- Confirmed: [Facts verified through direct evidence or authoritative sources]
- Likely: [Well-supported inferences with strong but not conclusive evidence]
- Possible: [Plausible but unverified claims requiring further investigation]
- Speculative: [Hypotheses only, flagged clearly as such]

**What would change this answer:**
- [Conditions or evidence that would alter the conclusion]

## Usage Guidelines

- Apply frameworks when they add clarity, not as decoration.
- Combine frameworks when a problem spans multiple dimensions.
- State your confidence level for non-trivial claims.
- When two frameworks suggest different conclusions, name the tension and explain which you weight more heavily and why.
- Do not force a framework onto a simple problem that does not need one.`,
}
