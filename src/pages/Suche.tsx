import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import { ladeAufgaben, ladeThemen } from '../lib/data'
import type { Aufgabe, BereichId, Thema } from '../types'

const BEREICHE: BereichId[] = ['wiso', 'kbz', 'buchfuehrung', 'muendlich']

export default function Suche() {
  const [begriff, setBegriff] = useState('')
  const [themen, setThemen] = useState<Thema[]>([])
  const [aufgaben, setAufgaben] = useState<Aufgabe[]>([])

  useEffect(() => {
    // Fehlende Dateien einzelner Bereiche sind ok — einfach überspringen.
    Promise.all(BEREICHE.map((b) => ladeThemen(b).catch(() => []))).then((t) =>
      setThemen(t.flat()),
    )
    Promise.all(BEREICHE.map((b) => ladeAufgaben(b).catch(() => []))).then((a) =>
      setAufgaben(a.flat()),
    )
  }, [])

  const suchwort = begriff.trim().toLowerCase()
  const themenTreffer = useMemo(
    () =>
      suchwort.length < 2
        ? []
        : themen.filter(
            (t) =>
              t.name.toLowerCase().includes(suchwort) ||
              t.beschreibung.toLowerCase().includes(suchwort),
          ),
    [themen, suchwort],
  )
  const aufgabenTreffer = useMemo(
    () => (suchwort.length < 2 ? [] : aufgaben.filter((a) => a.text.toLowerCase().includes(suchwort))),
    [aufgaben, suchwort],
  )

  return (
    <Layout titel="Suche">
      <input
        type="search"
        value={begriff}
        onChange={(e) => setBegriff(e.target.value)}
        placeholder="Thema oder Aufgabe suchen …"
        autoFocus
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base shadow-sm focus:border-sky-500 focus:outline-none"
      />

      {suchwort.length >= 2 && (
        <div className="mt-5 space-y-6">
          <div>
            <h2 className="mb-2 text-sm font-bold text-slate-500">
              Themen ({themenTreffer.length})
            </h2>
            <div className="space-y-2">
              {themenTreffer.map((t) => (
                <Link
                  key={t.id}
                  to={`/${t.bereich}/stufe1`}
                  className="block rounded-xl border border-slate-200 bg-white p-3 shadow-sm hover:border-sky-400"
                >
                  <p className="font-semibold text-slate-900">{t.name}</p>
                  <p className="text-sm text-slate-500">{t.beschreibung}</p>
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h2 className="mb-2 text-sm font-bold text-slate-500">
              Aufgaben ({aufgabenTreffer.length})
            </h2>
            <div className="space-y-2">
              {aufgabenTreffer.slice(0, 30).map((a) => (
                <Link
                  key={a.id}
                  to={a.bereich === 'muendlich' ? '/muendlich' : `/${a.bereich}/stufe2`}
                  className="block rounded-xl border border-slate-200 bg-white p-3 shadow-sm hover:border-sky-400"
                >
                  <p className="line-clamp-2 text-sm text-slate-700">{a.text}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
