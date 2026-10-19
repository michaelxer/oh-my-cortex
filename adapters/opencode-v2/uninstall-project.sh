#!/usr/bin/env bash
# Remove the OhMyCortex V2 adapter from ONE project.
# Usage: uninstall-project.sh /path/to/project
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
[ $# -eq 1 ] || { echo "usage: $0 /path/to/project" >&2; exit 2; }
PROJ="$(cd "$1" && pwd)"

rm -f "$PROJ/.opencode/plugins/omx-v2.js"
rm -f "$PROJ/.opencode/omx-v2.json"
for f in "$HERE"/agents/*.md; do
  rm -f "$PROJ/.opencode/agents/$(basename "$f")"
done

echo "OMX V2 adapter removed from $PROJ. Restart OpenCode."
