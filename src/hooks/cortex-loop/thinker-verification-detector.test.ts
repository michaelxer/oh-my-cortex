/// <reference types="bun-types" />
import { describe, expect, test } from "bun:test"
import {
	extractThinkerSessionID,
	isThinkerVerified,
	parseThinkerVerificationEvidence,
} from "./thinker-verification-detector"
import { DEEPWORK_VERIFICATION_PROMISE } from "./constants"

describe("parseThinkerVerificationEvidence", () => {
	test("#given valid thinker verification text #then should parse all fields", () => {
		// #given
		const text = `Task completed.

Agent: thinker

<promise>VERIFIED</promise>

<task_metadata>
session_id: ses_thinker_123
</task_metadata>`

		// #when
		const evidence = parseThinkerVerificationEvidence(text)

		// #then
		expect(evidence).toBeDefined()
		expect(evidence?.agent).toBe("thinker")
		expect(evidence?.promise).toBe("VERIFIED")
		expect(evidence?.sessionID).toBe("ses_thinker_123")
	})

	test("#given text without agent line #then should return undefined", () => {
		// #given
		const text = `<promise>VERIFIED</promise>`

		// #when
		const evidence = parseThinkerVerificationEvidence(text)

		// #then
		expect(evidence).toBeUndefined()
	})

	test("#given text without promise tag #then should return undefined", () => {
		// #given
		const text = `Agent: thinker`

		// #when
		const evidence = parseThinkerVerificationEvidence(text)

		// #then
		expect(evidence).toBeUndefined()
	})

	test("#given text with empty agent #then should return undefined", () => {
		// #given
		const text = `Agent:   

<promise>VERIFIED</promise>`

		// #when
		const evidence = parseThinkerVerificationEvidence(text)

		// #then
		expect(evidence).toBeUndefined()
	})

	test("#given text with empty promise #then should return undefined", () => {
		// #given
		const text = `Agent: thinker

<promise>   </promise>`

		// #when
		const evidence = parseThinkerVerificationEvidence(text)

		// #then
		expect(evidence).toBeUndefined()
	})

	test("#given text without metadata #then should parse agent and promise only", () => {
		// #given
		const text = `Agent: thinker

<promise>VERIFIED</promise>`

		// #when
		const evidence = parseThinkerVerificationEvidence(text)

		// #then
		expect(evidence).toBeDefined()
		expect(evidence?.agent).toBe("thinker")
		expect(evidence?.promise).toBe("VERIFIED")
		expect(evidence?.sessionID).toBeUndefined()
	})

	test("#given text with metadata but no session_id #then should parse agent and promise only", () => {
		// #given
		const text = `Agent: thinker

<promise>VERIFIED</promise>

<task_metadata>
other_field: value
</task_metadata>`

		// #when
		const evidence = parseThinkerVerificationEvidence(text)

		// #then
		expect(evidence).toBeDefined()
		expect(evidence?.agent).toBe("thinker")
		expect(evidence?.promise).toBe("VERIFIED")
		expect(evidence?.sessionID).toBeUndefined()
	})

	test("#given empty text #then should return undefined", () => {
		// #given
		const text = ""

		// #when
		const evidence = parseThinkerVerificationEvidence(text)

		// #then
		expect(evidence).toBeUndefined()
	})

	test("#given whitespace-only text #then should return undefined", () => {
		// #given
		const text = "   \n\t  "

		// #when
		const evidence = parseThinkerVerificationEvidence(text)

		// #then
		expect(evidence).toBeUndefined()
	})

	test("#given agent with different casing #then should preserve original case", () => {
		// #given
		const text = `Agent: THINKER

<promise>VERIFIED</promise>`

		// #when
		const evidence = parseThinkerVerificationEvidence(text)

		// #then
		expect(evidence).toBeDefined()
		expect(evidence?.agent).toBe("THINKER")
	})
})

describe("isThinkerVerified", () => {
	test("#given valid thinker verification #then should return true", () => {
		// #given
		const text = `Agent: thinker

<promise>${DEEPWORK_VERIFICATION_PROMISE}</promise>`

		// #when
		const result = isThinkerVerified(text)

		// #then
		expect(result).toBe(true)
	})

	test("#given non-thinker agent #then should return false", () => {
		// #given
		const text = `Agent: chief

<promise>${DEEPWORK_VERIFICATION_PROMISE}</promise>`

		// #when
		const result = isThinkerVerified(text)

		// #then
		expect(result).toBe(false)
	})

	test("#given wrong promise #then should return false", () => {
		// #given
		const text = `Agent: thinker

<promise>DONE</promise>`

		// #when
		const result = isThinkerVerified(text)

		// #then
		expect(result).toBe(false)
	})

	test("#given thinker agent with different casing #then should return true", () => {
		// #given
		const text = `Agent: THINKER

<promise>${DEEPWORK_VERIFICATION_PROMISE}</promise>`

		// #when
		const result = isThinkerVerified(text)

		// #then
		expect(result).toBe(true)
	})

	test("#given empty text #then should return false", () => {
		// #given
		const text = ""

		// #when
		const result = isThinkerVerified(text)

		// #then
		expect(result).toBe(false)
	})
})

describe("extractThinkerSessionID", () => {
	test("#given valid thinker verification with session_id #then should return session_id", () => {
		// #given
		const text = `Agent: thinker

<promise>${DEEPWORK_VERIFICATION_PROMISE}</promise>

<task_metadata>
session_id: ses_thinker_123
</task_metadata>`

		// #when
		const sessionID = extractThinkerSessionID(text)

		// #then
		expect(sessionID).toBe("ses_thinker_123")
	})

	test("#given valid thinker verification without session_id #then should return undefined", () => {
		// #given
		const text = `Agent: thinker

<promise>${DEEPWORK_VERIFICATION_PROMISE}</promise>`

		// #when
		const sessionID = extractThinkerSessionID(text)

		// #then
		expect(sessionID).toBeUndefined()
	})

	test("#given non-thinker agent #then should return undefined", () => {
		// #given
		const text = `Agent: chief

<promise>${DEEPWORK_VERIFICATION_PROMISE}</promise>

<task_metadata>
session_id: ses_sis_123
</task_metadata>`

		// #when
		const sessionID = extractThinkerSessionID(text)

		// #then
		expect(sessionID).toBeUndefined()
	})

	test("#given non-thinker agent with different casing #then should return undefined", () => {
		// #given
		const text = `Agent: CHIEF

<promise>${DEEPWORK_VERIFICATION_PROMISE}</promise>

<task_metadata>
session_id: ses_sis_123
</task_metadata>`

		// #when
		const sessionID = extractThinkerSessionID(text)

		// #then
		expect(sessionID).toBeUndefined()
	})

	test("#given empty text #then should return undefined", () => {
		// #given
		const text = ""

		// #when
		const sessionID = extractThinkerSessionID(text)

		// #then
		expect(sessionID).toBeUndefined()
	})
})
