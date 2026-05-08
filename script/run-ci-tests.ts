/// <reference types="bun-types" />

import { existsSync } from "node:fs"

type CiTestPlan = {
  isolatedTestTargets: string[]
  isolatedModuleMockFiles: string[]
  sharedTestFiles: string[]
}

const TEST_ROOTS = ["bin", "script", "src"] as const
const MODULE_MOCK_PATTERN = "mock.module("
const ALWAYS_ISOLATED_TEST_FILES = ["src/openclaw/__tests__/reply-listener-discord.test.ts"] as const
const DEFAULT_MAX_COMMAND_LENGTH = process.platform === "win32" ? 7_000 : 100_000

async function collectTestFiles(rootDirectory: string): Promise<string[]> {
  const testFiles: string[] = []

  for (const testRoot of TEST_ROOTS) {
    const glob = new Bun.Glob("**/*.test.ts")
    const testRootPath = `${rootDirectory}/${testRoot}`

    if (!existsSync(testRootPath)) {
      continue
    }

    for await (const testFile of glob.scan({ cwd: testRootPath })) {
      testFiles.push(`${testRoot}/${testFile}`)
    }
  }

  return testFiles.sort((left, right) => left.localeCompare(right))
}

async function usesModuleMock(rootDirectory: string, testFile: string): Promise<boolean> {
  const testContents = await Bun.file(`${rootDirectory}/${testFile}`).text()
  return testContents.includes(MODULE_MOCK_PATTERN)
}

function toIsolatedTarget(testFile: string): string {
  return testFile
}

function isCoveredByTarget(testFile: string, isolatedTarget: string): boolean {
  return testFile === isolatedTarget || testFile.startsWith(`${isolatedTarget}/`)
}

function collapseNestedTargets(isolatedTargets: string[]): string[] {
  return isolatedTargets.filter((isolatedTarget) => {
    return !isolatedTargets.some((otherTarget) => {
      return otherTarget !== isolatedTarget && isolatedTarget.startsWith(`${otherTarget}/`)
    })
  })
}

export async function createCiTestPlan(rootDirectory: string = process.cwd()): Promise<CiTestPlan> {
  const allTestFiles = await collectTestFiles(rootDirectory)
  const isolatedModuleMockFiles: string[] = []

  for (const testFile of allTestFiles) {
    if (await usesModuleMock(rootDirectory, testFile)) {
      isolatedModuleMockFiles.push(testFile)
    }
  }

  const isolatedTestFiles = Array.from(
    new Set([...isolatedModuleMockFiles, ...ALWAYS_ISOLATED_TEST_FILES.filter((testFile) => allTestFiles.includes(testFile))]),
  )
  const isolatedTestTargets = collapseNestedTargets(
    isolatedTestFiles.map((testFile) => toIsolatedTarget(testFile)).sort((left, right) =>
      left.localeCompare(right),
    ),
  )
  const sharedTestFiles = allTestFiles.filter((testFile) => {
    return !isolatedTestTargets.some((isolatedTarget) => isCoveredByTarget(testFile, isolatedTarget))
  })

  return {
    isolatedTestTargets,
    isolatedModuleMockFiles,
    sharedTestFiles,
  }
}

async function runBunTest(testFiles: string[], label: string): Promise<void> {
  if (testFiles.length === 0) {
    return
  }

  const commandBatches = createBunTestCommandBatches(testFiles)

  for (let index = 0; index < commandBatches.length; index += 1) {
    const command = commandBatches[index]!
    const batchLabel = commandBatches.length === 1 ? label : `${label} (${index + 1}/${commandBatches.length})`
    console.log(`::group::${batchLabel}`)

    const spawnedProcess = Bun.spawn(command, {
      cwd: process.cwd(),
      stdin: "inherit",
      stdout: "inherit",
      stderr: "inherit",
    })
    const exitCode = await spawnedProcess.exited
    console.log("::endgroup::")

    if (exitCode !== 0) {
      throw new Error(`Command failed: ${command.join(" ")}`)
    }
  }
}

function expandBunTestArgs(testFiles: string[]): string[] {
  // For directory paths, exclude _auc* directories which are separate isolated targets.
  return testFiles.map(tf => {
    if (tf.includes('/') && !tf.endsWith('.test.ts')) {
      return [tf, '!_auc-*/**/*.test.ts']
    }
    return tf
  }).flat()
}

function estimateCommandLength(command: string[]): number {
  return command.reduce((total, arg) => total + arg.length + 1, 0)
}

export function createBunTestCommandBatches(
  testFiles: string[],
  maxCommandLength: number = Number(process.env.OMX_CI_TEST_MAX_COMMAND_LENGTH ?? DEFAULT_MAX_COMMAND_LENGTH),
): string[][] {
  const batches: string[][] = []
  let currentArgs: string[] = []

  for (const arg of expandBunTestArgs(testFiles)) {
    const candidateCommand = ["bun", "test", ...currentArgs, arg]
    if (currentArgs.length > 0 && estimateCommandLength(candidateCommand) > maxCommandLength) {
      batches.push(["bun", "test", ...currentArgs])
      currentArgs = [arg]
    } else {
      currentArgs.push(arg)
    }
  }

  if (currentArgs.length > 0) {
    batches.push(["bun", "test", ...currentArgs])
  }

  return batches
}

async function main(): Promise<void> {
  const ciTestPlan = await createCiTestPlan()

  console.log(
    `Detected ${ciTestPlan.isolatedModuleMockFiles.length} mock.module() test files, ${ciTestPlan.isolatedTestTargets.length} isolated targets, and ${ciTestPlan.sharedTestFiles.length} shared test files.`,
  )

  for (const isolatedTestTarget of ciTestPlan.isolatedTestTargets) {
    await runBunTest([isolatedTestTarget], `Isolated ${isolatedTestTarget}`)
  }

  await runBunTest(ciTestPlan.sharedTestFiles, "Shared Bun test suite")
}

export const moduleMockPattern = MODULE_MOCK_PATTERN
export const testRoots = TEST_ROOTS

if (process.argv.includes("--print-plan")) {
  const ciTestPlan = await createCiTestPlan()
  console.log(JSON.stringify(ciTestPlan, null, 2))
} else if (import.meta.main) {
  try {
    await main()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(message)
    process.exit(1)
  }
}
