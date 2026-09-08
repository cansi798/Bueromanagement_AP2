// Merged Rechnen-Aufgaben (content-pipeline/staging/rechnen-aufgaben.json)
// in die Kapitel von public/data/rechnen.json.
// Staging-Format: { "eintraege": [ { "kapitelId": "...", "aufgabe": { RechnenAufgabeFest } } ] }
// Aufruf: node content-pipeline/merge-rechnen.mjs
import fs from 'node:fs'

const staging = 'content-pipeline/staging/rechnen-aufgaben.json'
const ziel = 'public/data/rechnen.json'

const s = JSON.parse(fs.readFileSync(staging, 'utf8'))
const daten = JSON.parse(fs.readFileSync(ziel, 'utf8'))
let n = 0
for (const e of s.eintraege) {
  const kapitel = daten.kapitel.find((k) => k.id === e.kapitelId)
  if (!kapitel) {
    console.error(`Unbekanntes Kapitel: ${e.kapitelId} (${e.aufgabe.id}) — übersprungen`)
    continue
  }
  const idx = kapitel.aufgaben.findIndex((a) => a.id === e.aufgabe.id)
  if (idx >= 0) kapitel.aufgaben[idx] = e.aufgabe
  else kapitel.aufgaben.push(e.aufgabe)
  n++
}
fs.writeFileSync(ziel, JSON.stringify(daten, null, 2) + '\n')
console.log(`Fertig: ${n} Rechnen-Aufgaben eingepflegt.`)
