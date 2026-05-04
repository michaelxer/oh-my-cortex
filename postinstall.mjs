// postinstall.mjs
// Keep install lightweight: warn about old OpenCode, but do not require native platform packages.

import { execSync } from "node:child_process";

const MIN_OPENCODE_VERSION = "1.4.0";

/**
 * Parse version string into numeric parts.
 * @param {string} version
 * @returns {number[]}
 */
function parseVersion(version) {
  return version
    .replace(/^v/, "")
    .split("-")[0]
    .split(".")
    .map((part) => Number.parseInt(part, 10) || 0);
}

/**
 * Compare two version strings.
 * @param {string} current
 * @param {string} minimum
 * @returns {boolean} true if current >= minimum
 */
function compareVersions(current, minimum) {
  const currentParts = parseVersion(current);
  const minimumParts = parseVersion(minimum);
  const length = Math.max(currentParts.length, minimumParts.length);

  for (let index = 0; index < length; index++) {
    const currentPart = currentParts[index] ?? 0;
    const minimumPart = minimumParts[index] ?? 0;
    if (currentPart > minimumPart) return true;
    if (currentPart < minimumPart) return false;
  }

  return true;
}

/**
 * Check if opencode version meets minimum requirement.
 * @returns {{ok: boolean, version: string | null}}
 */
function checkOpenCodeVersion() {
  try {
    const result = execSync("opencode --version", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "ignore"],
    });
    const version = result.trim();
    const ok = compareVersions(version, MIN_OPENCODE_VERSION);
    return { ok, version };
  } catch {
    return { ok: true, version: null };
  }
}

function main() {
  const versionCheck = checkOpenCodeVersion();
  if (versionCheck.version && !versionCheck.ok) {
    console.warn(`Warning: oh-my-cortex requires OpenCode >= ${MIN_OPENCODE_VERSION}`);
    console.warn(`  Detected: ${versionCheck.version}`);
    console.warn("  Please update OpenCode to avoid compatibility issues.");
  }
}

main();
