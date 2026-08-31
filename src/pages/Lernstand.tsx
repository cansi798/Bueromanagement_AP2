import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import { ladeAufgaben, ladeThemen, ladeBereiche } from '../lib/data'
import { ladeFortschritt } from '../lib/progress'
import { ihkNote } from '../lib/noten'
import { terminAnzeige } from '../lib/termine'
import { zerlegeAufgabenText } from '../lib/aufgabenText'
import type { Aufgabe, Bereich, BereichId, Thema } from '../types'

const BEREICHE: BereichId[] = ['wiso', 'kbz', 'buchfuehrung', 'muendlich']

// „So lernst du": Streak, Problem-Aufgaben, Simulations-Historie, schwache Themen.
export default function Lernstand() {
  const f = ladeFortschritt()
  const [aufgaben, setAufgaben] = useState<Aufgabe[]>([])
  const [themen, setThemen] = useState<Thema[]>([])
  const [bereiche, setBereiche] = useState<Bereich[]>([])

  useEffect(() => {
    Promise.all(BEREICHE.map((b) => ladeAufgaben(b).catch(() => []))).then((a) =>
      setAufgaben(a.flat()),
    )
    Promise.all(BEREICHE.map((b) => ladeThemen(b).catch(() => []))).then((t) =>
      setThemen(t.flat()),
    )
    ladeBereiche().then(setBereiche).catch(() => {})
  }, [])

  const statistik = Object.entries(f.aufgabenStatistik)
  const beantwortet = statistik.reduce((s, [, v]) => s + v.richtig + v.falsch, 0)
  const richtig = statistik.reduce((s, [, v]) => s + v.richtig, 0)
  const quote = beantwortet > 0 ? Math.round((richtig / beantwortet) * 100) : null

  const problemAufgaben = statistik
    .filter(([, v]) => v.falsch >= 1)
    .sort((a, b) => b[1].falsch - a[1].falsch || a[1].richtig - b[1].richtig)
    .slice(0, 8)
    .map(([id, v]) => ({ aufgabe: aufgaben.find((a) => a.id === id), v }))
    .filter((x): x is { aufgabe: Aufgabe; v: { richtig: number; falsch: number } } =>
      Boolean(x.aufgabe),
    )

  const schwacheThemen = Object.entries(f.quizErgebnisse)
    .map(([themaId, q]) => ({ thema: themen.find((t) => t.id === themaId), q }))
    .filter((x): x is { thema: Thema; q: { richtig: number; gesamt: number } } =>
      Boolean(x.thema && x.q.gesamt >= 3),
    )
    .sort((a, b) => a.q.richtig / a.q.gesamt - b.q.richtig / b.q.gesamt)
    .slice(0, 6)

  const simulationen = [...f.simulationen].sort((a, b) => b.datum.localeCompare(a.datum))
  const bereichName = (id: string) => bereiche.find((b) => b.id === id)?.kurz ?? id

  return (
    <Layout titel="📊 Mein Lernstand">
      {/* Kopf-Kennzahlen */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ['🔥', `${f.streak.tage}`, 'Tage-Streak'],
          ['✅', `${f.erledigteAufgaben.length}`, 'Aufgaben geübt'],
          ['🎯', quote === null ? '—' : `${quote} %`, 'Trefferquote'],
          ['🏁', `${f.simulationen.length}`, 'Simulationen'],
        ].map(([icon, wert, label]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
            <div className="text-2xl">{icon}</div>
            <div className="text-2xl font-black text-slate-900">{wert}</div>
            <div className="text-xs text-slate-500">{label}</div>
          </div>
        ))}
      </div>

      {/* Simulations-Historie */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-bold text-slate-900">🏁 Deine Aufgabensammlungen</h2>
        {simulationen.length === 0 ? (
          <p className="text-sm text-slate-500">
            Noch keine Aufgabensammlung als Simulation abgegeben — starte in Stufe 3!
          </p>
        ) : (
          <div className="space-y-2">
            {simulationen.map((s, i) => {
              const prozent = s.max > 0 ? Math.round((s.punkte / s.max) * 100) : 0
              const note = s.note ?? ihkNote(prozent).note
              return (
                <div key={i} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                  <span className="font-semibold text-slate-800">
                    {terminAnzeige(s.termin)} · {bereichName(s.bereich)}
                  </span>
                  <span className="text-sm text-slate-500">
                    {s.punkte} / {s.max} P. ({prozent} %)
                  </span>
                  <span
                    className={`ml-auto rounded-full px-2.5 py-0.5 text-sm font-bold ${
                      note <= 2 ? 'bg-green-100 text-green-800' : note <= 4 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    Note {note} {s.mitKI && '🤖'}
                  </span>
                  <span className="text-xs text-slate-400">{s.datum}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Problem-Aufgaben */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-1 font-bold text-slate-900">🔁 Deine Problem-Aufgaben</h2>
        <p className="mb-3 text-sm text-slate-500">
          Diese Aufgaben hattest du am häufigsten falsch — nochmal üben lohnt sich.
        </p>
        {problemAufgaben.length === 0 ? (
          <p className="text-sm text-slate-500">Bisher keine — weiter so! 💪</p>
        ) : (
          <div className="space-y-2">
            {problemAufgaben.map(({ aufgabe, v }) => (
              <Link
                key={aufgabe.id}
                to={
                  aufgabe.bereich === 'muendlich'
                    ? '/muendlich'
                    : `/${aufgabe.bereich}/stufe2?thema=${aufgabe.themaId}`
                }
                className="block rounded-xl border border-red-100 bg-red-50/60 px-3 py-2 hover:border-red-300"
              >
                <p className="line-clamp-2 text-sm text-slate-800">
                  {(() => {
                    const z = zerlegeAufgabenText(aufgabe.text)
                    return (z.nr ? `Aufgabe ${z.nr}: ` : '') + z.text.replace(/\*\*/g, '')
                  })()}
                </p>
                <p className="mt-0.5 text-xs text-red-700">
                  {v.falsch}× falsch · {v.richtig}× richtig · {bereichName(aufgabe.bereich)} →
                  jetzt üben
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Schwache Themen */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-bold text-slate-900">📚 Themen mit Luft nach oben</h2>
        {schwacheThemen.length === 0 ? (
          <p className="text-sm text-slate-500">
            Übe ein paar Aufgaben, dann siehst du hier deine schwächsten Themen.
          </p>
        ) : (
          <div className="space-y-2">
            {schwacheThemen.map(({ thema, q }) => {
              const p = Math.round((q.richtig / q.gesamt) * 100)
              return (
                <Link
                  key={thema.id}
                  to={
                    thema.bereich === 'muendlich'
                      ? '/muendlich'
                      : `/${thema.bereich}/stufe1`
                  }
                  className="block rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 hover:border-sky-300"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-medium text-slate-800">{thema.name}</span>
                    <span className="shrink-0 text-sm font-semibold text-slate-500">{p} %</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className={`h-full rounded-full ${p < 50 ? 'bg-red-400' : 'bg-amber-400'}`}
                      style={{ width: `${p}%` }}
                    />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}
