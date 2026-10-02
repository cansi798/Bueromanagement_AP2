// Multiple-Choice-Wertung: gewählt muss exakt der korrekten Menge entsprechen.
export function wertungMC(korrekt: number[], gewaehlt: number[]): boolean {
  if (korrekt.length !== gewaehlt.length) return false
  const soll = new Set(korrekt)
  return gewaehlt.every((g) => soll.has(g))
}

// Begründung, die nach einer MC-Antwort angezeigt wird. Je nach Extraktion steht
// sie in `erklaerung` oder (bei vielen Originalaufgaben) nur in `loesung`.
export function begruendungMC(a: { erklaerung?: string; loesung?: string }): string | undefined {
  return a.erklaerung?.trim() ? a.erklaerung : a.loesung?.trim() ? a.loesung : undefined
}
