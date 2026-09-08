// Deutsches Zahlenformat für die Rechnen-Kachel: Eingaben wie auf dem
// Prüfungsbogen ("1.234,56"), tolerant gegenüber Einheiten und Rohformat.

export function parseDeutscheZahl(eingabe: string): number | null {
  if (eingabe.trim() === '') return null
  let t = eingabe.trim().replace(/[€%]|stück|kwh/gi, '').trim()
  if (t === '') return null
  const negativ = t.startsWith('-')
  if (negativ) t = t.slice(1)
  if (!/^[\d.,]+$/.test(t)) return null
  const punkte = (t.match(/\./g) ?? []).length
  const kommas = (t.match(/,/g) ?? []).length
  if (kommas > 1 || (punkte > 1 && kommas === 0 && !/^\d{1,3}(\.\d{3})+$/.test(t))) return null
  let normalisiert: string
  if (kommas === 1) {
    normalisiert = t.replace(/\./g, '').replace(',', '.') // 1.234,56 / 1234,56
  } else if (punkte === 1 && /\.\d{1,2}$/.test(t)) {
    normalisiert = t // Fallback: 1234.56
  } else {
    normalisiert = t.replace(/\./g, '') // reine Tausenderpunkte
  }
  const wert = Number(normalisiert)
  if (!Number.isFinite(wert)) return null
  return negativ ? -wert : wert
}

export function formatiereZahl(wert: number, nachkomma = 2): string {
  return wert.toLocaleString('de-DE', {
    minimumFractionDigits: nachkomma,
    maximumFractionDigits: nachkomma,
  })
}

export type EingabeWertung = 'leer' | 'ungueltig' | 'richtig' | 'knapp' | 'falsch'

export function bewerteEingabe(
  eingabe: string,
  loesungswert: number,
  toleranz: number,
): EingabeWertung {
  if (eingabe.trim() === '') return 'leer'
  const wert = parseDeutscheZahl(eingabe)
  if (wert === null) return 'ungueltig'
  const abstand = Math.abs(wert - loesungswert)
  const epsilon = 1e-10
  if (abstand <= toleranz + epsilon) return 'richtig'
  // "Knapp daneben": typischer Rundungsfehler in der letzten Stelle.
  const knappGrenze = toleranz > 0 ? toleranz * 10 : Math.abs(loesungswert) * 0.01
  if (abstand <= knappGrenze + epsilon) return 'knapp'
  return 'falsch'
}
