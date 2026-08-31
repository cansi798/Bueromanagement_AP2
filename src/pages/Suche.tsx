import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import { ladeAufgaben, ladeGlossar, ladeThemen } from '../lib/data'
import type { Aufgabe, BereichId, GlossarEintrag, Thema } from '../types'

const BEREICHE: BereichId[] = ['wiso', 'kbz', 'buchfuehrung', 'muendlich']

export default function Suche() {
  const [begriff, setBegriff] = useState('')
  const [themen, setThemen] = useState<Thema[]>([])
  const [aufgaben, setAufgaben] = useState<Aufgabe[]>([])
  const [glossar, setGlossar] = useState<GlossarEintrag[]>([])

  useEffect(() => {
    // Fehlende Dateien einzelner Bereiche sind ok — einfach überspringen.
    Promise.all(BEREICHE.map((b) => ladeThemen(b).catch(() => []))).then((t) =>
      setThemen(t.flat()),
    )
    Promise.all(BEREICHE.map((b) => ladeAufgaben(b).catch(() => []))).then((a) =>
      setAufgaben(a.flat()),
    )
    ladeGlossar().then(setGlossar).catch(() => {})
  }, [])

  const suchwort = begriff.trim().toLowerCase()
  const themenTreffer = useMemo(
    () =>
      suchwort.length < 2
        ? []
        : themen.filter(
            (t) =>
              t.name.toLowerCase().includes(suchwort) ||
              t.beschreibung.toLowerCase().includes(suchwort) ||
              t.lernzettel.toLowerCase().includes(suchwort),
          ),
    [themen, suchwort],
  )
  const glossarTreffer = useMemo(
    () =>
      suchwort.length < 2
        ? []
        : glossar.filter(
            (g) =>
              g.begriff.toLowerCase().includes(suchwort) ||
              g.definition.toLowerCase().includes(suchwort),
          ),
    [glossar, suchwort],
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
          {glossarTreffer.length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-bold text-slate-500">
                Glossar ({glossarTreffer.length})
              </h2>
              <div className="space-y-2">
                {glossarTreffer.slice(0, 6).map((g) => (
                  <div key={g.begriff} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                    <p className="font-semibold text-slate-900">{g.begriff}</p>
                    <p className="text-sm text-slate-600">{g.definition}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
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
