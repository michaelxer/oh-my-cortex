import { describe, expect, test } from "bun:test"
import { createDecisionFrameworkTool } from "./tool"

describe("createDecisionFrameworkTool", () => {
  describe("#given tool is created", () => {
    test("#when tool is instantiated #then it has a description", () => {
      // given/when
      const tool = createDecisionFrameworkTool()

      // then
      expect(tool.description).toContain("decision")
      expect(tool.description).toContain("tradeoffs")
    })
  })

  describe("#given only topic is provided", () => {
    test("#when execute is called with topic only #then returns template with default options and criteria", async () => {
      // given
      const tool = createDecisionFrameworkTool()

      // when
      const result = await tool.execute({ topic: "Should we hire a CTO?" })

      // then
      expect(result).toContain("## Decision Analysis: Should we hire a CTO?")
      expect(result).toContain("Option A (Safe/Conservative)")
      expect(result).toContain("Option B (Balanced)")
      expect(result).toContain("Option C (Aggressive/Bold)")
      expect(result).toContain("Risk")
      expect(result).toContain("Cost/Effort")
      expect(result).toContain("Speed")
      expect(result).toContain("Reversibility")
      expect(result).toContain("Upside Potential")
      expect(result).toContain("### Objective")
      expect(result).toContain("### Constraints")
      expect(result).toContain("### Options")
      expect(result).toContain("### Evaluation Matrix")
      expect(result).toContain("### Tradeoffs")
      expect(result).toContain("### Second-Order Effects")
      expect(result).toContain("### Failure Modes")
      expect(result).toContain("### Recommendation")
      expect(result).toContain("### Next Action")
    })
  })

  describe("#given custom options are provided", () => {
    test("#when execute is called with specific options #then uses those options in the template", async () => {
      // given
      const tool = createDecisionFrameworkTool()

      // when
      const result = await tool.execute({
        topic: "Cloud provider selection",
        options: ["AWS", "GCP", "Azure"],
      })

      // then
      expect(result).toContain("## Decision Analysis: Cloud provider selection")
      expect(result).toContain("A: AWS")
      expect(result).toContain("B: GCP")
      expect(result).toContain("C: Azure")
      // should NOT contain default options
      expect(result).not.toContain("Safe/Conservative")
      expect(result).not.toContain("Balanced")
      expect(result).not.toContain("Aggressive/Bold")
    })

    test("#when execute is called with 2 options #then generates 2-option table", async () => {
      // given
      const tool = createDecisionFrameworkTool()

      // when
      const result = await tool.execute({
        topic: "Build vs Buy",
        options: ["Build in-house", "Buy SaaS solution"],
      })

      // then
      expect(result).toContain("A: Build in-house")
      expect(result).toContain("B: Buy SaaS solution")
      expect(result).toContain("Option A")
      expect(result).toContain("Option B")
      expect(result).not.toContain("Option C")
    })

    test("#when execute is called with 5 options #then generates 5-option table", async () => {
      // given
      const tool = createDecisionFrameworkTool()

      // when
      const result = await tool.execute({
        topic: "Framework choice",
        options: ["React", "Vue", "Svelte", "Angular", "Solid"],
      })

      // then
      expect(result).toContain("A: React")
      expect(result).toContain("B: Vue")
      expect(result).toContain("C: Svelte")
      expect(result).toContain("D: Angular")
      expect(result).toContain("E: Solid")
    })
  })

  describe("#given custom criteria are provided", () => {
    test("#when execute is called with specific criteria #then uses those criteria in the matrix", async () => {
      // given
      const tool = createDecisionFrameworkTool()

      // when
      const result = await tool.execute({
        topic: "Office location",
        criteria: ["Talent pool", "Cost of living", "Time zone alignment"],
      })

      // then - custom criteria appear in the evaluation matrix
      expect(result).toContain("Talent pool")
      expect(result).toContain("Cost of living")
      expect(result).toContain("Time zone alignment")
      // should NOT contain default criteria in the evaluation matrix rows
      expect(result).not.toContain("Upside Potential")
      expect(result).not.toContain("| Cost/Effort |")
    })
  })

  describe("#given timeframe is provided", () => {
    test("#when execute is called with timeframe #then includes timeframe in output", async () => {
      // given
      const tool = createDecisionFrameworkTool()

      // when
      const result = await tool.execute({
        topic: "Expansion strategy",
        timeframe: "this quarter",
      })

      // then
      expect(result).toContain("**Timeframe:** this quarter")
    })

    test("#when execute is called without timeframe #then does not include timeframe section", async () => {
      // given
      const tool = createDecisionFrameworkTool()

      // when
      const result = await tool.execute({
        topic: "Simple decision",
      })

      // then
      expect(result).not.toContain("**Timeframe:**")
    })
  })

  describe("#given all parameters are provided", () => {
    test("#when execute is called with all args #then generates complete customized template", async () => {
      // given
      const tool = createDecisionFrameworkTool()

      // when
      const result = await tool.execute({
        topic: "Pricing model change",
        options: ["Keep current pricing", "Switch to usage-based", "Hybrid model"],
        criteria: ["Revenue impact", "Churn risk", "Implementation effort", "Market positioning"],
        timeframe: "next 6 months",
      })

      // then - topic
      expect(result).toContain("## Decision Analysis: Pricing model change")

      // then - timeframe
      expect(result).toContain("**Timeframe:** next 6 months")

      // then - custom options
      expect(result).toContain("A: Keep current pricing")
      expect(result).toContain("B: Switch to usage-based")
      expect(result).toContain("C: Hybrid model")

      // then - custom criteria
      expect(result).toContain("Revenue impact")
      expect(result).toContain("Churn risk")
      expect(result).toContain("Implementation effort")
      expect(result).toContain("Market positioning")

      // then - all sections present
      expect(result).toContain("### Objective")
      expect(result).toContain("### Constraints")
      expect(result).toContain("### Options")
      expect(result).toContain("### Evaluation Matrix")
      expect(result).toContain("### Tradeoffs")
      expect(result).toContain("### Second-Order Effects")
      expect(result).toContain("### Failure Modes")
      expect(result).toContain("### Recommendation")
      expect(result).toContain("### Next Action")
      expect(result).toContain("**Confidence:**")
    })
  })

  describe("#given empty arrays for options and criteria", () => {
    test("#when options is empty array #then falls back to default options", async () => {
      // given
      const tool = createDecisionFrameworkTool()

      // when
      const result = await tool.execute({
        topic: "Test decision",
        options: [],
      })

      // then - uses defaults
      expect(result).toContain("Option A (Safe/Conservative)")
      expect(result).toContain("Option B (Balanced)")
      expect(result).toContain("Option C (Aggressive/Bold)")
    })

    test("#when criteria is empty array #then falls back to default criteria", async () => {
      // given
      const tool = createDecisionFrameworkTool()

      // when
      const result = await tool.execute({
        topic: "Test decision",
        criteria: [],
      })

      // then - uses defaults
      expect(result).toContain("Risk")
      expect(result).toContain("Cost/Effort")
      expect(result).toContain("Speed")
    })
  })
})
