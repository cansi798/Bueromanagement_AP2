import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import { ladeRechnen, useDaten } from '../lib/data'
import { ladeRechnenStand } from '../lib/rechnenFortschritt'
import type { RechnenKapitel } from '../types'

const GRUPPEN: { id: RechnenKapitel['gruppe']; titel: string }[] = [
  { id: 'grundlagen', titel: 'Grundlagen' },
  { id: 'pruefung', titel: 'Prüfungstypen WiSo' },
]

export default function Rechnen() {
  const { daten, fehler, laedt } = useDaten(ladeRechnen)
  const stand = ladeRechnenStand()

  if (laedt) return <Layout titel="Kaufmännisches Rechnen"><p className="text-slate-500 dark:text-slate-400">Lade …</p></Layout>
  if (fehler || !daten)
    return <Layout titel="Kaufmännisches Rechnen"><p className="rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-950/40 dark:text-red-300">{fehler}</p></Layout>

  return (
    <Layout titel="Kaufmännisches Rechnen">
      <p className="-mt-2 mb-4 text-sm text-slate-600 dark:text-slate-300">
        Kurz erklärt, dann rechnen: unbegrenzt Übungsaufgaben mit Lösungsweg — plus die
        Original-Rechenaufgaben aus den Aufgabensammlungen.
      </p>
      {GRUPPEN.map((g) => (
        <section key={g.id} className="mb-6">
          <h2 className="mb-3 font-bold text-slate-900 dark:text-slate-100">{g.titel}</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {daten.kapitel.filter((k) => k.gruppe === g.id).map((k) => {
              const s = stand.kapitel[k.id]
              const versuche = (s?.richtig ?? 0) + (s?.falsch ?? 0)
              return (
                <Link
                  key={k.id}
                  to={`/rechnen/${k.id}`}
                  className="block rounded-2xl border-2 border-rose-200 bg-rose-50 p-4 shadow-sm transition hover:border-rose-400 dark:border-rose-900 dark:bg-rose-950/40 dark:hover:border-rose-700"
                >
                  <h3 className="font-bold text-slate-900 dark:text-slate-100">{k.titel}</h3>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{k.kurz}</p>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    {versuche > 0
                      ? `${s!.richtig} von ${versuche} richtig`
                      : 'Noch nicht geübt'}
                    {k.aufgaben.length > 0 &&
                      ` · Prüfungsaufgaben: ${s?.geloest.length ?? 0} von ${k.aufgaben.length} gelöst`}
                  </p>
                </Link>
              )
            })}
          </div>
        </section>
      ))}
    </Layout>
  )
}
