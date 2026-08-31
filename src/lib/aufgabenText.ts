// Darstellung von Prüfungsaufgaben: Original-Nummer aus dem Text ziehen
// (verhindert doppelte Nummerierung „Aufgabe 3" + „Aufgabe 1.2" im Text).

export function zerlegeAufgabenText(text: string): { nr: string | null; text: string } {
  const fett = text.match(/^\*\*Aufgabe\s+([\d.]+[a-z]?)\*\*\s*[—–:-]?\s*/)
  if (fett) return { nr: fett[1].replace(/\.$/, ''), text: text.slice(fett[0].length) }
  const schlicht = text.match(/^Aufgabe\s+([\d.]+[a-z]?)\s*[—–:-]\s*/)
  if (schlicht) return { nr: schlicht[1].replace(/\.$/, ''), text: text.slice(schlicht[0].length) }
  return { nr: null, text }
}

// Erkennt Zuordnungs-Optionen wie "a) 2, b) 1, c) 3, d) 1" für die Chip-Darstellung.
export function zerlegeZuordnungsOption(option: string): string[] | null {
  const teile = option.split(/,\s*/)
  if (teile.length < 2) return null
  if (!teile.every((t) => /^[a-h]\)\s*\S/.test(t.trim()))) return null
  return teile.map((t) => t.trim())
}
