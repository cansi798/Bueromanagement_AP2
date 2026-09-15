// Tailwind erkennt nur statisch auffindbare Klassennamen — deshalb eine
// explizite Zuordnung statt dynamischer Template-Strings wie `bg-${farbe}-600`.
// Jede helle Kachel-/Chip-/Akzentklasse braucht eine dark:-Variante — tests/farben.test.ts erzwingt das.
export interface FarbSet {
  kachel: string
  balken: string
  akzentText: string
  chip: string
  button: string
}

export const FARBEN: Record<string, FarbSet> = {
  sky: {
    kachel:
      'border-sky-200 bg-sky-50 hover:border-sky-400 dark:border-sky-800 dark:bg-sky-950/50 dark:hover:border-sky-500',
    balken: 'bg-sky-500',
    akzentText: 'text-sky-700 dark:text-sky-300',
    chip: 'bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-200',
    button: 'bg-sky-600 hover:bg-sky-700 active:bg-sky-800',
  },
  emerald: {
    kachel:
      'border-emerald-200 bg-emerald-50 hover:border-emerald-400 dark:border-emerald-800 dark:bg-emerald-950/50 dark:hover:border-emerald-500',
    balken: 'bg-emerald-500',
    akzentText: 'text-emerald-700 dark:text-emerald-300',
    chip: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200',
    button: 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800',
  },
  amber: {
    kachel:
      'border-amber-200 bg-amber-50 hover:border-amber-400 dark:border-amber-800 dark:bg-amber-950/50 dark:hover:border-amber-500',
    balken: 'bg-amber-500',
    akzentText: 'text-amber-700 dark:text-amber-300',
    chip: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200',
    button: 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800',
  },
  violet: {
    kachel:
      'border-violet-200 bg-violet-50 hover:border-violet-400 dark:border-violet-800 dark:bg-violet-950/50 dark:hover:border-violet-500',
    balken: 'bg-violet-500',
    akzentText: 'text-violet-700 dark:text-violet-300',
    chip: 'bg-violet-100 text-violet-800 dark:bg-violet-900/60 dark:text-violet-200',
    button: 'bg-violet-600 hover:bg-violet-700 active:bg-violet-800',
  },
  rose: {
    kachel:
      'border-rose-200 bg-rose-50 hover:border-rose-400 dark:border-rose-800 dark:bg-rose-950/50 dark:hover:border-rose-500',
    balken: 'bg-rose-500',
    akzentText: 'text-rose-700 dark:text-rose-300',
    chip: 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200',
    button: 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800',
  },
}

export const farbe = (name: string): FarbSet => FARBEN[name] ?? FARBEN.sky
