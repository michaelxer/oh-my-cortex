/**
 * Creates OMX-specific environment context (timezone, locale).
 * Note: Working directory, platform, and date are already provided by OpenCode's system.ts,
 * so we only include fields that OpenCode doesn't provide to avoid duplication.
 * See: https://github.com/michaelxer/oh-my-cortex/issues/379
 */
export function createEnvContext(): string {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const locale = Intl.DateTimeFormat().resolvedOptions().locale

  return `
<omx-env>
  Timezone: ${timezone}
  Locale: ${locale}
</omx-env>`
}
