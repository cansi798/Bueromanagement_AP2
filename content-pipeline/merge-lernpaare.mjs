// Merged Lernpaar-Staging-Dateien (content-pipeline/staging/lernpaare-*.json)
// in public/data/lernpaare/<bereich>.json. ID-Dubletten werden übersprungen.
// Aufruf: node content-pipeline/merge-lernpaare.mjs
import fs from 'node:fs'
import path from 'node:path'

const stagingDir = 'content-pipeline/staging'
const zielDir = 'public/data/lernpaare'

const dateien = fs
  .readdirSync(stagingDir)
  .filter((f) => f.startsWith('lernpaare-') && f.endsWith('.json'))
  .sort()

if (dateien.length === 0) {
  console.log('Keine Lernpaar-Staging-Dateien gefunden.')
  process.exit(0)
}

const proBereich = new Map()
for (const f of dateien) {
  const liste = JSON.parse(fs.readFileSync(path.join(stagingDir, f), 'utf8'))
  if (!Array.isArray(liste)) {
    console.error(`${f}: kein Array — übersprungen`)
    continue
  }
  for (const p of liste) {
    if (!proBereich.has(p.bereich)) proBereich.set(p.bereich, [])
    proBereich.get(p.bereich).push(p)
  }
  console.log(`${f}: ${liste.length} Lernpaare eingelesen`)
}

for (const [bereich, paare] of proBereich) {
  const pfad = path.join(zielDir, `${bereich}.json`)
  const bestehend = fs.existsSync(pfad) ? JSON.parse(fs.readFileSync(pfad, 'utf8')) : []
  const ids = new Set(bestehend.map((p) => p.id))
  let neu = 0
  for (const p of paare) {
    if (ids.has(p.id)) {
      console.error(`Dublette übersprungen: ${p.id}`)
      continue
    }
    ids.add(p.id)
    bestehend.push(p)
    neu++
  }
  fs.writeFileSync(pfad, JSON.stringify(bestehend, null, 2) + '\n')
  console.log(`lernpaare/${bereich}.json: +${neu} → ${bestehend.length} gesamt`)
}
