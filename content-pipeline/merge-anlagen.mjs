// Merged Anlagen-Patches (content-pipeline/staging/anlagen-*.json) in die
// bestehenden Aufgaben unter public/data/aufgaben/. Parallel-sicher wie
// merge-staging.mjs: Agenten schreiben nur Staging, das Merge passiert hier.
// Aufruf: node content-pipeline/merge-anlagen.mjs
import fs from 'node:fs'
import path from 'node:path'

const stagingDir = 'content-pipeline/staging'
const dataDir = 'public/data'

const dateien = fs
  .readdirSync(stagingDir)
  .filter((f) => f.startsWith('anlagen-') && f.endsWith('.json'))
  .sort()

if (dateien.length === 0) {
  console.log('Keine Anlagen-Staging-Dateien gefunden.')
  process.exit(0)
}

let gesamt = 0
for (const f of dateien) {
  const s = JSON.parse(fs.readFileSync(path.join(stagingDir, f), 'utf8'))
  const { bereich, eintraege } = s
  if (!bereich || !Array.isArray(eintraege)) {
    console.error(`${f}: bereich/eintraege fehlt — übersprungen`)
    continue
  }
  const pfad = `${dataDir}/aufgaben/${bereich}.json`
  const aufgaben = JSON.parse(fs.readFileSync(pfad, 'utf8'))
  const nachId = new Map(aufgaben.map((a) => [a.id, a]))
  let angewendet = 0
  for (const e of eintraege) {
    const a = nachId.get(e.id)
    if (!a) {
      console.error(`${f}: Aufgabe ${e.id} nicht gefunden — übersprungen`)
      continue
    }
    if (e.anlagenText) a.anlagenText = e.anlagenText
    if (e.anlagenDiagramm) a.anlagenDiagramm = e.anlagenDiagramm
    angewendet++
  }
  fs.writeFileSync(pfad, JSON.stringify(aufgaben, null, 2) + '\n')
  console.log(`${f}: ${angewendet}/${eintraege.length} Patches → aufgaben/${bereich}.json`)
  gesamt += angewendet
}
console.log(`Fertig: ${gesamt} Anlagen-Patches angewendet.`)
