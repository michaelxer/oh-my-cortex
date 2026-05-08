# Installation

## For Humans

### Updating an existing OMX install

If you already installed Oh My Cortex, update by running the installer again:

```bash
npx oh-my-cortex@latest install
```

or:

```bash
bunx oh-my-cortex@latest install
```

Then fully restart OpenCode. Plugin updates are loaded when OpenCode starts, so the current OpenCode window may keep using the old cached plugin until restart.

The current installer also repairs the common old-install bug where OMX was present in config but OMX agents or MCPs did not appear. It rewrites the OpenCode plugin entry to `oh-my-cortex`, writes visible OMX agent/MCP entries, preserves provider settings, and refreshes `oh-my-cortex.json`.

If agents still look stale after restart, close OpenCode completely and clear only the OpenCode package cache for OMX, then run the installer again.

Windows PowerShell:

```powershell
$pkg = Join-Path $env:USERPROFILE ".cache\opencode\packages\node_modules"
Remove-Item -LiteralPath (Join-Path $pkg "oh-my-cortex") -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath (Join-Path $pkg "oh-my-openagent") -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath (Join-Path $pkg "oh-my-opencode") -Recurse -Force -ErrorAction SilentlyContinue
npx oh-my-cortex@latest install
```

macOS / Linux:

```bash
rm -rf "$HOME/.cache/opencode/packages/node_modules/oh-my-cortex" \
       "$HOME/.cache/opencode/packages/node_modules/oh-my-openagent" \
       "$HOME/.cache/opencode/packages/node_modules/oh-my-opencode"
npx oh-my-cortex@latest install
```

Do not delete your whole OpenCode config folder unless you intentionally want a full reset. The update path above preserves provider settings and backs up config files before writing.

### Agent-guided install

Paste this into your LLM agent session:

```text
Install and configure oh-my-cortex by following the instructions here:
https://raw.githubusercontent.com/michaelxer/oh-my-cortex/refs/heads/dev/docs/guide/installation.md
```

The agent should fetch this file with `curl.exe` on Windows PowerShell or `curl` in POSIX shells, ask about your AXR AI and provider access in chat, run the installer with `--no-tui`, verify the setup, and guide provider authentication. This URL is instructions for the agent, not the installer itself.

If the user pasted this guide from inside OpenCode, they already have an OpenCode session running. Do not block the install just because the shell cannot run `opencode --version`; the OpenCode app can be available while the `opencode` CLI is not on that shell's PATH. Continue the OMX install and tell the user to restart OpenCode after configuration.

### Terminal wizard

If you are installing yourself, run this in a real terminal such as PowerShell, Windows Terminal, Terminal, iTerm, or your Linux shell. Do not run the interactive wizard inside an OpenCode agent/chat message, because agents usually cannot display terminal menus.

```bash
npx oh-my-cortex@latest install
```

or, with Bun:

```bash
bunx oh-my-cortex@latest install
```

The wizard asks first whether you are a Mettle community member with an active AXR AI subscription plan. AXR AI is optional; if you are not an AXR AI user, choose No and continue the normal Claude, OpenAI/ChatGPT, Gemini, Copilot, OpenCode Zen, Z.ai, Kimi, OpenCode Go, or Vercel AI Gateway setup. The installer adds `oh-my-cortex` to the OpenCode `plugin` array, writes visible OMX agent/MCP entries, writes `oh-my-cortex.json`, preserves existing provider settings, and backs up files before writing.

The npm package runs the JavaScript installer directly. OMX does not require or publish separate Windows, Linux, macOS, ARM, or x64 platform packages.

If you choose AXR AI Trial or Pro, the installer fetches the public live catalog from:

```text
https://api.axrai.app/v1/models.json
```

If you explicitly choose AXR AI Owner / Full Access, the installer fetches the authenticated owner catalog from:

```text
https://api.axrai.app/v1/catalog
```

Owner / Full Access needs an owner key only to fetch the catalog. In the terminal wizard, OMX first checks `AXRAI_API_KEY`. If it is missing, the wizard asks for the owner key with a password prompt. The key is used once and is not saved.

