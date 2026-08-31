import type { AufgabenQuelle } from '../types'

const TERMIN_LABEL = (termin: string) => {
  const [jahr, saison] = termin.split('-')
  return `${saison === 'sommer' ? 'Sommer' : 'Winter'} ${jahr}`
}

const STIL: Record<AufgabenQuelle, { label: string; klasse: string }> = {
  original: { label: 'Original', klasse: 'bg-blue-100 text-blue-800' },
  abgeleitet: { label: 'Abgeleitet', klasse: 'bg-teal-100 text-teal-800' },
  generiert: { label: 'Übung', klasse: 'bg-slate-200 text-slate-700' },
}

export default function QuelleBadge({
  quelle,
  termin,
}: {
  quelle: AufgabenQuelle
  termin?: string
}) {
  const s = STIL[quelle]
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${s.klasse}`}>
      {s.label}
      {quelle === 'original' && termin ? ` · ${TERMIN_LABEL(termin)}` : ''}
    </span>
  )
}
