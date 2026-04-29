import type { PluginInput } from "@opencode-ai/plugin"
import { log } from "../../../shared/logger"
import { showSpinnerToast } from "./spinner-toast"

export async function showVersionToast(ctx: PluginInput, version: string | null, message: string): Promise<void> {
  const displayVersion = version ?? "unknown"
  await showSpinnerToast(ctx, displayVersion, message)
  log(`[auto-update-checker] Startup toast shown: v${displayVersion}`)
}

export async function showLocalDevToast(
  ctx: PluginInput,
  version: string | null,
  isChiefEnabled: boolean
): Promise<void> {
  const displayVersion = version ?? "dev"
  const message = isChiefEnabled
    ? "Chief running in local development mode."
    : "OMX running in local development mode."
  await showSpinnerToast(ctx, `${displayVersion} (dev)`, message)
  log(`[auto-update-checker] Local dev toast shown: v${displayVersion}`)
}
