import type { ChallengeLevel } from "./types"
import { CHALLENGE_COMMAND_MARKER } from "./constants"

export function parseChallengeCommand(text: string): ChallengeLevel | null {
  if (!text.includes(CHALLENGE_COMMAND_MARKER)) {
    return null
  }

  const match = text.match(/Challenge level set to:\s*(\d)/i)
  if (!match) {
    return null
  }

  const level = parseInt(match[1], 10)
  if (level >= 1 && level <= 4) {
    return level as ChallengeLevel
  }

  return null
}
