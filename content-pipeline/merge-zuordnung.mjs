// Wandelt MC-kodierte Ziffern-Zuordnungen in den Typ "zuordnung" um.
// Staging-Dateien: content-pipeline/staging/zuordnung-*.json mit
//   { "ziel": "aufgaben" | "lernpaare", "bereich": "wiso" | "kbz" | …,
//     "eintraege": [ { "id", "text"?, "zuordnung": { ziffern, items } } ] }
// text/frage ersetzt (falls angegeben) den Aufgabentext, weil die Teil-
// aufgaben jetzt als Zeilen gerendert werden und nicht mehr im Text stehen
// sollen. optionen/korrekt werden entfernt, loesung/erklaerung bleiben.
// Aufruf: node content-pipeline/merge-zuordnung.mjs
import fs from 'node:fs'
import path from 'node:path'

const stagingDir = 'content-pipeline/staging'
const dataDir = 'public/data'

const dateien = fs
  .readdirSync(stagingDir)
  .filter((f) => f.startsWith('zuordnung-') && f.endsWith('.json'))
  .sort()

if (dateien.length === 0) {
  console.log('Keine Zuordnungs-Staging-Dateien gefunden.')
  process.exit(0)
}

let gesamt = 0
for (const f of dateien) {
  const s = JSON.parse(fs.readFileSync(path.join(stagingDir, f), 'utf8'))
  const { ziel, bereich, eintraege } = s
  if (!['aufgaben', 'lernpaare'].includes(ziel) || !bereich || !Array.isArray(eintraege)) {
    console.error(`${f}: ziel/bereich/eintraege fehlt oder ungültig — übersprungen`)
    continue
  }
  const pfad = `${dataDir}/${ziel}/${bereich}.json`
  const liste = JSON.parse(fs.readFileSync(pfad, 'utf8'))
  let anzahl = 0
  for (const e of eintraege) {
    const alt = liste.find((x) => x.id === e.id)
    if (!alt) {
      console.error(`${f}: ${e.id} nicht in ${pfad} gefunden — übersprungen`)
      continue
    }
    const z = e.zuordnung
    if (!z?.ziffern?.length || !z?.items?.length) {
      console.error(`${f}: ${e.id} ohne vollständige zuordnung — übersprungen`)
      continue
    }
    alt.typ = 'zuordnung'
    alt.zuordnung = z
    if (e.text) {
      if (ziel === 'aufgaben') alt.text = e.text
      else alt.frage = e.text
    }
    delete alt.optionen
    delete alt.korrekt
    anzahl++
  }
  fs.writeFileSync(pfad, JSON.stringify(liste, null, 2) + '\n')
  console.log(`${f}: ${anzahl} Einträge in ${pfad} umgestellt`)
  gesamt += anzahl
}
console.log(`Fertig: ${gesamt} Zuordnungen umgestellt.`)
