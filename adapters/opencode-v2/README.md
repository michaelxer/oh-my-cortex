# OpenCode V2 adapter for oh-my-cortex

[English](./README.md) | [简体中文](./README.zh-cn.md)

Compatibility layer that runs the V1 plugin [`oh-my-cortex`](https://github.com/michaelxer/oh-my-cortex)
on **OpenCode V2** (tested with OpenCode 2.0.32 and oh-my-cortex 0.1.6).

This is **not** a rewrite of oh-my-cortex. OMX is large (~275k lines of source); the adapter loads the
published V1 bundle and translates its runtime surface to V2:

- `{ id, server }` → `{ id, setup(ctx) }`
- V1 `client` (sessions/messages/prompt/status) → a shim over the V2 `ctx`
- V1 hooks → V2 `session.hook`, `tool.hook`, `agent/command/mcp.transform`, `event.subscribe`
- OMX config output → generated agent Markdown, runtime commands, MCP servers

## Requirements

- OpenCode 2.x
- Node.js 20+
- `oh-my-cortex@0.1.6` (the installer bootstraps it into
  `~/.local/share/opencode/omx-v2`; no global npm install needed)

## Install

Project-local (recommended; isolated from other projects):

```bash
./install.sh /path/to/project
cd /path/to/project && opencode
```

Global (available in every project):

```bash
./install.sh --global
opencode
```

The installer:

1. Installs `oh-my-cortex@0.1.6` into `~/.local/share/opencode/omx-v2` if missing.
2. Copies `adapter.js` to `.opencode/plugins/omx-v2.js` (project) or
   `~/.config/opencode/plugins/omx-v2.js` (global).
3. Copies 10 generated agent files to the matching `agents/` directory.
4. For project installs, writes `.opencode/omx-v2.json` so the adapter keeps writing agents
   into that project instead of the global directory.

**Restart OpenCode completely after installing.** Agent files are discovered at startup; the first
run writes them, the next start loads them.

## Usage

TUI: select `Chief---Deepworker` or `Founder---Deep-Agent` as the primary agent.

CLI:

```bash
opencode run --agent Chief---Deepworker -m deepseek/deepseek-flash "review this change"
```

Commands: `/dw-loop`, `/cortex-loop`, `/challenge`, `/decide`, `/lens`, `/hyperplan`,
`/brainstorm`, `/checkpoint`, `/handoff`, and 18 more.

## What is verified

- 10 agents load with the expected model and prompts
- Chief self-identifies correctly (prompt-hook injection works)
- 23 OMX tools register; `cortex_search` executes
- 27 commands register; `$ARGUMENTS` substitution works
- Synchronous delegation works: `call_cortex_agent(subagent_type="researcher",
  run_in_background=false)` returns the child result
- No plugin load errors; stable package resolution

## Known limitations

- `deepwork` / `cortex-loop` multi-phase flows are not end-to-end tested
- Background delegation (`run_in_background=true`) is not fully verified
- Compaction mapping is best-effort
- The V2 `prompt` hook has no message parts/model, so prompt-stage attachments may be lost
- Agent IDs remain slug-style (`Chief---Deepworker`); V2 ignores custom display names
- Global install makes OMX tools/commands visible in every project and may shadow same-named
  tools from other plugins; project-local install avoids this

## Models

Generated agents default to `model: deepseek/deepseek-flash` because that is the model used
during development. Edit the `model:` line in `.opencode/agents/*.md` (or
`~/.config/opencode/agents/*.md`) to use another provider/model. Set `OMX_AGENT_MODEL` before
the first run to change what the adapter writes. Set `OMX_FORCE_MODEL` to control the model used
for delegated child sessions.

## Uninstall

```bash
./uninstall.sh /path/to/project   # project
./uninstall.sh --global           # global
```

## Layout

```
adapter.js          V2 plugin entry + V1→V2 translation (~530 lines)
agents/             10 generated agent templates
install.sh          bootstrap + install (project or global)
uninstall.sh        remove plugin/agents/marker
```

Logs: `~/.config/opencode/omx-v2/adapter.log` (override with `OMX_ADAPTER_LOG`).
Debug: `OMX_ADAPTER_DEBUG=1`.

## License

oh-my-cortex is licensed under the Sustainable Use License 1.0 (SUL-1.0). This adapter is a
derivative work and is distributed under the same terms; see the repository `LICENSE.md` and
[`NOTICE.md`](./NOTICE.md). It is provided free of charge for non-commercial use.
