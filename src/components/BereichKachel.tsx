import { Link } from 'react-router-dom'
import type { Bereich } from '../types'
import { farbe } from '../lib/farben'

export default function BereichKachel({
  bereich,
  fortschritt = 0,
}: {
  bereich: Bereich
  fortschritt?: number // 0..1
}) {
  const f = farbe(bereich.farbe)
  const prozent = Math.round(fortschritt * 100)

  return (
    <Link
      to={`/${bereich.id}`}
      className={`block rounded-2xl border-2 p-5 shadow-sm transition ${f.kachel}`}
    >
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-bold text-slate-900">{bereich.name}</h2>
        <span className={`text-xs font-semibold ${f.akzentText}`}>{bereich.kurz}</span>
      </div>
      <p className="mt-1 text-sm text-slate-600">{bereich.beschreibung}</p>
      <div className="mt-4">
        <div className="h-2 overflow-hidden rounded-full bg-white">
          <div className={`h-full rounded-full ${f.balken}`} style={{ width: `${prozent}%` }} />
        </div>
        <p className="mt-1 text-xs text-slate-500">{prozent} % geübt</p>
      </div>
    </Link>
  )
}
