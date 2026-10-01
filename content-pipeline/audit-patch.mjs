// Feld-Patches für Content-JSONs (KBZ-Audit 2026-10-01).
// Jeder Patch nennt den erwarteten Altwert; weicht der Ist-Wert ab, wird
// nichts geändert und ein Fehler gemeldet (Schutz gegen veraltete Befunde).
const gleich = (a, b) => JSON.stringify(a) === JSON.stringify(b)

export function wendePatchesAn(liste, patches) {
  const fehler = []
  for (const p of patches) {
    const e = liste.find((x) => x.id === p.id)
    if (!e) fehler.push(`${p.datei}: id ${p.id} nicht gefunden`)
    else if (!gleich(e[p.feld], p.alt))
      fehler.push(`${p.datei}: ${p.id}.${p.feld} hat nicht den erwarteten Altwert`)
  }
  if (fehler.length) return { geaendert: 0, fehler }
  for (const p of patches) {
    const e = liste.find((x) => x.id === p.id)
    if (p.neu === null) delete e[p.feld]
    else e[p.feld] = p.neu
  }
  return { geaendert: patches.length, fehler }
}
