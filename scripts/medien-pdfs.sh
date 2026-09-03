#!/usr/bin/env bash
# Erzeugt die Quell-PDFs für die Podcast-/Video-Produktion — für ALLE Bereiche:
# je Thema ein vollständiges Lernskript-Kapitel (Deckblatt + Inhalt + Quellen)
# nach /media/sf_Prfungsvorbereitung_KBM/<Bereich>-Medien/quell-pdfs/.
#
# Dateinamen folgen der Medien-Konvention <bereich>-NN-<themaId>.pdf — die
# fertigen Podcasts/Videos bekommen exakt denselben Namen mit .mp3/.mp4
# (siehe README im jeweiligen Medienordner), damit sie später automatisch
# zugeordnet werden können.
#
# Aufruf:  bash scripts/medien-pdfs.sh <ZUGANGSCODE> [URL-Basis] [nur-bereich]
# Vorher:  npm run build && npm run preview  (Standard-Basis: http://localhost:4173)
set -euo pipefail

CODE="${1:?Bitte den Zugangscode als 1. Argument übergeben}"
BASIS="${2:-http://localhost:4173}"
NUR="${3:-}"
CHROME="${CHROME:-$(command -v google-chrome || command -v chromium || command -v chromium-browser)}"
WURZEL="/media/sf_Prfungsvorbereitung_KBM"

ordner_fuer() {
  case "$1" in
    wiso) echo "WiSo-Medien" ;;
    kbz) echo "KBZ-Medien" ;;
    buchfuehrung) echo "Buchfuehrung-Medien" ;;
    muendlich) echo "Muendlich-Medien" ;;
  esac
}

for b in wiso kbz buchfuehrung muendlich; do
  [ -n "$NUR" ] && [ "$NUR" != "$b" ] && continue
  ZIEL="$WURZEL/$(ordner_fuer "$b")/quell-pdfs"
  mkdir -p "$ZIEL" "$WURZEL/$(ordner_fuer "$b")/fertig"
  node -e '
const fs=require("fs");
const themen=JSON.parse(fs.readFileSync("public/data/themen/'"$b"'.json","utf8"));
themen.forEach((t,i)=>console.log(String(i+1).padStart(2,"0")+" "+t.id));
' | while read -r nr thema; do
    echo "→ $b-$nr-$thema.pdf"
    "$CHROME" --headless --disable-gpu --no-pdf-header-footer --virtual-time-budget=10000 \
      --print-to-pdf="$ZIEL/$b-$nr-$thema.pdf" "$BASIS/?code=$CODE#/skript/$b/$thema" 2>/dev/null
  done
done

echo "Fertig. Fertige Aufnahmen bitte als <bereich>-NN-<themaId>.mp3/.mp4 in den jeweiligen fertig/-Ordner legen."
