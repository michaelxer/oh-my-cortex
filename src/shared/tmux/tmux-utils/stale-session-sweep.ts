const STALE_SESSION_PATTERN = /^omx-agents-(\d+)$/

function isProcessAlive(pid: number): boolean {
	try {
		process.kill(pid, 0)
		return true
	} catch (error) {
		const err = error as NodeJS.ErrnoException
		return err?.code === "EPERM"
	}
}

async function listCortexAgentSessionsViaTmux(tmux: string): Promise<string[]> {
	const { spawn } = await import("./spawn-process")
	const proc = spawn([tmux, "list-sessions", "-F", "#{session_name}"], {
		stdout: "pipe",
		stderr: "pipe",
	})
	const [stdout, , exitCode] = await Promise.all([
		new Response(proc.stdout).text(),
		new Response(proc.stderr).text(),
		proc.exited,
	])

	if (exitCode !== 0) {
		return []
	}

	return stdout
		.split("\n")
		.map((line) => line.trim())
		.filter((name) => STALE_SESSION_PATTERN.test(name))
}

async function listTmuxSessionsViaTmux(tmux: string): Promise<string[]> {
	const { runTmuxCommand } = await import("../runner")
	const result = await runTmuxCommand(tmux, ["list-sessions", "-F", "#{session_name}"])

	if (result.exitCode !== 0) {
		return []
	}

	return result.output
		.split("\n")
		.map((line) => line.trim())
		.filter((name) => name.length > 0)
}

export type SweepDeps = {
	isInsideTmux: () => boolean
	getTmuxPath: () => Promise<string | null | undefined>
	listCandidateSessions: (tmux: string) => Promise<string[]>
	killSession: (sessionName: string) => Promise<boolean>
	processAlive: (pid: number) => boolean
	currentPid: number
	log: (message: string, payload?: unknown) => void
}

export type SweepTmuxSessionsDeps = Omit<SweepDeps, "processAlive" | "currentPid">

export type SweepTmuxSessionsOptions = {
	prefix?: string
	predicate?: (sessionName: string) => boolean
}

function matchesSweepOptions(sessionName: string, options: SweepTmuxSessionsOptions): boolean {
	if (options.predicate) {
		return options.predicate(sessionName)
	}

	if (options.prefix) {
		return sessionName.startsWith(options.prefix)
	}

	return true
}

async function buildRuntimeDeps(): Promise<SweepDeps> {
	const [{ log }, { isInsideTmux }, { getTmuxPath }, { killTmuxSessionIfExists }] = await Promise.all([
		import("../../logger"),
		import("./environment"),
		import("../../../tools/interactive-bash/tmux-path-resolver"),
		import("./session-kill"),
	])

	return {
		isInsideTmux,
		getTmuxPath,
		listCandidateSessions: listCortexAgentSessionsViaTmux,
		killSession: killTmuxSessionIfExists,
		processAlive: isProcessAlive,
		currentPid: process.pid,
		log,
	}
}

export async function sweepStaleCortexAgentSessionsWith(deps: SweepDeps): Promise<number> {
	if (!deps.isInsideTmux()) {
		return 0
	}

	const tmux = await deps.getTmuxPath()
	if (!tmux) {
		return 0
	}

	const candidateSessions = await deps.listCandidateSessions(tmux)
	let killedCount = 0

	for (const sessionName of candidateSessions) {
		const pidMatch = sessionName.match(STALE_SESSION_PATTERN)
		if (!pidMatch) continue

		const pid = Number.parseInt(pidMatch[1], 10)
		if (!Number.isFinite(pid)) continue
		if (pid === deps.currentPid) continue
		if (deps.processAlive(pid)) continue

		deps.log("[sweepStaleCortexAgentSessions] killing stale session", { sessionName, deadPid: pid })
		const killed = await deps.killSession(sessionName)
		if (killed) {
			killedCount += 1
		}
	}

	return killedCount
}

export async function sweepTmuxSessionsWith(
	deps: SweepTmuxSessionsDeps,
	options: SweepTmuxSessionsOptions,
): Promise<string[]> {
	if (!deps.isInsideTmux()) {
		return []
	}

	const tmux = await deps.getTmuxPath()
	if (!tmux) {
		return []
	}

	let candidateSessions: string[]
	try {
		candidateSessions = await deps.listCandidateSessions(tmux)
	} catch (error) {
		deps.log("[sweepTmuxSessions] failed to list candidate sessions", {
			error: error instanceof Error ? error.message : String(error),
		})
		return []
	}
	const killedSessionNames: string[] = []

	for (const sessionName of candidateSessions) {
		if (!matchesSweepOptions(sessionName, options)) {
			continue
		}

		let killed = false
		try {
			killed = await deps.killSession(sessionName)
		} catch (error) {
			deps.log("[sweepTmuxSessions] failed to kill candidate session", {
				sessionName,
				error: error instanceof Error ? error.message : String(error),
			})
			continue
		}
		if (killed) {
			killedSessionNames.push(sessionName)
		}
	}

	return killedSessionNames
}

export async function sweepTmuxSessions(options: SweepTmuxSessionsOptions): Promise<string[]> {
	const deps = await buildRuntimeDeps()
	return sweepTmuxSessionsWith(
		{
			isInsideTmux: deps.isInsideTmux,
			getTmuxPath: deps.getTmuxPath,
			listCandidateSessions: listTmuxSessionsViaTmux,
			killSession: deps.killSession,
			log: deps.log,
		},
		options,
	)
}

export async function sweepStaleCortexAgentSessions(): Promise<number> {
	const deps = await buildRuntimeDeps()
	return sweepStaleCortexAgentSessionsWith(deps)
}
