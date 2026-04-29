import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { basename, dirname, extname, join } from "node:path"

import { parseJsonc } from "../../shared"
import { migrateLegacyConfigFile } from "../../shared/migrate-legacy-config-file"
import { CONFIG_BASENAME, LEGACY_CONFIG_BASENAME } from "../../shared/plugin-identity"
import type { ConfigMergeResult, InstallConfig } from "../types"
import { backupConfigFile } from "./backup-config"
import { getConfigDir, getOmxConfigPath } from "./config-context"
import { deepMergeRecord } from "./deep-merge-record"
import { ensureConfigDirectoryExists } from "./ensure-config-directory-exists"
import { formatErrorWithSuggestion } from "./format-error-with-suggestion"
import { generateOmxConfig } from "./generate-omx-config"

function isEmptyOrWhitespace(content: string): boolean {
  return content.trim().length === 0
}

export function writeOmxConfig(installConfig: InstallConfig): ConfigMergeResult {
  try {
    ensureConfigDirectoryExists()
  } catch (err) {
    return {
      success: false,
      configPath: getConfigDir(),
      error: formatErrorWithSuggestion(err, "create config directory"),
    }
  }

  const detectedConfigPath = getOmxConfigPath()
  const canonicalConfigPath = join(dirname(detectedConfigPath), `${CONFIG_BASENAME}${extname(detectedConfigPath) || ".json"}`)
  const shouldMigrateLegacyPath = basename(detectedConfigPath).startsWith(LEGACY_CONFIG_BASENAME)
  const omxConfigPath = shouldMigrateLegacyPath
    ? ((migrateLegacyConfigFile(detectedConfigPath) || existsSync(canonicalConfigPath))
        ? canonicalConfigPath
        : detectedConfigPath)
    : detectedConfigPath

  try {
    const newConfig = generateOmxConfig(installConfig)

    if (existsSync(omxConfigPath)) {
      const backupResult = backupConfigFile(omxConfigPath)
      if (!backupResult.success) {
        return {
          success: false,
          configPath: omxConfigPath,
          error: `Failed to create backup: ${backupResult.error}`,
        }
      }

      try {
        const stat = statSync(omxConfigPath)
        const content = readFileSync(omxConfigPath, "utf-8")

        if (stat.size === 0 || isEmptyOrWhitespace(content)) {
          writeFileSync(omxConfigPath, JSON.stringify(newConfig, null, 2) + "\n")
          return { success: true, configPath: omxConfigPath }
        }

        const existing = parseJsonc<Record<string, unknown>>(content)
        if (!existing || typeof existing !== "object" || Array.isArray(existing)) {
          writeFileSync(omxConfigPath, JSON.stringify(newConfig, null, 2) + "\n")
          return { success: true, configPath: omxConfigPath }
        }

        const merged = deepMergeRecord(newConfig, existing)
        writeFileSync(omxConfigPath, JSON.stringify(merged, null, 2) + "\n")
      } catch (parseErr) {
        if (parseErr instanceof SyntaxError) {
          writeFileSync(omxConfigPath, JSON.stringify(newConfig, null, 2) + "\n")
          return { success: true, configPath: omxConfigPath }
        }
        throw parseErr
      }
    } else {
      writeFileSync(omxConfigPath, JSON.stringify(newConfig, null, 2) + "\n")
    }

    return { success: true, configPath: omxConfigPath }
  } catch (err) {
    return {
      success: false,
      configPath: omxConfigPath,
      error: formatErrorWithSuggestion(err, `write ${CONFIG_BASENAME} config`),
    }
  }
}
