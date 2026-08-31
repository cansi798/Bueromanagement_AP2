// IHK-Notenschlüssel (100-Punkte-Schlüssel):
// 100–92 sehr gut · 91–81 gut · 80–67 befriedigend · 66–50 ausreichend ·
// 49–30 mangelhaft · 29–0 ungenügend

export interface IhkNote {
  note: 1 | 2 | 3 | 4 | 5 | 6
  wort: string
}

export function ihkNote(prozent: number): IhkNote {
  const p = Math.round(prozent)
  if (p >= 92) return { note: 1, wort: 'sehr gut' }
  if (p >= 81) return { note: 2, wort: 'gut' }
  if (p >= 67) return { note: 3, wort: 'befriedigend' }
  if (p >= 50) return { note: 4, wort: 'ausreichend' }
  if (p >= 30) return { note: 5, wort: 'mangelhaft' }
  return { note: 6, wort: 'ungenügend' }
}
