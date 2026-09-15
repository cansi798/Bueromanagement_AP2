import { useEffect } from 'react'

interface MitKlassen {
  classList: { contains(c: string): boolean; add(c: string): void; remove(c: string): void }
}

// Druck- und Beamer-Routen rendern bewusst immer hell: dark:-Varianten der
// Kind-Komponenten würden auf weißen Karten/Seiten unleserlich.
export function hellErzwingen(el: MitKlassen): () => void {
  const hatteDark = el.classList.contains('dark')
  el.classList.remove('dark')
  return () => {
    if (hatteDark) el.classList.add('dark')
  }
}

export function useHellmodus(): void {
  useEffect(() => hellErzwingen(document.documentElement), [])
}