In non-interactive installs, Owner / Full Access reads `AXRAI_API_KEY` from the environment. OMX removes any raw `apiKey` option from the catalog config before writing OpenCode config. Do not paste owner keys into chat, do not commit keys, and do not write raw keys into `opencode.json`, `oh-my-cortex.json`, or repo files.

Anonymous telemetry is enabled by default to help improve install and runtime reliability. It uses PostHog with a hashed installation identifier and can be disabled with `OMX_SEND_ANONYMOUS_TELEMETRY=0` or `OMX_DISABLE_POSTHOG=1`. See [Privacy Policy](../legal/privacy-policy.md) and [Terms of Service](../legal/terms-of-service.md).

After you install it, read the [OMX User Guide](./user-guide.md), [Agent-Model Matching Guide](./agent-model-matching.md), and [overview guide](./overview.md).

The published package and local binary are `oh-my-cortex`. Inside `opencode.json`, the plugin entry should be `"oh-my-cortex"`.

## For LLM Agents

> **IMPORTANT: Use raw fetch to read this file, not a summarizing webpage reader.** Summaries often drop important flags like `--axrai`, `--openai`, `--no-tui`, and provider-specific setup notes.
>
> ```bash
> curl -fsSL https://raw.githubusercontent.com/michaelxer/oh-my-cortex/refs/heads/dev/docs/guide/installation.md
> ```
>
> In Windows PowerShell, use `curl.exe` because `curl` can resolve to `Invoke-WebRequest`:
>
> ```powershell
> curl.exe -fsSL https://raw.githubusercontent.com/michaelxer/oh-my-cortex/refs/heads/dev/docs/guide/installation.md
> ```
>
> PowerShell-native fallback:
>
> ```powershell
> Invoke-WebRequest -Uri https://raw.githubusercontent.com/michaelxer/oh-my-cortex/refs/heads/dev/docs/guide/installation.md -UseBasicParsing | Select-Object -ExpandProperty Content
> ```

You are helping the user install Oh My Cortex. Ask the questions below in chat, then run `npx oh-my-cortex@latest install --no-tui ...` or `bunx oh-my-cortex@latest install --no-tui ...`. Do not use the terminal TUI unless you have a real interactive terminal. `--no-tui` only disables the terminal menu; it does not remove the need to ask the user setup questions.

If the user says OMX is already installed and they only want to update, do not ask them to delete config. Run the same installer with their AXR/provider answers. Tell them that the installer preserves provider settings, normalizes the plugin entry, rewrites visible OMX agent/MCP entries, and requires a full OpenCode restart. Only suggest clearing the package cache if the restarted OpenCode still shows old or missing agents.

Keep setup questions friendly for non-programmers. Do not ask technical config-location questions such as "Are you using OpenCode CLI config, not desktop config?" during normal setup. Treat OpenCode as the user's OpenCode app/setup and use the normal OpenCode config.

Only discuss config location if the install finishes but OMX does not appear where the user expects it. In that troubleshooting case, explain that the installer uses the OpenCode config detected from the available `opencode` command, then check the actual config path instead of asking the user to choose a technical config type.

If troubleshooting needs that context, ask:

```text
Where did you expect Oh My Cortex to appear?
```

Then offer simple choices:

- In the OpenCode app I already had open
- After starting OpenCode again from the terminal
- I am not sure

### Step 0: Ask About Mettle / AXR AI

Ask first:

```text
Are you a Mettle community member with an active AXR AI subscription plan? AXR AI is optional.
```

Offer these answers:

- Yes, I have an AXR AI plan
- No, but I am interested in getting one
- No, continue normal provider setup

If the user is interested in getting an AXR AI plan, give them this link:

```text
https://axrai.app/
```

Then say:

```text
Take a look at the AXR AI plans. When you are ready, tell me which option fits you.
```

After they have had time to check the link, ask:

```text
Did you get an AXR AI plan?
```

Use these follow-up answers:

- Trial / Pilot -> `--axrai=trial`
- Pro / Core / Builder / Scale -> `--axrai=pro`
- Owner / Full Access -> `--axrai=owner`
- No, continue normal provider setup -> continue normal provider questions

If the user already has an AXR AI plan, ask which plan:

