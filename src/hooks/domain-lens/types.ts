export type DomainType = "health" | "legal" | "financial" | "security" | "political"

export interface DomainLensState {
  manualOverride: DomainType | null
}
