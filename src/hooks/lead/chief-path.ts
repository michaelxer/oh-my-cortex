/**
 * Cross-platform check if a path is inside .cortex/ directory.
 * Handles both forward slashes (Unix) and backslashes (Windows).
 * Uses path segment matching (not substring) to avoid false positives like "not-chief/file.txt"
 */
export function isChiefPath(filePath: string): boolean {
  return /\.cortex[/\\]/.test(filePath)
}