- Trial / Pilot -> `--axrai=trial`
- Pro / Core / Builder / Scale -> `--axrai=pro`
- Owner / Full Access -> `--axrai=owner`
- No active AXR plan -> continue normal provider questions

Tell the user to choose the plan they actually have. Trial/Pilot and Pro/Core/Builder/Scale users should choose their matching Trial or Pro option, not Owner. Only choose Owner / Full Access if the user has owner/full-access permission and can set `AXRAI_API_KEY`; otherwise the owner catalog check will fail and OMX should not silently downgrade them to another tier. If the wrong tier is chosen, OMX may not be able to load and configure the correct agent models, so OMX agents can be missing, mismatched, or unable to run as intended.

If the user chooses Owner / Full Access by mistake, or the owner key check fails and they say they are not actually an Owner / Full Access user, let them go back to the AXR plan choice. Ask:

```text
No problem. Which setup should we use instead?
```

Offer:

- Trial / Pilot -> rerun with `--axrai=trial`
- Pro / Core / Builder / Scale -> rerun with `--axrai=pro`
- No AXR AI plan -> continue normal provider questions

Do not keep asking for an owner key after the user says they selected Owner by mistake.

If the user chooses AXR AI Trial, Pro, or Owner / Full Access, run one of these and skip the normal provider flags:

```bash
npx oh-my-cortex@latest install --no-tui --axrai=trial
npx oh-my-cortex@latest install --no-tui --axrai=pro
npx oh-my-cortex@latest install --no-tui --axrai=owner
```

or:

```bash
bunx oh-my-cortex@latest install --no-tui --axrai=trial
bunx oh-my-cortex@latest install --no-tui --axrai=pro
bunx oh-my-cortex@latest install --no-tui --axrai=owner
```

AXR Trial/Pro mode fetches the public model catalog. Do not ask Trial or Pro users for `AXRAI_API_KEY`.

AXR Owner / Full Access mode requires `AXRAI_API_KEY` in the environment for non-interactive installs. If the user chooses Owner / Full Access and `AXRAI_API_KEY` is missing, do not ask them to paste the key into chat. Tell them not to paste the key into chat, then detect the user's OS yourself before showing commands.

Use:

```bash
node -p "process.platform"
```

If it returns `win32`, show the PowerShell command first. If it returns `darwin` or `linux`, show the macOS/Linux shell command. Only ask "Are you using Windows, macOS, or Linux?" if OS detection fails.

Show only the matching command when possible. If you are unsure which shell the Windows user has, show PowerShell first because it is the recommended Windows terminal.

PowerShell:

```powershell
$env:AXRAI_API_KEY="paste-your-axr-owner-key-here"
npx oh-my-cortex@latest install --no-tui --axrai=owner
```

Windows Command Prompt:

```bat
set AXRAI_API_KEY=paste-your-axr-owner-key-here
npx oh-my-cortex@latest install --no-tui --axrai=owner
```

macOS / Linux shell:

```bash
export AXRAI_API_KEY="paste-your-axr-owner-key-here"
npx oh-my-cortex@latest install --no-tui --axrai=owner
```

Only after giving these commands should you ask the user to run the matching command in their real terminal and report any error text. AXR mode ignores normal provider flags so the generated config stays tied to the selected AXR catalog. Do not invent AXR model IDs. Do not write API keys into config.

For AXR Pro / Owner model recommendations, use the [Agent-Model Matching Guide](./agent-model-matching.md). For AXR Trial / Pilot users, keep the installer defaults and let OMX choose from the limited Trial catalog.

### Step 1: Ask Normal Provider Questions

If the user does not use AXR AI, ask these questions and map answers to flags:

1. Do you have a Claude Pro/Max subscription?
   - max20 mode -> `--claude=max20`
   - yes, normal Pro/Max -> `--claude=yes`
   - no -> `--claude=no`
2. Do you have an OpenAI/ChatGPT Plus subscription?
   - yes -> `--openai=yes`
   - no -> `--openai=no`
3. Will you integrate Google Gemini?
   - yes -> `--gemini=yes`
   - no -> `--gemini=no`
4. Do you have a GitHub Copilot subscription?
   - yes -> `--copilot=yes`
   - no -> `--copilot=no`
