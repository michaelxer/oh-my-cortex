export const DECIDE_TEMPLATE = `You are activating the Decision Framework for structured decision analysis.

The user wants to make a decision about: $ARGUMENTS

Use the decision_framework tool to structure this decision. If the tool is not available, produce the analysis manually using this format:

## Decision: [Topic from arguments]

### Objective
What is the user trying to achieve? Clarify the goal.

### Constraints
Time, money, skill, risk, reputation, resources - what limits the options?

### Options
| Option | Description | Pros | Cons | Risk | Reversibility |
|--------|-------------|------|------|------|---------------|
| A (Safe) | ... | ... | ... | Low | High |
| B (Balanced) | ... | ... | ... | Medium | Medium |
| C (Aggressive) | ... | ... | ... | High | Low |

### Tradeoffs
Key tradeoffs between options - what do you gain/lose with each?

### Second-Order Effects
Downstream consequences of each option (6 months, 1 year, 3 years).

### Risks
Main failure modes for each option.

### Recommendation
One recommended path with clear rationale.

### Next Action
The single next concrete step to take.

If the user provided a specific topic, analyze it immediately. If no topic provided, ask what decision they need help with.`
