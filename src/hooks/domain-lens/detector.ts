import type { DomainType } from "./types"
import { DOMAIN_KEYWORDS, LENS_COMMAND_MARKER } from "./constants"

const DOMAIN_NAMES: DomainType[] = ["health", "legal", "financial", "security", "political"]

export function detectDomain(text: string): DomainType | null {
  for (const domain of DOMAIN_NAMES) {
    if (DOMAIN_KEYWORDS[domain].test(text)) {
      return domain
    }
  }
  return null
}

export function parseLensCommand(text: string): DomainType | null {
  if (!text.includes(LENS_COMMAND_MARKER)) {
    return null
  }

  const match = text.match(/Domain lens activated:\s*(\w+)/i)
  if (!match) {
    return null
  }

  const domain = match[1].toLowerCase()
  if (DOMAIN_NAMES.includes(domain as DomainType)) {
    return domain as DomainType
  }

  return null
}
