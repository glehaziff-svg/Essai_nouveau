#!/bin/bash
# Lance Mon Classeur (macOS) dans une fenêtre d'application.
DIR="$(cd "$(dirname "$0")" && pwd)"
APP="file://$DIR/index.html"
DATA="$HOME/Library/Application Support/MonClasseur"
mkdir -p "$DATA"
for B in "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
         "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge" \
         "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser" \
         "/Applications/Chromium.app/Contents/MacOS/Chromium"; do
  if [ -x "$B" ]; then
    "$B" --app="$APP" --user-data-dir="$DATA" --window-size=1100,800 >/dev/null 2>&1 &
    exit 0
  fi
done
open "$APP"
