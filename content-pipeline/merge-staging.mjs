// Merged Staging-Extraktionen (content-pipeline/staging/*.json) in public/data/.
// Parallel-sicher: Agenten schreiben nur Staging-Dateien, das Merge passiert
// zentral und einzeln hier. Aufruf: node content-pipeline/merge-staging.mjs
import fs from 'node:fs'
import path from 'node:path'

const stagingDir = 'content-pipeline/staging'
const dataDir = 'public/data'

const dateien = fs
  .readdirSync(stagingDir)
  .filter((f) => f.endsWith('.json'))
  .sort()

if (dateien.length === 0) {
  console.log('Keine Staging-Dateien gefunden.')
  process.exit(0)
}

for (const f of dateien) {
  const pfad = path.join(stagingDir, f)
  const s = JSON.parse(fs.readFileSync(pfad, 'utf8'))
  const { bereich, termin } = s
  if (!bereich || !termin) {
    console.error(`${f}: bereich/termin fehlt — übersprungen`)
    continue
  }

  // Aufgaben anhängen (ID-Dubletten überspringen)
  const aufgabenPfad = `${dataDir}/aufgaben/${bereich}.json`
  const aufgaben = JSON.parse(fs.readFileSync(aufgabenPfad, 'utf8'))
  const ids = new Set(aufgaben.map((a) => a.id))
  let neu = 0
  let dubletten = 0
  for (const a of s.aufgaben ?? []) {
    if (ids.has(a.id)) {
      dubletten++
      continue
    }
    aufgaben.push(a)
    ids.add(a.id)
    neu++
  }
  fs.writeFileSync(aufgabenPfad, JSON.stringify(aufgaben, null, 2))

  // Themen: neue anlegen, Häufigkeit ergänzen
  const themenPfad = `${dataDir}/themen/${bereich}.json`
  const themen = JSON.parse(fs.readFileSync(themenPfad, 'utf8'))
  for (const t of s.neueThemen ?? []) {
    if (!themen.find((x) => x.id === t.id)) themen.push(t)
  }
  for (const u of s.themenUpdates ?? []) {
    const t = themen.find((x) => x.id === u.id)
    if (t && !t.haeufigkeit.includes(u.termin)) t.haeufigkeit.push(u.termin)
  }
  fs.writeFileSync(themenPfad, JSON.stringify(themen, null, 2))

  // Prüfungseintrag
  if (s.pruefung) {
    const idxPfad = `${dataDir}/pruefungen/index.json`
    const idx = JSON.parse(fs.readFileSync(idxPfad, 'utf8'))
    if (!idx.find((p) => p.termin === s.pruefung.termin && p.bereich === s.pruefung.bereich)) {
      idx.push(s.pruefung)
    }
    fs.writeFileSync(idxPfad, JSON.stringify(idx, null, 2))
  }

  console.log(
    `${f}: +${neu} Aufgaben (${dubletten} Dubletten übersprungen), ` +
      `${(s.neueThemen ?? []).length} neue Themen, ` +
      `${(s.themenUpdates ?? []).length} Häufigkeits-Updates` +
      (s.pruefung ? ', 1 Prüfungseintrag' : ''),
  )
  if (s.audit?.auffaelligkeiten?.length) {
    for (const h of s.audit.auffaelligkeiten) console.log(`   ⚠ ${h}`)
  }
  fs.renameSync(pfad, pfad + '.done')
}
console.log('Merge fertig. Jetzt: npm test')
