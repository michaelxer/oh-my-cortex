#!/usr/bin/env bash
# Install the OhMyCortex V2 adapter into ONE project.
# Usage: install-project.sh /path/to/project
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
[ $# -eq 1 ] || { echo "usage: $0 /path/to/project" >&2; exit 2; }
PROJ="$(cd "$1" && pwd)"
PLUGIN_DIR="$PROJ/.opencode/plugins"
AGENT_DIR="$PROJ/.opencode/agents"

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

cat > "$PROJ/.opencode/omx-v2.json" <<EOF
{
  "agentDir": "$AGENT_DIR"
}
EOF

echo "OMX V2 adapter installed for project: $PROJ"
echo "  plugin: $PLUGIN_DIR/omx-v2.js"
echo "  agents: $AGENT_DIR (10 files)"
echo "  marker: $PROJ/.opencode/omx-v2.json"
echo
echo "Restart OpenCode from this project (agents are discovered at startup)."
echo "Run with: opencode run --agent Chief---Deepworker -m deepseek/deepseek-flash \"...\""
