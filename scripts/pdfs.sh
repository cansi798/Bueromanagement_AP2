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

# Themen-Handouts (eines pro Thema, alle Bereiche)
mkdir -p public/downloads/handouts
node -e '
const fs=require("fs");
for (const b of ["wiso","kbz","buchfuehrung","muendlich"]) {
  for (const t of JSON.parse(fs.readFileSync("public/data/themen/"+b+".json","utf8"))) {
    console.log(b+" "+t.id);
  }
}' | while read -r bereich thema; do
  echo "→ Handout $thema"
  "$CHROME" --headless --disable-gpu --no-pdf-header-footer --virtual-time-budget=10000 \
    --print-to-pdf="public/downloads/handouts/$thema.pdf" "$BASIS/?code=$CODE#/handout/$bereich/$thema" 2>/dev/null
done

ls public/downloads/ public/downloads/handouts/ | head -50
echo "Fertig. Danach erneut 'npm run build', damit die PDFs im dist/ landen."
