import type { AufgabenQuelle } from '../types'
import { terminAnzeige } from '../lib/termine'

// Anzeige bewusst ohne echte Prüfungstermine (siehe lib/termine.ts).
const STIL: Record<AufgabenQuelle, string> = {
  original: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
  abgeleitet: 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300',
  generiert: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
}

export default function QuelleBadge({
  quelle,
  termin,
}: {
  quelle: AufgabenQuelle
  termin?: string
}) {
  const label =
    quelle === 'original'
      ? terminAnzeige(termin)
      : quelle === 'abgeleitet'
        ? 'Variante'
        : 'Training'
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STIL[quelle]}`}>
      {label}
    </span>
  )
}
