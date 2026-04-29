import type { PluginInput } from "@opencode-ai/plugin"
import { log } from "../../shared/logger"
import { buildContinuationPrompt } from "./continuation-prompt-builder"
import { HOOK_NAME } from "./constants"
import { injectContinuationPrompt } from "./continuation-prompt-injector"
import type { CortexLoopState } from "./types"

type LoopStateController = {
	clear: () => boolean
	markVerificationPending: (sessionID: string) => CortexLoopState | null
}

export async function handleDetectedCompletion(
	ctx: PluginInput,
	input: {
		sessionID: string
		state: CortexLoopState
		loopState: LoopStateController
		directory: string
		apiTimeoutMs: number
	},
): Promise<void> {
	const { sessionID, state, loopState, directory, apiTimeoutMs } = input

	if (state.deepwork && !state.verification_pending) {
		if (state.verification_session_id) {
			ctx.client.session.abort({ path: { id: state.verification_session_id } }).catch(() => {})
		}

		const verificationState = loopState.markVerificationPending(sessionID)
		if (!verificationState) {
			log(`[${HOOK_NAME}] Failed to transition deepwork loop to verification`, {
				sessionID,
			})
			return
		}

		await injectContinuationPrompt(ctx, {
			sessionID,
			prompt: buildContinuationPrompt(verificationState),
			directory,
			apiTimeoutMs,
		})

		await ctx.client.tui?.showToast?.({
			body: {
				title: "DEEPWORK LOOP",
				message: "DONE detected. Thinker verification is now required.",
				variant: "info",
				duration: 5000,
			},
		}).catch(() => {})
		return
	}

	loopState.clear()

	const title = state.deepwork ? "DEEPWORK LOOP COMPLETE!" : "Cortex Loop Complete!"
	const message = state.deepwork
		? `JUST DW DW! Task completed after ${state.iteration} iteration(s)`
		: `Task completed after ${state.iteration} iteration(s)`
	await ctx.client.tui?.showToast?.({
		body: { title, message, variant: "success", duration: 5000 },
	}).catch(() => {})
}
