import { Link, useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import { ladeBereiche, ladeThemen, useDaten } from '../lib/data'
import { farbe } from '../lib/farben'
import type { BereichId } from '../types'

// Sessionübersicht für den Unterricht: jedes Thema ist eine geführte Session.
export default function Unterricht() {
  const { bereichId } = useParams<{ bereichId: BereichId }>()
  const { daten: bereiche } = useDaten(ladeBereiche)
  const { daten: themen, fehler, laedt } = useDaten(() => ladeThemen(bereichId!))
  const bereich = bereiche?.find((b) => b.id === bereichId)
  const f = farbe(bereich?.farbe ?? 'sky')

  return (
    <Layout titel={`Unterricht · ${bereich?.name ?? ''}`}>
      <p className="-mt-2 mb-5 text-slate-600">
        Geführte Sessions für die Unterrichtsstunde: Einstieg → Stoff → Selbstcheck → Üben.
        Jede Session hat auch eine Präsentation für den Beamer.
      </p>

      <div className="mb-5 flex flex-wrap gap-2">
        <Link
          to={`/praesentation/${bereichId}`}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
        >
          🖥️ Komplette Präsentation
        </Link>
        <Link
          to={`/skript/${bereichId}`}
          className="rounded-lg border-2 border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-500"
        >
          📄 Lernskript (Druck/PDF)
        </Link>
      </div>

      {laedt && <p className="text-slate-500">Lade …</p>}
      {fehler && <p className="rounded-lg bg-red-50 p-4 text-red-700">{fehler}</p>}

      <div className="space-y-3">
        {themen?.map((t, i) => (
          <div key={t.id} className={`rounded-2xl border-2 p-4 shadow-sm ${f.kachel}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className={`text-xs font-bold uppercase tracking-wide ${f.akzentText}`}>
                  Session {i + 1}
                </p>
                <h2 className="font-bold text-slate-900">{t.name}</h2>
                <p className="text-sm text-slate-600">{t.beschreibung}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Link
                  to={`/praesentation/${bereichId}/${t.id}`}
                  className="rounded-lg border-2 border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-slate-500"
                >
                  🖥️
                </Link>
                <Link
                  to={`/unterricht/${bereichId}/${t.id}`}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${f.button}`}
                >
                  Session starten →
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  )
}
