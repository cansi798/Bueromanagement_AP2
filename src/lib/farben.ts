// Tailwind erkennt nur statisch auffindbare Klassennamen — deshalb eine
// explizite Zuordnung statt dynamischer Template-Strings wie `bg-${farbe}-600`.
export interface FarbSet {
  kachel: string
  balken: string
  akzentText: string
  chip: string
  button: string
}

export const FARBEN: Record<string, FarbSet> = {
  sky: {
    kachel: 'border-sky-200 bg-sky-50 hover:border-sky-400',
    balken: 'bg-sky-500',
    akzentText: 'text-sky-700',
    chip: 'bg-sky-100 text-sky-800',
    button: 'bg-sky-600 hover:bg-sky-700 active:bg-sky-800',
  },
  emerald: {
    kachel: 'border-emerald-200 bg-emerald-50 hover:border-emerald-400',
    balken: 'bg-emerald-500',
    akzentText: 'text-emerald-700',
    chip: 'bg-emerald-100 text-emerald-800',
    button: 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800',
  },
  amber: {
    kachel: 'border-amber-200 bg-amber-50 hover:border-amber-400',
    balken: 'bg-amber-500',
    akzentText: 'text-amber-700',
    chip: 'bg-amber-100 text-amber-800',
    button: 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800',
  },
  violet: {
    kachel: 'border-violet-200 bg-violet-50 hover:border-violet-400',
    balken: 'bg-violet-500',
    akzentText: 'text-violet-700',
    chip: 'bg-violet-100 text-violet-800',
    button: 'bg-violet-600 hover:bg-violet-700 active:bg-violet-800',
  },
}

export const farbe = (name: string): FarbSet => FARBEN[name] ?? FARBEN.sky
