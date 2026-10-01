// Spielt freigegebene Audit-Befunde als Feld-Patches ein.
// Staging: content-pipeline/staging/audit-*.json = { patches: Patch[] }
// (Format siehe audit-patch.mjs). Dateien mit Fehlern werden nicht geschrieben;
// erfolgreich verarbeitete Staging-Dateien werden zu *.json.done umbenannt.
// Aufruf: node content-pipeline/merge-audit.mjs
import fs from 'node:fs'
import path from 'node:path'
import { wendePatchesAn } from './audit-patch.mjs'

const stagingDir = 'content-pipeline/staging'
const dataDir = 'public/data'

const dateien = fs
  .readdirSync(stagingDir)
  .filter((f) => f.startsWith('audit-') && f.endsWith('.json'))
  .sort()
if (dateien.length === 0) {
  console.log('Keine Audit-Staging-Dateien gefunden.')
  process.exit(0)
}

let fehlerGesamt = 0
for (const f of dateien) {
  const { patches } = JSON.parse(fs.readFileSync(path.join(stagingDir, f), 'utf8'))
  const proDatei = new Map()
  for (const p of patches) proDatei.set(p.datei, [...(proDatei.get(p.datei) ?? []), p])
  let ok = true
  const schreiben = []
  for (const [datei, ps] of proDatei) {
    const pfad = `${dataDir}/${datei}.json`
    const liste = JSON.parse(fs.readFileSync(pfad, 'utf8'))
    const r = wendePatchesAn(liste, ps)
    r.fehler.forEach((e) => console.error(`${f}: ${e}`))
    if (r.fehler.length) ok = false
    else schreiben.push([pfad, liste, r.geaendert])
  }
  if (!ok) {
    fehlerGesamt++
    console.error(`${f}: NICHT eingespielt (Fehler oben)`)
    continue
  }
  for (const [pfad, liste, n] of schreiben) {
    fs.writeFileSync(pfad, JSON.stringify(liste, null, 2) + '\n')
    console.log(`${f}: ${n} Patches in ${pfad}`)
  }
  fs.renameSync(path.join(stagingDir, f), path.join(stagingDir, f + '.done'))
}
process.exit(fehlerGesamt ? 1 : 0)
