import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"

export function createDecisionFrameworkTool(): ToolDefinition {
  return tool({
    description:
      "Structures any decision into a clear analysis format with options, tradeoffs, and recommendations. " +
      "Use this tool when facing a decision with multiple viable options, significant tradeoffs, or when " +
      "the user needs help thinking through consequences systematically. " +
      "Returns a structured template that you should fill in with your analysis.",
    args: {
      topic: tool.schema.string().describe("The decision or question to analyze"),
      options: tool.schema
        .array(tool.schema.string())
        .optional()
        .describe("Specific options to evaluate (2-5 options). If not provided, generate Safe/Balanced/Aggressive options."),
      criteria: tool.schema
        .array(tool.schema.string())
        .optional()
        .describe("Evaluation criteria to apply (e.g., cost, risk, speed, reversibility)"),
      timeframe: tool.schema
        .string()
        .optional()
        .describe("Decision timeframe context (e.g., 'immediate', 'this quarter', 'long-term')"),
    },
    execute: async (args) => {
      const { topic, options, criteria, timeframe } = args

      const optionLabels = options && options.length > 0
        ? options
        : ["Option A (Safe/Conservative)", "Option B (Balanced)", "Option C (Aggressive/Bold)"]

      const criteriaList = criteria && criteria.length > 0
        ? criteria
        : ["Risk", "Cost/Effort", "Speed", "Reversibility", "Upside Potential"]

      const timeframeNote = timeframe
        ? `\n**Timeframe:** ${timeframe}\n`
        : ""

      const optionsTable = optionLabels
        .map((opt, i) => `| ${String.fromCharCode(65 + i)}: ${opt} | [Description] | [Pros] | [Cons] | [Risk Level] | [Reversibility] |`)
        .join("\n")

      const criteriaHeader = optionLabels.map((_, i) => `Option ${String.fromCharCode(65 + i)}`).join(" | ")

      const criteriaMatrix = criteriaList
        .map((criterion) => {
          const scores = optionLabels.map((_, i) => `[Score ${String.fromCharCode(65 + i)}]`).join(" | ")
          return `| ${criterion} | ${scores} |`
        })
        .join("\n")

      return `## Decision Analysis: ${topic}
${timeframeNote}
### Objective
[What is the desired outcome? What does success look like?]

### Constraints
[Time, money, skill, risk tolerance, reputation, resources, dependencies]

### Options
| Option | Description | Pros | Cons | Risk | Reversibility |
|--------|-------------|------|------|------|---------------|
${optionsTable}

### Evaluation Matrix
| Criteria | ${criteriaHeader} |
|----------|${optionLabels.map(() => "----------").join("|")}|
${criteriaMatrix}

### Tradeoffs
[Key tradeoffs between options - what do you gain/lose with each choice?]

### Second-Order Effects
[Downstream consequences at 6 months, 1 year, 3 years for each option]

### Failure Modes
[How does each option fail? What is the worst case?]

### Recommendation
**Best option:** [Your recommendation]
**Confidence:** [Confirmed/Likely/Possible/Speculative]
**Rationale:** [Why this option over others - 2-3 sentences]
**Key risk:** [The main thing that could go wrong]

### Next Action
[The single next concrete step to take RIGHT NOW]

---
*Fill in the bracketed sections with your analysis based on the context provided.*`
    },
  })
}
