import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createCortexLoopHook } from "./index"
import { DEEPWORK_VERIFICATION_PROMISE } from "./constants"
import { clearState, writeState } from "./storage"

describe("dw-loop verification", () => {
	const testDir = join(tmpdir(), `dw-loop-verification-${Date.now()}`)
	let promptCalls: Array<{ sessionID: string; text: string }>
	let toastCalls: Array<{ title: string; message: string; variant: string }>
	let abortCalls: Array<{ id: string }>
	let parentTranscriptPath: string
	let thinkerTranscriptPath: string

	function createMockPluginInput() {
		return {
			client: {
				session: {
					promptAsync: async (opts: { path: { id: string }; body: { parts: Array<{ type: string; text: string }> } }) => {
						promptCalls.push({
							sessionID: opts.path.id,
							text: opts.body.parts[0].text,
						})
						return {}
					},
					messages: async () => ({ data: [] }),
					abort: async (opts: { path: { id: string } }) => {
						abortCalls.push({ id: opts.path.id })
						return {}
					},
				},
				tui: {
					showToast: async (opts: { body: { title: string; message: string; variant: string } }) => {
						toastCalls.push(opts.body)
						return {}
					},
				},
			},
			directory: testDir,
		} as unknown as Parameters<typeof createCortexLoopHook>[0]
	}

	beforeEach(() => {
		promptCalls = []
		toastCalls = []
		abortCalls = []
		parentTranscriptPath = join(testDir, "transcript-parent.jsonl")
		thinkerTranscriptPath = join(testDir, "transcript-thinker.jsonl")

		if (!existsSync(testDir)) {
			mkdirSync(testDir, { recursive: true })
		}

		clearState(testDir)
	})

	afterEach(() => {
		clearState(testDir)
		if (existsSync(testDir)) {
			rmSync(testDir, { recursive: true, force: true })
		}
	})

		test("#given dw loop emits DONE #when idle fires #then verification phase starts instead of completing", async () => {
		const hook = createCortexLoopHook(createMockPluginInput(), {
			getTranscriptPath: (sessionID) => sessionID === "ses-thinker" ? thinkerTranscriptPath : parentTranscriptPath,
		})
		hook.startLoop("session-123", "Build API", { deepwork: true })
		writeFileSync(
			parentTranscriptPath,
			`${JSON.stringify({ type: "tool_result", timestamp: new Date().toISOString(), tool_output: { output: "done <promise>DONE</promise>" } })}\n`,
		)

		await hook.event({ event: { type: "session.idle", properties: { sessionID: "session-123" } } })

		expect(hook.getState()?.verification_pending).toBeUndefined()
		expect(hook.getState()?.completion_promise).toBe("DONE")
		expect(hook.getState()?.iteration).toBe(2)
		expect(promptCalls).toHaveLength(1)
		expect(promptCalls[0].text).not.toContain('task(subagent_type="thinker"')
		expect(toastCalls.some((toast) => toast.title === "DEEPWORK LOOP COMPLETE!")).toBe(false)
	})

	test("#given dw loop is awaiting verification #when VERIFIED appears in thinker session #then loop completes", async () => {
		const hook = createCortexLoopHook(createMockPluginInput(), {
			getTranscriptPath: (sessionID) => sessionID === "ses-thinker" ? thinkerTranscriptPath : parentTranscriptPath,
		})
		hook.startLoop("session-123", "Build API", { deepwork: true })
		writeFileSync(
			parentTranscriptPath,
			`${JSON.stringify({ type: "assistant", timestamp: new Date().toISOString(), content: "done <promise>DONE</promise>" })}\n`,
		)

		await hook.event({ event: { type: "session.idle", properties: { sessionID: "session-123" } } })
		writeState(testDir, {
			...hook.getState()!,
			verification_session_id: "ses-thinker",
		})
		writeFileSync(
			thinkerTranscriptPath,
			`${JSON.stringify({ type: "assistant", timestamp: new Date().toISOString(), content: `verified <promise>${DEEPWORK_VERIFICATION_PROMISE}</promise>` })}\n`,
		)

		await hook.event({ event: { type: "session.idle", properties: { sessionID: "session-123" } } })

		expect(hook.getState()).toBeNull()
		expect(toastCalls.some((toast) => toast.title === "DEEPWORK LOOP COMPLETE!")).toBe(true)
	})

	test("#given dw loop is awaiting verification #when thinker session idles with VERIFIED #then loop completes without parent idle", async () => {
		const hook = createCortexLoopHook(createMockPluginInput(), {
			getTranscriptPath: (sessionID) => sessionID === "ses-thinker" ? thinkerTranscriptPath : parentTranscriptPath,
		})
		hook.startLoop("session-123", "Build API", { deepwork: true })
		writeFileSync(
			parentTranscriptPath,
			`${JSON.stringify({ type: "assistant", timestamp: new Date().toISOString(), content: "done <promise>DONE</promise>" })}\n`,
		)

		await hook.event({ event: { type: "session.idle", properties: { sessionID: "session-123" } } })
		writeState(testDir, {
			...hook.getState()!,
			verification_session_id: "ses-thinker",
		})
		writeFileSync(
			thinkerTranscriptPath,
			`${JSON.stringify({ type: "assistant", timestamp: new Date().toISOString(), content: `verified <promise>${DEEPWORK_VERIFICATION_PROMISE}</promise>` })}\n`,
		)

		await hook.event({ event: { type: "session.idle", properties: { sessionID: "ses-thinker" } } })

		expect(hook.getState()).toBeNull()
		expect(toastCalls.some((toast) => toast.title === "DEEPWORK LOOP COMPLETE!")).toBe(true)
	})

	test("#given dw loop is awaiting verification #when thinker transcript stores VERIFIED inside tool_result #then loop completes", async () => {
		const hook = createCortexLoopHook(createMockPluginInput(), {
			getTranscriptPath: (sessionID) => sessionID === "ses-thinker" ? thinkerTranscriptPath : parentTranscriptPath,
		})
		hook.startLoop("session-123", "Build API", { deepwork: true })
		writeFileSync(
			parentTranscriptPath,
			`${JSON.stringify({ type: "assistant", timestamp: new Date().toISOString(), content: "done <promise>DONE</promise>" })}\n`,
		)

		await hook.event({ event: { type: "session.idle", properties: { sessionID: "session-123" } } })
		writeState(testDir, {
			...hook.getState()!,
			verification_session_id: "ses-thinker",
		})
		writeFileSync(
			thinkerTranscriptPath,
			`${JSON.stringify({
				type: "tool_result",
				timestamp: new Date().toISOString(),
				tool_output: `Task completed.\n\nAgent: thinker\n\n<promise>${DEEPWORK_VERIFICATION_PROMISE}</promise>\n\n<task_metadata>\nsession_id: ses-thinker\n</task_metadata>`,
			})}\n`,
		)

		await hook.event({ event: { type: "session.idle", properties: { sessionID: "ses-thinker" } } })

		expect(hook.getState()).toBeNull()
		expect(toastCalls.some((toast) => toast.title === "DEEPWORK LOOP COMPLETE!")).toBe(true)
	})

	test("#given dw loop is awaiting verification without thinker session #when parent idles again #then loop continues until thinker verifies", async () => {
		const hook = createCortexLoopHook(createMockPluginInput(), {
			getTranscriptPath: (sessionID) => sessionID === "ses-thinker" ? thinkerTranscriptPath : parentTranscriptPath,
		})
		hook.startLoop("session-123", "Build API", { deepwork: true })
		writeFileSync(
			parentTranscriptPath,
			`${JSON.stringify({ type: "assistant", timestamp: new Date().toISOString(), content: "done <promise>DONE</promise>" })}\n`,
		)

		await hook.event({ event: { type: "session.idle", properties: { sessionID: "session-123" } } })
		const stateAfterDone = hook.getState()

		await hook.event({ event: { type: "session.idle", properties: { sessionID: "session-123" } } })

		expect(stateAfterDone?.verification_pending).toBe(true)
		expect(hook.getState()?.iteration).toBe(2)
		expect(hook.getState()?.completion_promise).toBe("DONE")
		expect(hook.getState()?.verification_pending).toBeUndefined()
		expect(promptCalls).toHaveLength(2)
		expect(promptCalls[1]?.sessionID).toBe("session-123")
		expect(promptCalls[1]?.text).toContain("Verification failed")
	})

	test("#given dw loop is awaiting thinker verification #when parent idles before VERIFIED arrives #then loop continues instead of waiting", async () => {
		const hook = createCortexLoopHook(createMockPluginInput(), {
			getTranscriptPath: (sessionID) => sessionID === "ses-thinker" ? thinkerTranscriptPath : parentTranscriptPath,
		})
		hook.startLoop("session-123", "Build API", { deepwork: true })
		writeFileSync(
			parentTranscriptPath,
			`${JSON.stringify({ type: "assistant", timestamp: new Date().toISOString(), content: "done <promise>DONE</promise>" })}\n`,
		)

		await hook.event({ event: { type: "session.idle", properties: { sessionID: "session-123" } } })
		writeState(testDir, {
			...hook.getState()!,
			verification_session_id: "ses-thinker",
		})
		writeFileSync(
			thinkerTranscriptPath,
			`${JSON.stringify({ type: "tool_result", timestamp: new Date().toISOString(), tool_output: { output: "still checking" } })}\n`,
		)
		const stateBeforeWait = hook.getState()

		await hook.event({ event: { type: "session.idle", properties: { sessionID: "session-123" } } })

		expect(stateBeforeWait?.verification_session_id).toBe("ses-thinker")
		expect(hook.getState()?.iteration).toBe(2)
		expect(hook.getState()?.completion_promise).toBe("DONE")
		expect(hook.getState()?.verification_pending).toBeUndefined()
		expect(hook.getState()?.verification_session_id).toBeUndefined()
		expect(promptCalls).toHaveLength(2)
		expect(promptCalls[1]?.sessionID).toBe("session-123")
		expect(promptCalls[1]?.text).toContain("Verification failed")
	})

	test("#given thinker verification fails #when thinker session idles #then main session receives retry instructions", async () => {
		const sessionMessages: Record<string, unknown[]> = {
			"session-123": [{}, {}, {}],
		}
		const hook = createCortexLoopHook({
			...createMockPluginInput(),
			client: {
				...createMockPluginInput().client,
				session: {
					...createMockPluginInput().client.session,
					messages: async (opts: { path: { id: string } }) => ({
						data: sessionMessages[opts.path.id] ?? [],
					}),
				},
			},
		} as Parameters<typeof createCortexLoopHook>[0], {
			getTranscriptPath: (sessionID) => sessionID === "ses-thinker" ? thinkerTranscriptPath : parentTranscriptPath,
		})
		hook.startLoop("session-123", "Build API", { deepwork: true })
		writeFileSync(
			parentTranscriptPath,
			`${JSON.stringify({ type: "assistant", timestamp: new Date().toISOString(), content: "done <promise>DONE</promise>" })}\n`,
		)

		await hook.event({ event: { type: "session.idle", properties: { sessionID: "session-123" } } })
		writeState(testDir, {
			...hook.getState()!,
			verification_session_id: "ses-thinker",
		})
		writeFileSync(
			thinkerTranscriptPath,
			`${JSON.stringify({ type: "tool_result", timestamp: new Date().toISOString(), tool_output: { output: "verification failed: missing tests" } })}\n`,
		)

		await hook.event({ event: { type: "session.idle", properties: { sessionID: "ses-thinker" } } })

		expect(hook.getState()?.iteration).toBe(2)
		expect(hook.getState()?.completion_promise).toBe("DONE")
		expect(hook.getState()?.verification_pending).toBeUndefined()
		expect(hook.getState()?.verification_session_id).toBeUndefined()
		expect(hook.getState()?.message_count_at_start).toBe(3)
		expect(promptCalls).toHaveLength(2)
		expect(promptCalls[1]?.sessionID).toBe("session-123")
		expect(promptCalls[1]?.text).toContain("Verification failed")
		expect(promptCalls[1]?.text).toContain("Thinker does not lie")
		expect(promptCalls[1]?.text).toContain('task(subagent_type="thinker"')
	})

	test("#given dw loop without max iterations #when it continues #then it stays unbounded", async () => {
		const hook = createCortexLoopHook(createMockPluginInput(), {
			getTranscriptPath: (sessionID) => sessionID === "ses-thinker" ? thinkerTranscriptPath : parentTranscriptPath,
		})
		hook.startLoop("session-123", "Build API", { deepwork: true })

		await hook.event({ event: { type: "session.idle", properties: { sessionID: "session-123" } } })

		expect(hook.getState()?.iteration).toBe(2)
		expect(hook.getState()?.max_iterations).toBe(500)
		expect(promptCalls[0].text).toContain("2/500")
	})

	test("#given prior transcript completion from older run #when new dw loop starts #then old completion is ignored", async () => {
		writeFileSync(
			parentTranscriptPath,
			`${JSON.stringify({ type: "assistant", timestamp: "2000-01-01T00:00:00.000Z", content: "old <promise>DONE</promise>" })}\n`,
		)
		const hook = createCortexLoopHook(createMockPluginInput(), {
			getTranscriptPath: (sessionID) => sessionID === "ses-thinker" ? thinkerTranscriptPath : parentTranscriptPath,
		})
		hook.startLoop("session-123", "Build API", { deepwork: true })

		await hook.event({ event: { type: "session.idle", properties: { sessionID: "session-123" } } })

		expect(hook.getState()?.iteration).toBe(2)
		expect(hook.getState()?.verification_pending).toBeUndefined()
		expect(promptCalls).toHaveLength(1)
	})

	test("#given dw loop was awaiting verification #when same session starts again #then verification state is overwritten", async () => {
		const hook = createCortexLoopHook(createMockPluginInput(), {
			getTranscriptPath: (sessionID) => sessionID === "ses-thinker" ? thinkerTranscriptPath : parentTranscriptPath,
		})
		hook.startLoop("session-123", "Build API", { deepwork: true })
		writeFileSync(
			parentTranscriptPath,
			`${JSON.stringify({ type: "assistant", timestamp: new Date().toISOString(), content: "done <promise>DONE</promise>" })}\n`,
		)

		await hook.event({ event: { type: "session.idle", properties: { sessionID: "session-123" } } })
		hook.startLoop("session-123", "Restarted task", { deepwork: true })

		expect(hook.getState()?.prompt).toBe("Restarted task")
		expect(hook.getState()?.verification_pending).toBeUndefined()
		expect(hook.getState()?.completion_promise).toBe("DONE")
	})

	test("#given dw loop was awaiting verification #when different session starts a new dw loop #then prior verification state is overwritten", async () => {
		const hook = createCortexLoopHook(createMockPluginInput(), {
			getTranscriptPath: (sessionID) => sessionID === "ses-thinker" ? thinkerTranscriptPath : parentTranscriptPath,
		})
		hook.startLoop("session-123", "Build API", { deepwork: true })
		writeFileSync(
			parentTranscriptPath,
			`${JSON.stringify({ type: "assistant", timestamp: new Date().toISOString(), content: "done <promise>DONE</promise>" })}\n`,
		)

		await hook.event({ event: { type: "session.idle", properties: { sessionID: "session-123" } } })
		hook.startLoop("session-456", "Ship CLI", { deepwork: true })

		expect(hook.getState()?.session_id).toBe("session-456")
		expect(hook.getState()?.prompt).toBe("Ship CLI")
		expect(hook.getState()?.verification_pending).toBeUndefined()
		expect(hook.getState()?.completion_promise).toBe("DONE")
	})

	test("#given verification state was overwritten by different dw loop #when stale thinker session idles #then new loop remains active", async () => {
		const hook = createCortexLoopHook(createMockPluginInput(), {
			getTranscriptPath: (sessionID) => sessionID === "ses-thinker-old" ? thinkerTranscriptPath : parentTranscriptPath,
		})
		hook.startLoop("session-123", "Build API", { deepwork: true })
		writeFileSync(
			parentTranscriptPath,
			`${JSON.stringify({ type: "assistant", timestamp: new Date().toISOString(), content: "done <promise>DONE</promise>" })}\n`,
		)

		await hook.event({ event: { type: "session.idle", properties: { sessionID: "session-123" } } })
		writeState(testDir, {
			...hook.getState()!,
			verification_session_id: "ses-thinker-old",
		})
		hook.startLoop("session-456", "Ship CLI", { deepwork: true })
		writeFileSync(
			thinkerTranscriptPath,
			`${JSON.stringify({ type: "assistant", timestamp: new Date().toISOString(), content: `verified <promise>${DEEPWORK_VERIFICATION_PROMISE}</promise>` })}\n`,
		)

		await hook.event({ event: { type: "session.idle", properties: { sessionID: "ses-thinker-old" } } })

		expect(hook.getState()?.session_id).toBe("session-456")
		expect(hook.getState()?.prompt).toBe("Ship CLI")
		expect(hook.getState()?.iteration).toBe(1)
		expect(toastCalls.some((toast) => toast.title === "DEEPWORK LOOP COMPLETE!")).toBe(false)
	})

	test("#given verification state was overwritten by restarted dw loop #when stale thinker session idles #then restarted loop remains active", async () => {
		const hook = createCortexLoopHook(createMockPluginInput(), {
			getTranscriptPath: (sessionID) => sessionID === "ses-thinker-old" ? thinkerTranscriptPath : parentTranscriptPath,
		})
		hook.startLoop("session-123", "Build API", { deepwork: true })
		writeFileSync(
			parentTranscriptPath,
			`${JSON.stringify({ type: "assistant", timestamp: new Date().toISOString(), content: "done <promise>DONE</promise>" })}\n`,
		)

		await hook.event({ event: { type: "session.idle", properties: { sessionID: "session-123" } } })
		writeState(testDir, {
			...hook.getState()!,
			verification_session_id: "ses-thinker-old",
		})
		hook.startLoop("session-123", "Restarted task", { deepwork: true })
		writeFileSync(
			thinkerTranscriptPath,
			`${JSON.stringify({ type: "assistant", timestamp: new Date().toISOString(), content: `verified <promise>${DEEPWORK_VERIFICATION_PROMISE}</promise>` })}\n`,
		)

		await hook.event({ event: { type: "session.idle", properties: { sessionID: "ses-thinker-old" } } })

		expect(hook.getState()?.session_id).toBe("session-123")
		expect(hook.getState()?.prompt).toBe("Restarted task")
		expect(hook.getState()?.iteration).toBe(1)
		expect(hook.getState()?.verification_pending).toBeUndefined()
		expect(toastCalls.some((toast) => toast.title === "DEEPWORK LOOP COMPLETE!")).toBe(false)
	})

	test("#given parent session emits VERIFIED #when thinker session is not tracked #then dw loop completes from parent session evidence", async () => {
		const hook = createCortexLoopHook(createMockPluginInput(), {
			getTranscriptPath: (sessionID) => sessionID === "ses-thinker" ? thinkerTranscriptPath : parentTranscriptPath,
		})
		hook.startLoop("session-123", "Build API", { deepwork: true })
		writeFileSync(
			parentTranscriptPath,
			`${JSON.stringify({ type: "assistant", timestamp: new Date().toISOString(), content: "done <promise>DONE</promise>" })}\n`,
		)

		await hook.event({ event: { type: "session.idle", properties: { sessionID: "session-123" } } })
		writeFileSync(
			parentTranscriptPath,
			`${JSON.stringify({ type: "assistant", timestamp: new Date().toISOString(), content: "done <promise>DONE</promise>" })}\n${JSON.stringify({ type: "assistant", timestamp: new Date().toISOString(), content: `verified <promise>${DEEPWORK_VERIFICATION_PROMISE}</promise>` })}\n`,
		)

		await hook.event({ event: { type: "session.idle", properties: { sessionID: "session-123" } } })

		expect(hook.getState()).toBeNull()
		expect(toastCalls.some((toast) => toast.title === "DEEPWORK LOOP COMPLETE!")).toBe(true)
	})

	test("#given thinker verification fails #when loop restarts #then old thinker session is aborted", async () => {
		const sessionMessages: Record<string, unknown[]> = {
			"session-123": [{}, {}, {}],
		}
		const hook = createCortexLoopHook({
			...createMockPluginInput(),
			client: {
				...createMockPluginInput().client,
				session: {
					...createMockPluginInput().client.session,
					messages: async (opts: { path: { id: string } }) => ({
						data: sessionMessages[opts.path.id] ?? [],
					}),
				},
			},
		} as Parameters<typeof createCortexLoopHook>[0], {
			getTranscriptPath: (sessionID) => sessionID === "ses-thinker" ? thinkerTranscriptPath : parentTranscriptPath,
		})
		hook.startLoop("session-123", "Build API", { deepwork: true })
		writeFileSync(
			parentTranscriptPath,
			`${JSON.stringify({ type: "assistant", timestamp: new Date().toISOString(), content: "done <promise>DONE</promise>" })}\n`,
		)

		await hook.event({ event: { type: "session.idle", properties: { sessionID: "session-123" } } })
		writeState(testDir, {
			...hook.getState()!,
			verification_session_id: "ses-thinker",
		})
		writeFileSync(
			thinkerTranscriptPath,
			`${JSON.stringify({ type: "tool_result", timestamp: new Date().toISOString(), tool_output: { output: "verification failed: missing tests" } })}\n`,
		)

		await hook.event({ event: { type: "session.idle", properties: { sessionID: "ses-thinker" } } })

		expect(abortCalls).toHaveLength(1)
		expect(abortCalls[0].id).toBe("ses-thinker")
	})

	test("#given dw loop re-enters verification #when DONE detected again after failed verification #then previous verification session is aborted", async () => {
		const sessionMessages: Record<string, unknown[]> = {
			"session-123": [{}, {}, {}],
		}
		const hook = createCortexLoopHook({
			...createMockPluginInput(),
			client: {
				...createMockPluginInput().client,
				session: {
					...createMockPluginInput().client.session,
					messages: async (opts: { path: { id: string } }) => ({
						data: sessionMessages[opts.path.id] ?? [],
					}),
				},
			},
		} as Parameters<typeof createCortexLoopHook>[0], {
			getTranscriptPath: (sessionID) => sessionID === "ses-thinker" ? thinkerTranscriptPath : parentTranscriptPath,
		})
		hook.startLoop("session-123", "Build API", { deepwork: true })
		writeFileSync(
			parentTranscriptPath,
			`${JSON.stringify({ type: "assistant", timestamp: new Date().toISOString(), content: "done <promise>DONE</promise>" })}\n`,
		)

		await hook.event({ event: { type: "session.idle", properties: { sessionID: "session-123" } } })
		writeState(testDir, {
			...hook.getState()!,
			verification_session_id: "ses-thinker",
		})
		writeFileSync(
			thinkerTranscriptPath,
			`${JSON.stringify({ type: "tool_result", timestamp: new Date().toISOString(), tool_output: { output: "failed" } })}\n`,
		)

		await hook.event({ event: { type: "session.idle", properties: { sessionID: "ses-thinker" } } })
		abortCalls.length = 0

		writeFileSync(
			parentTranscriptPath,
			`${JSON.stringify({ type: "assistant", timestamp: new Date().toISOString(), content: "fixed it <promise>DONE</promise>" })}\n`,
		)
		writeState(testDir, {
			...hook.getState()!,
			verification_session_id: "ses-thinker-old",
		})

		await hook.event({ event: { type: "session.idle", properties: { sessionID: "session-123" } } })

		expect(abortCalls).toHaveLength(1)
		expect(abortCalls[0].id).toBe("ses-thinker-old")
	})
})
