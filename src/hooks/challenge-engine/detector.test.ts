import { describe, expect, test } from "bun:test"
import { parseChallengeCommand } from "./detector"
import { CHALLENGE_COMMAND_MARKER } from "./constants"

describe("parseChallengeCommand", () => {
  describe("#given text without the command marker", () => {
    test("#when parsing regular text #then returns null", () => {
      expect(parseChallengeCommand("Hello, how are you?")).toBeNull()
    })

    test("#when parsing empty string #then returns null", () => {
      expect(parseChallengeCommand("")).toBeNull()
    })

    test("#when parsing text with partial marker #then returns null", () => {
      expect(parseChallengeCommand("Challenge level")).toBeNull()
    })
  })

  describe("#given text with the command marker", () => {
    test("#when level is 1 #then returns 1", () => {
      const text = `${CHALLENGE_COMMAND_MARKER} 1`
      expect(parseChallengeCommand(text)).toBe(1)
    })

    test("#when level is 2 #then returns 2", () => {
      const text = `${CHALLENGE_COMMAND_MARKER} 2`
      expect(parseChallengeCommand(text)).toBe(2)
    })

    test("#when level is 3 #then returns 3", () => {
      const text = `${CHALLENGE_COMMAND_MARKER} 3`
      expect(parseChallengeCommand(text)).toBe(3)
    })

    test("#when level is 4 #then returns 4", () => {
      const text = `${CHALLENGE_COMMAND_MARKER} 4`
      expect(parseChallengeCommand(text)).toBe(4)
    })

    test("#when marker is embedded in longer text #then still parses correctly", () => {
      const text = `Some preamble. ${CHALLENGE_COMMAND_MARKER} 3. Some trailing text.`
      expect(parseChallengeCommand(text)).toBe(3)
    })
  })

  describe("#given text with the marker but invalid level", () => {
    test("#when level is 0 #then returns null", () => {
      const text = `${CHALLENGE_COMMAND_MARKER} 0`
      expect(parseChallengeCommand(text)).toBeNull()
    })

    test("#when level is 5 #then returns null", () => {
      const text = `${CHALLENGE_COMMAND_MARKER} 5`
      expect(parseChallengeCommand(text)).toBeNull()
    })

    test("#when level is 9 #then returns null", () => {
      const text = `${CHALLENGE_COMMAND_MARKER} 9`
      expect(parseChallengeCommand(text)).toBeNull()
    })

    test("#when marker is present but no digit follows #then returns null", () => {
      const text = `${CHALLENGE_COMMAND_MARKER} abc`
      expect(parseChallengeCommand(text)).toBeNull()
    })

    test("#when marker is present but nothing follows #then returns null", () => {
      expect(parseChallengeCommand(CHALLENGE_COMMAND_MARKER)).toBeNull()
    })
  })
})
