// Multiple-Choice-Wertung: gewählt muss exakt der korrekten Menge entsprechen.
export function wertungMC(korrekt: number[], gewaehlt: number[]): boolean {
  if (korrekt.length !== gewaehlt.length) return false
  const soll = new Set(korrekt)
  return gewaehlt.every((g) => soll.has(g))
}
