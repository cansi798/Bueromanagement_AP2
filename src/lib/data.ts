import { useEffect, useState } from 'react'
import type {
  Aufgabe,
  Bereich,
  BereichId,
  GlossarEintrag,
  Karteikarte,
  Lernpaar,
  Pruefung,
  Thema,
} from '../types'

// Module-Level-Cache: jede Datei wird pro Sitzung nur einmal geladen.
const cache = new Map<string, Promise<unknown>>()

function lade<T>(pfad: string): Promise<T> {
  if (!cache.has(pfad)) {
    cache.set(
      pfad,
      fetch(`./data/${pfad}`).then((res) => {
        if (!res.ok) throw new Error(`Laden fehlgeschlagen: ${pfad} (${res.status})`)
        return res.json()
      }),
    )
  }
  return cache.get(pfad) as Promise<T>
}

export const ladeBereiche = () => lade<Bereich[]>('bereiche.json')
export const ladeThemen = (b: BereichId) => lade<Thema[]>(`themen/${b}.json`)
export const ladeAufgaben = (b: BereichId) => lade<Aufgabe[]>(`aufgaben/${b}.json`)
export const ladePruefungen = () => lade<Pruefung[]>('pruefungen/index.json')
export const ladeKarteikarten = (b: BereichId) => lade<Karteikarte[]>(`karteikarten/${b}.json`)
export const ladeLernpaare = (b: BereichId) => lade<Lernpaar[]>(`lernpaare/${b}.json`)
export const ladeGlossar = () => lade<GlossarEintrag[]>('glossar.json')

export function useDaten<T>(loader: () => Promise<T>): {
  daten: T | null
  fehler: string | null
  laedt: boolean
} {
  const [daten, setDaten] = useState<T | null>(null)
  const [fehler, setFehler] = useState<string | null>(null)

  useEffect(() => {
    let aktiv = true
    loader()
      .then((d) => aktiv && setDaten(d))
      .catch(() => aktiv && setFehler('Inhalte konnten nicht geladen werden.'))
    return () => {
      aktiv = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { daten, fehler, laedt: daten === null && fehler === null }
}
