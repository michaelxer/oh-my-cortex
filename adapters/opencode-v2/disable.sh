#!/usr/bin/env bash
# Disable the OhMyCortex V2 compatibility adapter.
# Removes the plugin and the 10 generated OMX agent files; keeps the package
# in ~/.config/opencode/omx-v2 for re-enabling. Backups (*.bak.*) are kept.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/opencode"

rm -f "$CONFIG_DIR/plugins/omx-v2.js"
for f in "$HERE"/agents/*.md; do
  rm -f "$CONFIG_DIR/agents/$(basename "$f")"
done

echo "OMX V2 adapter disabled. Restart OpenCode to unload it."
