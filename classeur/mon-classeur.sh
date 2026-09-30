#!/bin/bash
# Lance Mon Classeur (Linux) dans une fenêtre d'application.
DIR="$(cd "$(dirname "$0")" && pwd)"
APP="file://$DIR/index.html"
DATA="${XDG_DATA_HOME:-$HOME/.local/share}/MonClasseur"
mkdir -p "$DATA"
for B in google-chrome google-chrome-stable chromium chromium-browser brave-browser microsoft-edge; do
  if command -v "$B" >/dev/null 2>&1; then
    "$B" --app="$APP" --user-data-dir="$DATA" --window-size=1100,800 >/dev/null 2>&1 &
    exit 0
  fi
done
xdg-open "$APP"