5. Do you have access to OpenCode Zen (`opencode/` models)?
   - yes -> `--opencode-zen=yes`
   - no -> `--opencode-zen=no`
6. Do you have an OpenCode Go subscription?
   - yes -> `--opencode-go=yes`
   - no -> `--opencode-go=no`
7. Do you have a Z.ai Coding Plan subscription?
   - yes -> `--zai-coding-plan=yes`
   - no -> `--zai-coding-plan=no`
8. Do you have a Kimi For Coding subscription?
   - yes -> `--kimi-for-coding=yes`
   - no -> `--kimi-for-coding=no`
9. Do you use Vercel AI Gateway?
   - yes -> `--vercel-ai-gateway=yes`
   - no -> `--vercel-ai-gateway=no`

If the user has no Claude subscription, warn them that Chief works best with Claude-family models or the AXR/OpenCode/Kimi/GLM fallback families. The installer still works without Claude.

### Step 2: Check OpenCode

```bash
opencode --version
```

If this command works, continue normally.

If this command fails while the user is currently talking to you inside OpenCode, do not ask them to install OpenCode again. Treat it as "OpenCode CLI is not on PATH for this shell", continue the OMX install, and use file checks plus a restart as verification.

If the user is not inside OpenCode and this command fails, tell the user to install OpenCode from the official docs, then rerun this setup:

```text
https://opencode.ai/docs
```

### Step 3: Run The Installer

Use the flags from the user's answers:

```bash
npx oh-my-cortex@latest install --no-tui \
  --claude=<yes|no|max20> \
  --openai=<yes|no> \
  --gemini=<yes|no> \
  --copilot=<yes|no> \
  --opencode-zen=<yes|no> \
  --opencode-go=<yes|no> \
  --zai-coding-plan=<yes|no> \
  --kimi-for-coding=<yes|no> \
  --vercel-ai-gateway=<yes|no>
```

Examples:

- AXR Trial / Pilot: `npx oh-my-cortex@latest install --no-tui --axrai=trial`
- AXR Pro / Core / Builder / Scale: `npx oh-my-cortex@latest install --no-tui --axrai=pro`
- AXR Owner / Full Access: `npx oh-my-cortex@latest install --no-tui --axrai=owner`
- Claude + OpenAI: `npx oh-my-cortex@latest install --no-tui --claude=yes --openai=yes --gemini=no --copilot=no`
- Claude max20 + Gemini: `npx oh-my-cortex@latest install --no-tui --claude=max20 --openai=no --gemini=yes --copilot=no`
- Copilot only: `npx oh-my-cortex@latest install --no-tui --claude=no --openai=no --gemini=no --copilot=yes`
- OpenCode Zen only: `npx oh-my-cortex@latest install --no-tui --claude=no --openai=no --gemini=no --copilot=no --opencode-zen=yes`
- No subscriptions yet: `npx oh-my-cortex@latest install --no-tui --claude=no --openai=no --gemini=no --copilot=no`

The installer will:

- Register `oh-my-cortex` in `opencode.json`
- Write visible OMX agent entries for Chief, Founder, Thinker, Researcher, Tracker, Planner, Reviewer, Critic, Lead, Worker, and Spotter
- Write visible MCP entries for the built-in OMX MCPs
- Write `oh-my-cortex.json`
- Preserve existing provider settings
- Back up config files before writing
- Keep built-in MCPs and telemetry enabled by default unless explicitly changed

### Step 4: Configure Authentication

Guide the user through auth only for providers they selected. Use a real interactive terminal for `opencode auth login`.

Claude:

```bash
opencode auth login
# Provider: Anthropic
# Login method: Claude Pro/Max
```

Gemini:

```bash
opencode auth login
# Provider: Google
# Choose the login method available in the user's OpenCode setup
```

GitHub Copilot:

```bash
opencode auth login
# Provider: GitHub Copilot
```

AXR AI:

```bash
# Owner / Full Access non-interactive installs need this in the user's shell/profile.
# Do not write the raw key into project files or OpenCode config.
AXRAI_API_KEY=<user-key>
```

Trial and Pro users should not be asked for `AXRAI_API_KEY`.

