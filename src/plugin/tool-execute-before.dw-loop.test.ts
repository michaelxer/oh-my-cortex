import { describe, expect, test } from "bun:test"
import { mkdirSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createToolExecuteAfterHandler } from "./tool-execute-after"
import { createToolExecuteBeforeHandler } from "./tool-execute-before"
import { DEEPWORK_VERIFICATION_PROMISE } from "../hooks/cortex-loop/constants"
import { clearState, readState, writeState } from "../hooks/cortex-loop/storage"

describe("tool.execute.before deepwork thinker verification", () => {
	function createCtx(directory: string) {
		return {
			directory,
			client: {
				session: {
					messages: async () => ({ data: [] }),
				},
			},
		}
	}

	function createThinkerTaskArgs(prompt: string): Record<string, unknown> {
		return {
			subagent_type: "thinker",
			run_in_background: true,
			prompt,
		}
	}

	function createSyncTaskMetadata(
		args: Record<string, unknown>,
		sessionId: string,
	): Record<string, unknown> {
		return {
			prompt: args.prompt,
			agent: "thinker",
			run_in_background: args.run_in_background,
			sessionId,
			sync: true,
		}
	}

	test("#given dw loop is awaiting verification #when thinker task runs #then thinker prompt is enforced and sync", async () => {
		const directory = join(tmpdir(), `tool-before-dw-${Date.now()}`)
		mkdirSync(directory, { recursive: true })
		writeState(directory, {
			active: true,
			iteration: 3,
			completion_promise: DEEPWORK_VERIFICATION_PROMISE,
			initial_completion_promise: "DONE",
			started_at: new Date().toISOString(),
			prompt: "Ship feature",
			session_id: "ses-main",
			deepwork: true,
			verification_pending: true,
		})

		const handler = createToolExecuteBeforeHandler({
			ctx: createCtx(directory) as unknown as Parameters<typeof createToolExecuteBeforeHandler>[0]["ctx"],
			hooks: {} as Parameters<typeof createToolExecuteBeforeHandler>[0]["hooks"],
		})
		const output = { args: createThinkerTaskArgs("Check it") }

		await handler({ tool: "task", sessionID: "ses-main", callID: "call-1" }, output)

		expect(readState(directory)?.verification_attempt_id).toBeTruthy()
		expect(output.args.run_in_background).toBe(false)
		expect(output.args.prompt).toContain("Original task:")
		expect(output.args.prompt).toContain("Ship feature")
		expect(output.args.prompt).toContain("Review the work skeptically and critically")
		expect(output.args.prompt).toContain(`<promise>${DEEPWORK_VERIFICATION_PROMISE}</promise>`)

		clearState(directory)
		rmSync(directory, { recursive: true, force: true })
	})

	test("#given dw loop is not awaiting verification #when thinker task runs #then prompt is unchanged", async () => {
		const directory = join(tmpdir(), `tool-before-dw-${Date.now()}-plain`)
		mkdirSync(directory, { recursive: true })
		const handler = createToolExecuteBeforeHandler({
			ctx: createCtx(directory) as unknown as Parameters<typeof createToolExecuteBeforeHandler>[0]["ctx"],
			hooks: {} as Parameters<typeof createToolExecuteBeforeHandler>[0]["hooks"],
		})
		const output = { args: createThinkerTaskArgs("Check it") }

		await handler({ tool: "task", sessionID: "ses-main", callID: "call-1" }, output)

		expect(output.args.run_in_background).toBe(true)
		expect(output.args.prompt).toBe("Check it")

		rmSync(directory, { recursive: true, force: true })
	})

	test("#given dw-loop skill invocation carries user_message #when tool.execute.before runs #then the loop starts with that prompt", async () => {
		const directory = join(tmpdir(), `tool-before-dw-skill-${Date.now()}`)
		mkdirSync(directory, { recursive: true })
		const startLoopCalls: Array<{ sessionID: string; prompt: string; options: Record<string, unknown> }> = []
		const handler = createToolExecuteBeforeHandler({
			ctx: createCtx(directory) as unknown as Parameters<typeof createToolExecuteBeforeHandler>[0]["ctx"],
			hooks: {
				cortexLoop: {
					startLoop: (sessionID: string, prompt: string, options?: Record<string, unknown>) => {
						startLoopCalls.push({ sessionID, prompt, options: options ?? {} })
						return true
					},
					cancelLoop: () => true,
					getState: () => null,
				},
			} as unknown as Parameters<typeof createToolExecuteBeforeHandler>[0]["hooks"],
		})
		const output = {
			args: {
				name: "dw-loop",
				user_message: '"Ship feature" --strategy=continue',
			},
		}

		await handler({ tool: "skill", sessionID: "ses-main", callID: "call-skill-dw" }, output)

		expect(startLoopCalls).toHaveLength(1)
		expect(startLoopCalls[0]).toEqual({
			sessionID: "ses-main",
			prompt: "Ship feature",
			options: {
				deepwork: true,
				maxIterations: undefined,
				completionPromise: undefined,
				strategy: "continue",
			},
		})

		rmSync(directory, { recursive: true, force: true })
	})

	test("#given dw loop is awaiting verification #when thinker sync task metadata is persisted #then thinker session id is stored", async () => {
		const directory = join(tmpdir(), `tool-after-dw-${Date.now()}`)
		mkdirSync(directory, { recursive: true })
		writeState(directory, {
			active: true,
			iteration: 3,
			completion_promise: DEEPWORK_VERIFICATION_PROMISE,
			initial_completion_promise: "DONE",
			started_at: new Date().toISOString(),
			prompt: "Ship feature",
			session_id: "ses-main",
			deepwork: true,
			verification_pending: true,
		})

		const beforeHandler = createToolExecuteBeforeHandler({
			ctx: createCtx(directory) as unknown as Parameters<typeof createToolExecuteBeforeHandler>[0]["ctx"],
			hooks: {} as Parameters<typeof createToolExecuteBeforeHandler>[0]["hooks"],
		})
		const beforeOutput = { args: createThinkerTaskArgs("Check it") }
		await beforeHandler({ tool: "task", sessionID: "ses-main", callID: "call-1" }, beforeOutput)
		const metadataFromSyncTask = createSyncTaskMetadata(beforeOutput.args, "ses-thinker")

		const handler = createToolExecuteAfterHandler({
			ctx: createCtx(directory) as unknown as Parameters<typeof createToolExecuteAfterHandler>[0]["ctx"],
			hooks: {} as Parameters<typeof createToolExecuteAfterHandler>[0]["hooks"],
		})

		await handler(
			{ tool: "task", sessionID: "ses-main", callID: "call-1" },
			{
				title: "thinker task",
				output: "done",
				metadata: metadataFromSyncTask,
			},
		)

		expect(readState(directory)?.verification_session_id).toBe("ses-thinker")

		clearState(directory)
		rmSync(directory, { recursive: true, force: true })
	})

	test("#given dw loop is awaiting verification #when thinker metadata prompt is missing #then thinker session fallback is stored", async () => {
		const directory = join(tmpdir(), `tool-after-dw-fallback-${Date.now()}`)
		mkdirSync(directory, { recursive: true })
		writeState(directory, {
			active: true,
			iteration: 3,
			completion_promise: DEEPWORK_VERIFICATION_PROMISE,
			initial_completion_promise: "DONE",
			started_at: new Date().toISOString(),
			prompt: "Ship feature",
			session_id: "ses-main",
			deepwork: true,
			verification_pending: true,
		})

		const handler = createToolExecuteAfterHandler({
			ctx: createCtx(directory) as unknown as Parameters<typeof createToolExecuteAfterHandler>[0]["ctx"],
			hooks: {} as Parameters<typeof createToolExecuteAfterHandler>[0]["hooks"],
		})

		await handler(
			{ tool: "task", sessionID: "ses-main", callID: "call-1" },
			{
				title: "thinker task",
				output: "done",
				metadata: {
					agent: "thinker",
					sessionId: "ses-thinker-fallback",
					sync: true,
				},
			},
		)

		expect(readState(directory)?.verification_session_id).toBe("ses-thinker-fallback")

		clearState(directory)
		rmSync(directory, { recursive: true, force: true })
	})

	test("#given dw loop is awaiting verification #when thinker metadata uses sessionID #then thinker session id is stored", async () => {
		const directory = join(tmpdir(), `tool-after-dw-sessionid-${Date.now()}`)
		mkdirSync(directory, { recursive: true })
		writeState(directory, {
			active: true,
			iteration: 3,
			completion_promise: DEEPWORK_VERIFICATION_PROMISE,
			initial_completion_promise: "DONE",
			started_at: new Date().toISOString(),
			prompt: "Ship feature",
			session_id: "ses-main",
			deepwork: true,
			verification_pending: true,
		})

		const handler = createToolExecuteAfterHandler({
			ctx: createCtx(directory) as unknown as Parameters<typeof createToolExecuteAfterHandler>[0]["ctx"],
			hooks: {} as Parameters<typeof createToolExecuteAfterHandler>[0]["hooks"],
		})

		await handler(
			{ tool: "task", sessionID: "ses-main", callID: "call-1" },
			{
				title: "thinker task",
				output: "done",
				metadata: {
					agent: "thinker",
					sessionID: "ses-thinker-alt",
					sync: true,
				},
			},
		)

		expect(readState(directory)?.verification_session_id).toBe("ses-thinker-alt")

		clearState(directory)
		rmSync(directory, { recursive: true, force: true })
	})

	test("#given newer thinker attempt exists #when older thinker task finishes #then old session does not overwrite active verification", async () => {
		const directory = join(tmpdir(), `tool-race-dw-${Date.now()}`)
		mkdirSync(directory, { recursive: true })
		writeState(directory, {
			active: true,
			iteration: 3,
			completion_promise: DEEPWORK_VERIFICATION_PROMISE,
			initial_completion_promise: "DONE",
			started_at: new Date().toISOString(),
			prompt: "Ship feature",
			session_id: "ses-main",
			deepwork: true,
			verification_pending: true,
		})

		const beforeHandler = createToolExecuteBeforeHandler({
			ctx: createCtx(directory) as unknown as Parameters<typeof createToolExecuteBeforeHandler>[0]["ctx"],
			hooks: {} as Parameters<typeof createToolExecuteBeforeHandler>[0]["hooks"],
		})
		const afterHandler = createToolExecuteAfterHandler({
			ctx: createCtx(directory) as unknown as Parameters<typeof createToolExecuteAfterHandler>[0]["ctx"],
			hooks: {} as Parameters<typeof createToolExecuteAfterHandler>[0]["hooks"],
		})

		const firstOutput = { args: createThinkerTaskArgs("Check it") }
		await beforeHandler({ tool: "task", sessionID: "ses-main", callID: "call-1" }, firstOutput)
		const firstAttemptId = readState(directory)?.verification_attempt_id

		const secondOutput = { args: createThinkerTaskArgs("Check it again") }
		await beforeHandler({ tool: "task", sessionID: "ses-main", callID: "call-2" }, secondOutput)
		const secondAttemptId = readState(directory)?.verification_attempt_id

		expect(firstAttemptId).toBeTruthy()
		expect(secondAttemptId).toBeTruthy()
		expect(secondAttemptId).not.toBe(firstAttemptId)

		await afterHandler(
			{ tool: "task", sessionID: "ses-main", callID: "call-1" },
			{
				title: "thinker task",
				output: "done",
				metadata: {
					agent: "thinker",
					prompt: String(firstOutput.args.prompt),
					sessionId: "ses-thinker-old",
				},
			},
		)

		expect(readState(directory)?.verification_session_id).toBeUndefined()

		await afterHandler(
			{ tool: "task", sessionID: "ses-main", callID: "call-2" },
			{
				title: "thinker task",
				output: "done",
				metadata: {
					agent: "thinker",
					prompt: String(secondOutput.args.prompt),
					sessionId: "ses-thinker-new",
				},
			},
		)

		expect(readState(directory)?.verification_session_id).toBe("ses-thinker-new")

		clearState(directory)
		rmSync(directory, { recursive: true, force: true })
	})
})
