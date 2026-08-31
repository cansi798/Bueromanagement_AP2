#!/usr/bin/env bash
# Erzeugt die Download-PDFs (Lernskripte + Präsentationen) über Headless Chrome.
#
# Aufruf:  bash scripts/pdfs.sh <ZUGANGSCODE> [URL-Basis]
# Vorher:  npm run build && npm run preview  (Standard-Basis: http://localhost:4173)
#
# Der Zugangscode wird bewusst als Argument übergeben und steht nirgends im Repo.
set -euo pipefail

CODE="${1:?Bitte den Zugangscode als 1. Argument übergeben}"
BASIS="${2:-http://localhost:4173}"
CHROME="${CHROME:-$(command -v google-chrome || command -v chromium || command -v chromium-browser)}"

mkdir -p public/downloads

for b in wiso kbz buchfuehrung muendlich; do
  echo "→ Skript $b"
  "$CHROME" --headless --disable-gpu --no-pdf-header-footer --virtual-time-budget=10000 \
    --print-to-pdf="public/downloads/skript-$b.pdf" "$BASIS/?code=$CODE#/skript/$b" 2>/dev/null
  echo "→ Präsentation $b"
  "$CHROME" --headless --disable-gpu --no-pdf-header-footer --virtual-time-budget=10000 \
    --print-to-pdf="public/downloads/praesentation-$b.pdf" "$BASIS/?code=$CODE#/praesentation/$b" 2>/dev/null
done

ls -la public/downloads/
echo "Fertig. Danach erneut 'npm run build', damit die PDFs im dist/ landen."
