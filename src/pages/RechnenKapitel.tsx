import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import Markdown from '../components/Markdown'
import RechnenAufgabe from '../components/RechnenAufgabe'
import { ladeRechnen, useDaten } from '../lib/data'
import { GENERATOREN } from '../lib/rechnen'
import { merkeRechnenAufgabe, merkeRechnenUebung } from '../lib/rechnenFortschritt'

type Tab = 'erklaerung' | 'ueben' | 'pruefung'

export default function RechnenKapitel() {
  const { kapitelId } = useParams<{ kapitelId: string }>()
  const { daten, fehler, laedt } = useDaten(ladeRechnen)
  const [tab, setTab] = useState<Tab>('erklaerung')
  const [runde, setRunde] = useState(0) // erzwingt neue Generator-Aufgabe
  const [festIndex, setFestIndex] = useState(0)

  const kapitel = daten?.kapitel.find((k) => k.id === kapitelId)
  const generator = kapitelId ? GENERATOREN[kapitelId] : undefined
  // Eine Aufgabe pro Runde einfrieren — sonst würfelt jeder Re-Render neu.
  const uebung = useMemo(() => generator?.(), [generator, runde])

  if (laedt) return <Layout titel="Kaufmännisches Rechnen"><p className="text-slate-500">Lade …</p></Layout>
  if (fehler || !kapitel || !generator)
    return (
      <Layout titel="Kaufmännisches Rechnen">
        <p className="rounded-lg bg-red-50 p-4 text-red-700">Kapitel nicht gefunden.</p>
        <Link to="/rechnen" className="mt-2 inline-block text-sm font-medium text-sky-700 dark:text-sky-400">← Zur Übersicht</Link>
      </Layout>
    )

  const tabs: { id: Tab; titel: string }[] = [
    { id: 'erklaerung', titel: 'Erklärung' },
    { id: 'ueben', titel: 'Üben' },
    ...(kapitel.aufgaben.length > 0 ? [{ id: 'pruefung' as Tab, titel: `Prüfungsaufgaben (${kapitel.aufgaben.length})` }] : []),
  ]
  const fest = kapitel.aufgaben[festIndex]

  return (
    <Layout titel={kapitel.titel}>
      <Link to="/rechnen" className="-mt-2 mb-3 inline-block text-sm font-medium text-sky-700 dark:text-sky-400">
        ← Alle Rechenarten
      </Link>
      <div className="mb-4 flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
              tab === t.id ? 'bg-rose-600 text-white' : 'bg-white text-slate-700 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {t.titel}
          </button>
        ))}
      </div>

      {tab === 'erklaerung' && (
        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900 sm:p-6">
          <Markdown text={kapitel.erklaerung} />
          <button
            type="button"
            onClick={() => setTab('ueben')}
            className="mt-4 rounded-lg bg-rose-600 px-4 py-2.5 font-semibold text-white"
          >
            Jetzt üben →
          </button>
        </div>
      )}

      {tab === 'ueben' && uebung && (
        <RechnenAufgabe
          key={runde}
          aufgabe={uebung}
          onErgebnis={(richtig) => merkeRechnenUebung(kapitel.id, richtig)}
          onWeiter={() => setRunde((r) => r + 1)}
          weiterText="Neue Aufgabe"
        />
      )}

      {tab === 'pruefung' && fest && (
        <div>
          <p className="mb-2 text-sm text-slate-600 dark:text-slate-300">
            Aufgabe {festIndex + 1} von {kapitel.aufgaben.length}
          </p>
          <RechnenAufgabe
            key={fest.id}
            aufgabe={fest}
            onErgebnis={(richtig) => merkeRechnenAufgabe(kapitel.id, fest.id, richtig)}
            onWeiter={() => setFestIndex((i) => (i + 1) % kapitel.aufgaben.length)}
            weiterText={festIndex + 1 < kapitel.aufgaben.length ? 'Nächste Aufgabe' : 'Von vorn'}
            quelleHinweis={
              fest.quelle ? `Aufgabensammlung ${fest.quelle.sammlung}, Aufgabe ${fest.quelle.aufgabe}` : undefined
            }
          />
        </div>
      )}
    </Layout>
  )
}
