import type { AufgabenQuelle } from '../types'
import { terminAnzeige } from '../lib/termine'

// Anzeige bewusst ohne echte Prüfungstermine (siehe lib/termine.ts).
const STIL: Record<AufgabenQuelle, string> = {
  original: 'bg-blue-100 text-blue-800',
  abgeleitet: 'bg-teal-100 text-teal-800',
  generiert: 'bg-slate-200 text-slate-700',
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
