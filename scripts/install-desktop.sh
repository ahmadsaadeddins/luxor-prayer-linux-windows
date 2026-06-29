#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RELEASE="$ROOT/src-tauri/target/release/luxor-prayer"
DEBUG="$ROOT/src-tauri/target/debug/luxor-prayer"
ICON="$ROOT/src-tauri/icons/128x128.png"
DESKTOP_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/applications"
DESKTOP_FILE="$DESKTOP_DIR/prayer-luxor.desktop"

if [[ -x "$RELEASE" ]]; then
  BINARY="$RELEASE"
elif [[ -x "$DEBUG" ]]; then
  BINARY="$DEBUG"
else
  echo "Binary not found. Build first:" >&2
  echo "  npm run tauri build   # release" >&2
  echo "  npm run tauri dev     # debug (first run compiles it)" >&2
  exit 1
fi

mkdir -p "$DESKTOP_DIR"
sed -e "s|@EXEC@|$BINARY|g" -e "s|@ICON@|$ICON|g" \
  "$ROOT/packaging/prayer-luxor.desktop.in" > "$DESKTOP_FILE"
chmod 644 "$DESKTOP_FILE"

if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database "$DESKTOP_DIR" >/dev/null 2>&1 || true
fi

echo "Installed: $DESKTOP_FILE"
echo "Binary: $BINARY"
