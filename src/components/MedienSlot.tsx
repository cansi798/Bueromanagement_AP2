import { Link } from 'react-router-dom'
import type { BereichId, Medien } from '../types'

function Slot({
  icon,
  titel,
  url,
  status,
}: {
  icon: string
  titel: string
  url?: string
  status: 'geplant' | 'vorhanden'
}) {
  if (status === 'vorhanden' && url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-sky-700 hover:border-sky-400"
      >
        <span>{icon}</span>
        {titel}
        <span className="ml-auto text-xs text-slate-400">öffnen ↗</span>
      </a>
    )
  }
  return (
    <div className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-400">
      <span className="grayscale">{icon}</span>
      {titel}
      <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs">folgt</span>
    </div>
  )
}

export default function MedienSlot({
  medien,
  bereichId,
  themaId,
}: {
  medien?: Medien
  bereichId?: BereichId
  themaId?: string
}) {
  const hatMedien = Boolean(medien?.video || medien?.podcast)
  const hatHandout = Boolean(bereichId && themaId)
  if (!hatMedien && !hatHandout) return null

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Lernmedien zum Thema
      </p>
      {medien?.video && <Slot icon="🎬" {...medien.video} />}
      {medien?.podcast && <Slot icon="🎧" {...medien.podcast} />}
      {hatHandout && (
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium">
          <span>📄</span>
          <Link to={`/handout/${bereichId}/${themaId}`} className="text-sky-700 hover:underline">
            Handout ansehen
          </Link>
          <a
            href={`./downloads/handouts/${themaId}.pdf`}
            download
            className="ml-auto rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-800 hover:bg-sky-200"
          >
            ⬇️ PDF
          </a>
        </div>
      )}
    </div>
  )
}
