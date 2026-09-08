// Fortschritt der Rechnen-Kachel: kbm.v1.* wird vom Server-Sync automatisch
// mitgenommen — hier nur lokale Zähler je Kapitel.
import { getItem, setItem } from './storage'

const KEY = 'kbm.v1.rechnen'

export interface KapitelStand {
  richtig: number
  falsch: number
  geloest: string[] // IDs fester Aufgaben, die mindestens einmal richtig waren
}

export interface RechnenStand {
  kapitel: Record<string, KapitelStand>
}

export function ladeRechnenStand(): RechnenStand {
  return getItem<RechnenStand>(KEY) ?? { kapitel: {} }
}

function schreibe(kapitelId: string, aendern: (k: KapitelStand) => void): void {
  const stand = ladeRechnenStand()
  const kapitel = stand.kapitel[kapitelId] ?? { richtig: 0, falsch: 0, geloest: [] }
  aendern(kapitel)
  setItem(KEY, { ...stand, kapitel: { ...stand.kapitel, [kapitelId]: kapitel } })
}

export function merkeRechnenUebung(kapitelId: string, richtig: boolean): void {
  schreibe(kapitelId, (k) => {
    if (richtig) k.richtig++
    else k.falsch++
  })
}

export function merkeRechnenAufgabe(kapitelId: string, aufgabeId: string, richtig: boolean): void {
  schreibe(kapitelId, (k) => {
    if (richtig) {
      k.richtig++
      if (!k.geloest.includes(aufgabeId)) k.geloest.push(aufgabeId)
    } else {
      k.falsch++
    }
  })
}
