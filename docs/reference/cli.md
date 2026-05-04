# CLI Reference

Reference for the published `oh-my-cortex` npm CLI. The package now runs a JavaScript installer directly, without native platform package dispatch.

## Basic Usage

```bash
# Display help
npx oh-my-cortex

# Or with Bun
bunx oh-my-cortex
```

## Commands

| Command | Description |
| --- | --- |
| `install` | Interactive setup wizard |
| `version` | Show version information |
| `--version` | Show package version |

The npm CLI is intentionally installer-focused. Runtime behavior is provided by OpenCode after the plugin is registered.

## install

Interactive installation tool for initial oh-my-cortex setup.

### Usage

```bash
npx oh-my-cortex install
```

### Options

| Option | Description |
| --- | --- |
| `--no-tui` | Run in non-interactive mode without TUI |
| `--claude <no\|yes\|max20>` | Claude subscription mode |
| `--openai <no\|yes>` | OpenAI / ChatGPT subscription |
| `--gemini <no\|yes>` | Gemini integration |
| `--copilot <no\|yes>` | GitHub Copilot subscription |
| `--opencode-zen <no\|yes>` | OpenCode Zen access |
| `--zai-coding-plan <no\|yes>` | Z.ai Coding Plan subscription |
| `--kimi-for-coding <no\|yes>` | Kimi for Coding subscription |
| `--opencode-go <no\|yes>` | OpenCode Go subscription |
| `--vercel-ai-gateway <no\|yes>` | Vercel AI Gateway |
| `--skip-auth` | Skip authentication setup hints |

### Examples

```bash
npx oh-my-cortex install
npx oh-my-cortex install --no-tui --claude=max20 --openai=yes --gemini=yes --copilot=no
bunx oh-my-cortex install
```

The installer registers `oh-my-cortex` in OpenCode settings, writes the generated OMX config, and shows provider authentication hints.
