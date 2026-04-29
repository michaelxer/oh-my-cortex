import { describe, expect, test } from "bun:test"
import { DEEPWORK_LOOP_TEMPLATE } from "./cortex-loop"

describe("DEEPWORK_LOOP_TEMPLATE", () => {
  test("returns the documented iteration caps for deepwork and normal modes", () => {
    // given
    const expectedIterationCaps = "The iteration limit is 500 for deepwork mode, 100 for normal mode"

    // when
    const template = DEEPWORK_LOOP_TEMPLATE

    // then
    expect(template).toContain(expectedIterationCaps)
  })
})
