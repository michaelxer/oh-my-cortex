#!/usr/bin/env bash
# Install the OpenCode V2 adapter for oh-my-cortex.
# Usage: ./install.sh /path/to/project   (project-local, recommended)
#        ./install.sh --global           (all projects)
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STABLE_DIR="$HOME/.local/share/opencode/omx-v2"
OMX_PACKAGE="oh-my-cortex@0.1.6"

bootstrap() {
  if [ -f "$STABLE_DIR/node_modules/oh-my-cortex/dist/index.js" ]; then
    return
  fi
  command -v npm >/dev/null 2>&1 || { echo "npm is required to install $OMX_PACKAGE" >&2; exit 1; }
  echo "Installing $OMX_PACKAGE into $STABLE_DIR ..."
  mkdir -p "$STABLE_DIR"
  if [ ! -f "$STABLE_DIR/package.json" ]; then
    (cd "$STABLE_DIR" && npm init -y >/dev/null 2>&1)
  fi
  (cd "$STABLE_DIR" && npm install "$OMX_PACKAGE" --no-audit --no-fund)
}

case "${1:-}" in
  --global)
    bootstrap
    "$HERE/enable.sh"
    ;;
  ""|-h|--help)
    echo "usage: $0 /path/to/project | --global" >&2
    exit 2
    ;;
  *)
    [ $# -eq 1 ] || { echo "usage: $0 /path/to/project | --global" >&2; exit 2; }
    bootstrap
    "$HERE/install-project.sh" "$1"
    ;;
esac
