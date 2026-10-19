#!/usr/bin/env bash
# Enable the OhMyCortex V2 compatibility adapter globally.
# Requires a full OpenCode restart afterwards (agents are discovered at startup).
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/opencode"
PLUGIN_DIR="$CONFIG_DIR/plugins"
AGENT_DIR="$CONFIG_DIR/agents"

mkdir -p "$PLUGIN_DIR" "$AGENT_DIR"

if [ -f "$PLUGIN_DIR/omx-v2.js" ] && ! cmp -s "$HERE/adapter.js" "$PLUGIN_DIR/omx-v2.js"; then
  cp "$PLUGIN_DIR/omx-v2.js" "$PLUGIN_DIR/omx-v2.js.bak.$(date +%s)"
fi
cp "$HERE/adapter.js" "$PLUGIN_DIR/omx-v2.js"

for f in "$HERE"/agents/*.md; do
  name="$(basename "$f")"
  if [ -f "$AGENT_DIR/$name" ] && ! cmp -s "$f" "$AGENT_DIR/$name"; then
    cp "$AGENT_DIR/$name" "$AGENT_DIR/$name.bak.$(date +%s)"
  fi
  cp "$f" "$AGENT_DIR/$name"
done

echo "OMX V2 adapter enabled:"
echo "  plugin: $PLUGIN_DIR/omx-v2.js"
echo "  agents: $AGENT_DIR (10 files)"
echo
echo "Restart OpenCode completely (not just a new session) so the agents are discovered."
echo "Recommended default model for OMX sessions: deepseek/deepseek-flash"
