import { describe, expect, test } from "bun:test"
import { detectDomain, parseLensCommand } from "./detector"
import { LENS_COMMAND_MARKER } from "./constants"

describe("detectDomain", () => {
  describe("#given text with health keywords", () => {
    test("#when text contains 'diagnosis' #then returns health", () => {
      expect(detectDomain("I need a diagnosis for this condition")).toBe("health")
    })

    test("#when text contains 'medication' #then returns health", () => {
      expect(detectDomain("What medication should I take?")).toBe("health")
    })

    test("#when text contains 'symptom' #then returns health", () => {
      expect(detectDomain("My symptom is getting worse")).toBe("health")
    })

    test("#when text contains 'treatment' #then returns health", () => {
      expect(detectDomain("What treatment options exist?")).toBe("health")
    })

    test("#when text contains 'prescription' #then returns health", () => {
      expect(detectDomain("I need a prescription refill")).toBe("health")
    })
  })

  describe("#given text with legal keywords", () => {
    test("#when text contains 'lawsuit' #then returns legal", () => {
      expect(detectDomain("I want to file a lawsuit")).toBe("legal")
    })

    test("#when text contains 'liability' #then returns legal", () => {
      expect(detectDomain("What is my liability here?")).toBe("legal")
    })

    test("#when text contains 'contract' #then returns legal", () => {
      expect(detectDomain("Review this contract for me")).toBe("legal")
    })

    test("#when text contains 'compliance' #then returns legal", () => {
      expect(detectDomain("We need to ensure compliance")).toBe("legal")
    })

    test("#when text contains 'jurisdiction' #then returns legal", () => {
      expect(detectDomain("Which jurisdiction applies?")).toBe("legal")
    })
  })

  describe("#given text with financial keywords", () => {
    test("#when text contains 'investment' #then returns financial", () => {
      expect(detectDomain("Should I make this investment?")).toBe("financial")
    })

    test("#when text contains 'portfolio' #then returns financial", () => {
      expect(detectDomain("Rebalance my portfolio")).toBe("financial")
    })

    test("#when text contains 'securities' #then returns financial", () => {
      expect(detectDomain("These securities are volatile")).toBe("financial")
    })

    test("#when text contains 'capital gains' #then returns financial", () => {
      expect(detectDomain("How do I handle capital gains?")).toBe("financial")
    })
  })

  describe("#given text with security keywords", () => {
    test("#when text contains 'vulnerability' #then returns security", () => {
      expect(detectDomain("We found a vulnerability")).toBe("security")
    })

    test("#when text contains 'exploit' #then returns security", () => {
      expect(detectDomain("There is an exploit in the wild")).toBe("security")
    })

    test("#when text contains 'breach' #then returns security", () => {
      expect(detectDomain("We had a data breach")).toBe("security")
    })

    test("#when text contains 'ransomware' #then returns security", () => {
      expect(detectDomain("We were hit by ransomware")).toBe("security")
    })

    test("#when text contains 'phishing' #then returns security", () => {
      expect(detectDomain("This looks like a phishing email")).toBe("security")
    })
  })

  describe("#given text with political keywords", () => {
    test("#when text contains 'election' #then returns political", () => {
      expect(detectDomain("The election results are in")).toBe("political")
    })

    test("#when text contains 'legislation' #then returns political", () => {
      expect(detectDomain("New legislation was proposed")).toBe("political")
    })

    test("#when text contains 'partisan' #then returns political", () => {
      expect(detectDomain("This is a partisan issue")).toBe("political")
    })

    test("#when text contains 'gerrymandering' #then returns political", () => {
      expect(detectDomain("Gerrymandering affects representation")).toBe("political")
    })
  })

  describe("#given text without domain keywords", () => {
    test("#when text is generic #then returns null", () => {
      expect(detectDomain("How do I write a for loop in Python?")).toBeNull()
    })

    test("#when text is empty #then returns null", () => {
      expect(detectDomain("")).toBeNull()
    })

    test("#when text is about coding #then returns null", () => {
      expect(detectDomain("Refactor this function to use async/await")).toBeNull()
    })
  })

  describe("#given text with keywords from multiple domains", () => {
    test("#when health keyword appears first #then returns health (priority order)", () => {
      // health is checked before legal in the domain list
      expect(detectDomain("The diagnosis revealed a liability issue")).toBe("health")
    })
  })
})

describe("parseLensCommand", () => {
  describe("#given text without the lens command marker", () => {
    test("#when parsing regular text #then returns null", () => {
      expect(parseLensCommand("Just a regular message")).toBeNull()
    })

    test("#when parsing empty string #then returns null", () => {
      expect(parseLensCommand("")).toBeNull()
    })
  })

  describe("#given text with the lens command marker and valid domain", () => {
    test("#when domain is health #then returns health", () => {
      expect(parseLensCommand(`${LENS_COMMAND_MARKER} health`)).toBe("health")
    })

    test("#when domain is legal #then returns legal", () => {
      expect(parseLensCommand(`${LENS_COMMAND_MARKER} legal`)).toBe("legal")
    })

    test("#when domain is financial #then returns financial", () => {
      expect(parseLensCommand(`${LENS_COMMAND_MARKER} financial`)).toBe("financial")
    })

    test("#when domain is security #then returns security", () => {
      expect(parseLensCommand(`${LENS_COMMAND_MARKER} security`)).toBe("security")
    })

    test("#when domain is political #then returns political", () => {
      expect(parseLensCommand(`${LENS_COMMAND_MARKER} political`)).toBe("political")
    })

    test("#when domain has mixed case #then normalizes and returns domain", () => {
      expect(parseLensCommand(`${LENS_COMMAND_MARKER} Health`)).toBe("health")
    })

    test("#when marker is embedded in longer text #then still parses correctly", () => {
      expect(parseLensCommand(`Preamble. ${LENS_COMMAND_MARKER} security. More text.`)).toBe("security")
    })
  })

  describe("#given text with the marker but invalid domain", () => {
    test("#when domain is unknown #then returns null", () => {
      expect(parseLensCommand(`${LENS_COMMAND_MARKER} cooking`)).toBeNull()
    })

    test("#when marker is present but no domain follows #then returns null", () => {
      expect(parseLensCommand(LENS_COMMAND_MARKER)).toBeNull()
    })
  })
})
