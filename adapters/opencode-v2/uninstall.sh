#!/usr/bin/env bash
# Remove the OpenCode V2 adapter for oh-my-cortex.
# Usage: ./uninstall.sh /path/to/project   (project-local)
#        ./uninstall.sh --global           (all projects)
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

case "${1:-}" in
  --global)
    "$HERE/disable.sh"
    ;;
  ""|-h|--help)
    echo "usage: $0 /path/to/project | --global" >&2
    exit 2
    ;;
  *)
    [ $# -eq 1 ] || { echo "usage: $0 /path/to/project | --global" >&2; exit 2; }
    "$HERE/uninstall-project.sh" "$1"
    ;;
esac