### Step 5: Verify Setup

Run:

```bash
opencode debug config
opencode agent list
opencode mcp list
```

Before writing the final report, wait for the installer command to finish, then read the OMX config file from disk again. Treat earlier chat history and earlier failed install checks as stale.

On Windows PowerShell:

```powershell
Test-Path "$env:USERPROFILE\.config\opencode\oh-my-cortex.json"
Get-Content -Raw "$env:USERPROFILE\.config\opencode\oh-my-cortex.json"
```

On macOS / Linux:

```bash
test -f "$HOME/.config/opencode/oh-my-cortex.json" && cat "$HOME/.config/opencode/oh-my-cortex.json"
```

Do not show an empty or placeholder `OMX Models and Roles` table. If `oh-my-cortex.json` is missing or cannot be parsed after the installer exits, say verification failed, show the exact path you checked, and continue troubleshooting instead of inventing model rows.

Confirm:

- `opencode.json` contains `oh-my-cortex` in the `plugin` array
- The installer completion summary shows each OMX agent's model assignment
- If the installer summary is not visible, read `oh-my-cortex.json` and summarize `agents.<name>.model` plus the first `fallback_models` entry for each core OMX agent
- The agent list includes Chief and Founder as selectable primary agents
- Thinker, Researcher, Tracker, Planner, Reviewer, Critic, Lead, Worker, and Spotter are present as OMX subagents or visible installed entries
- Built-in MCPs are not disabled in `oh-my-cortex.json`. Depending on your OpenCode version, `opencode mcp list` may show only user-configured MCP servers, so do not treat that command alone as proof that built-in OMX MCPs are missing.

### Troubleshooting

If OpenCode reports `Cannot find package 'zod'`, upgrade:

```bash
cd ~/.config/opencode
npm install oh-my-cortex@latest --save
```

If duplicate agents appear, remove legacy plugin entries such as `oh-my-opencode` or `oh-my-openagent` from `opencode.json`. The installer normalizes the OMX plugin entry when it updates the plugin array.

If an older OMX install keeps loading after an update, close OpenCode completely, clear only the OMX package cache under `~/.cache/opencode/packages/node_modules/`, rerun `npx oh-my-cortex@latest install`, then restart OpenCode.

If MCPs appear missing, check `disabled_mcps` in `oh-my-cortex.json` first. `opencode mcp list` may only report user-configured MCP servers in some OpenCode versions, while OMX built-ins are supplied by the plugin runtime.

If AXR Owner / Full Access fails with `AXR owner API key is missing or invalid.`, ask the user to set `AXRAI_API_KEY` in their real terminal and rerun `npx oh-my-cortex@latest install --no-tui --axrai=owner`. Do not ask them to paste the key into chat.

If AXR Owner / Full Access fails with `This AXR key does not have access to the requested catalog.`, the key is valid but does not have owner catalog access. Ask the user to choose Trial/Pro if that is their actual plan, or confirm their owner access outside chat.

Anonymous telemetry can be disabled with `OMX_SEND_ANONYMOUS_TELEMETRY=0` or `OMX_DISABLE_POSTHOG=1`.

### Finish

Tell the user: Congratulations, Oh My Cortex is installed.

If the user installed from inside an already-open OpenCode session, tell them to restart OpenCode before expecting the new OMX agents to appear. Plugin changes are loaded on startup, so the current OpenCode window/session may not show the new agents until restart.

If the user is in a normal terminal, tell them to start or restart OpenCode with:

```bash
opencode
```

In the final message, always include:

- Install mode, such as AXR Trial, AXR Pro, AXR Owner / Full Access, or normal providers
- Config path checked
- Which primary OMX agents are selectable
- Whether AXR/provider authentication still needs user action
- Reminder to restart OpenCode

Then tell the user the fastest way to start:

```text
deepwork
```

or:

```text
team mode
```

The agent will figure out the rest and handle everything automatically.

#### Advanced Configuration

You can customize agent models and fallback chains in your config. The `fallback_models` field accepts either a single string or an array that mixes strings and per-model objects with settings like `variant` and `temperature`. See the [Configuration Reference](../reference/configuration.md) and example configs in `docs/examples/` for details.
