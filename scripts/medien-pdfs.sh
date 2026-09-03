#!/usr/bin/env bash
# Erzeugt die WiSo-Quell-PDFs für die Podcast-/Video-Produktion:
# je Thema ein vollständiges Lernskript-Kapitel (Deckblatt + Inhalt + Quellen)
# nach /media/sf_Prfungsvorbereitung_KBM/WiSo-Medien/quell-pdfs/.
#
# Dateinamen folgen der Medien-Konvention wiso-NN-<themaId>.pdf — die fertigen
# Podcasts/Videos bekommen exakt denselben Namen mit .mp3/.mp4 (siehe README
# im Ordner WiSo-Medien), damit sie später automatisch zugeordnet werden können.
#
# Aufruf:  bash scripts/medien-pdfs.sh <ZUGANGSCODE> [URL-Basis]
# Vorher:  npm run build && npm run preview  (Standard-Basis: http://localhost:4173)
set -euo pipefail

CODE="${1:?Bitte den Zugangscode als 1. Argument übergeben}"
BASIS="${2:-http://localhost:4173}"
CHROME="${CHROME:-$(command -v google-chrome || command -v chromium || command -v chromium-browser)}"
ZIEL="${3:-/media/sf_Prfungsvorbereitung_KBM/WiSo-Medien/quell-pdfs}"

mkdir -p "$ZIEL"

node -e '
const fs=require("fs");
const themen=JSON.parse(fs.readFileSync("public/data/themen/wiso.json","utf8"));
themen.forEach((t,i)=>console.log(String(i+1).padStart(2,"0")+" "+t.id));
' | while read -r nr thema; do
  echo "→ wiso-$nr-$thema.pdf"
  "$CHROME" --headless --disable-gpu --no-pdf-header-footer --virtual-time-budget=10000 \
    --print-to-pdf="$ZIEL/wiso-$nr-$thema.pdf" "$BASIS/?code=$CODE#/skript/wiso/$thema" 2>/dev/null
done

ls -la "$ZIEL"
echo "Fertig. Fertige Aufnahmen bitte als wiso-NN-<themaId>.mp3/.mp4 in WiSo-Medien/fertig/ ablegen."
