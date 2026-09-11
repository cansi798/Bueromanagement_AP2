import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import LernpaarKarte from '../components/LernpaarKarte'
import { ladeBereiche, ladeLernpaare, ladeThemen, useDaten } from '../lib/data'
import { farbe } from '../lib/farben'
import {
  faelligeLernpaare,
  falscheLernpaare,
  ladeLernpaarStaende,
  merkeLernpaarAntwort,
  merkeLernpaarSelbst,
  mischeOptionen,
  quizFortschritt,
  themenQuizStand,
  type SelbstWertung,
} from '../lib/lernquiz'
import { heuteISO, merkeQuiz } from '../lib/progress'
import { ladeQuizModus, speichereQuizModus, type QuizModus } from '../lib/quizmodus'
import type { BereichId, Lernpaar } from '../types'

const SESSION_GROESSE = 20

// Themen-Quiz mit Leitner-System: ohne :themaId die Themenübersicht,
// mit :themaId (oder "alle") die eigentliche Frage-Session.
export default function Quiz() {
  const { bereichId, themaId } = useParams<{ bereichId: BereichId; themaId?: string }>()
  const { daten: bereiche } = useDaten(ladeBereiche)
  const { daten: themen } = useDaten(() => ladeThemen(bereichId!))
  const { daten: paare, fehler, laedt } = useDaten(() => ladeLernpaare(bereichId!))
  const bereich = bereiche?.find((b) => b.id === bereichId)

  if (laedt) return <Layout titel="Themen-Quiz"><p className="text-slate-500 dark:text-slate-400">Lade …</p></Layout>
  if (fehler || !paare)
    return (
      <Layout titel="Themen-Quiz">
        <p className="rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {fehler ?? 'Für diesen Bereich gibt es noch kein Quiz.'}
        </p>
      </Layout>
    )

  if (!themaId) {
    return (
      <Uebersicht
        bereichId={bereichId!}
        farbName={bereich?.farbe ?? 'sky'}
        paare={paare}
        themenNamen={new Map((themen ?? []).map((t) => [t.id, t.name]))}
      />
    )
  }
  return <Session bereichId={bereichId!} themaId={themaId} paare={paare} />
}

function Uebersicht({
  bereichId,
  farbName,
  paare,
  themenNamen,
}: {
  bereichId: BereichId
  farbName: string
  paare: Lernpaar[]
  themenNamen: Map<string, string>
}) {
  const heute = heuteISO()
  const staende = ladeLernpaarStaende()
  const f = farbe(farbName)

  const proThema = useMemo(() => {
    const map = new Map<string, Lernpaar[]>()
    for (const p of paare) {
      if (!map.has(p.themaId)) map.set(p.themaId, [])
      map.get(p.themaId)!.push(p)
    }
    return [...map.entries()]
  }, [paare])

  const gesamtStand = themenQuizStand(paare, staende, heute)
  const falsche = falscheLernpaare(paare, staende)

  if (paare.length === 0) {
    return (
      <Layout titel="Themen-Quiz">
        <p className="rounded-lg bg-amber-50 p-4 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          Für diesen Bereich sind noch keine Quizfragen hinterlegt.
        </p>
      </Layout>
    )
  }

  return (
    <Layout titel="Themen-Quiz">
      <p className="-mt-2 mb-4 text-sm text-slate-600 dark:text-slate-300">
        Multiple-Choice nach Themen, gelernt im Leitner-System: Richtig beantwortete Fragen
        kommen in ein höheres Fach und tauchen seltener auf — falsche landen wieder in Fach 1.
      </p>

      {gesamtStand.faellig > 0 ? (
        <Link
          to={`/${bereichId}/quiz/alle`}
          className="mb-5 flex items-center gap-4 rounded-2xl border-2 border-slate-900 bg-slate-900 p-4 text-white shadow-sm transition hover:bg-slate-800"
        >
          <span className="text-3xl">🚀</span>
          <div className="min-w-0 flex-1">
            <h2 className="font-bold">Heute fällig: {gesamtStand.faellig} Fragen</h2>
            <p className="text-sm text-slate-300">Alle Themen gemischt üben.</p>
          </div>
          <span className="text-slate-400">→</span>
        </Link>
      ) : (
        <Link
          to={`/${bereichId}/quiz/alle`}
          className="mb-5 flex items-center gap-4 rounded-2xl border-2 border-green-200 bg-green-50 p-4 shadow-sm transition hover:border-green-400 dark:border-green-900 dark:bg-green-950/40 dark:hover:border-green-700"
        >
          <span className="text-3xl">🎉</span>
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-green-900 dark:text-green-300">Alle Wiederholungen für heute erledigt!</h2>
            <p className="text-sm text-green-800 dark:text-green-300">
              Extra-Runde starten (alle Themen gemischt) – oder unten ein Thema wählen.
            </p>
          </div>
          <span className="text-green-600">→</span>
        </Link>
      )}

      {falsche.length > 0 && (
        <Link
          to={`/${bereichId}/quiz/fehler`}
          className="mb-5 flex items-center gap-4 rounded-2xl border-2 border-red-200 bg-red-50 p-4 shadow-sm transition hover:border-red-400 dark:border-red-900 dark:bg-red-950/40 dark:hover:border-red-700"
        >
          <span className="text-3xl">🔁</span>
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-red-900 dark:text-red-300">Falsche wiederholen: {falsche.length} Fragen</h2>
            <p className="text-sm text-red-800 dark:text-red-300">Alles, was du zuletzt falsch hattest — bereichsweit.</p>
          </div>
          <span className="text-red-400 dark:text-red-500">→</span>
        </Link>
      )}

      <div className="space-y-3">
        {proThema.map(([tid, tp]) => {
          const stand = themenQuizStand(tp, staende, heute)
          const anteil = quizFortschritt(stand)
          return (
            <div key={tid} className={`relative block rounded-2xl border-2 p-4 shadow-sm transition ${f.kachel}`}>
              <Link to={`/${bereichId}/quiz/${tid}`} className="absolute inset-0" aria-label={themenNamen.get(tid) ?? tid} />
              <div className="flex items-center justify-between gap-3">
                <h2 className="min-w-0 font-bold text-slate-900 dark:text-slate-100">
                  {themenNamen.get(tid) ?? tid}
                </h2>
                <span className="shrink-0 text-slate-400 dark:text-slate-500">→</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white dark:bg-slate-900">
                <div
                  className={`h-full rounded-full ${f.balken}`}
                  style={{ width: `${Math.round(anteil * 100)}%` }}
                />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
                <span>{stand.gesamt} Fragen</span>
                {stand.faellig > 0 && (
                  <span className="font-semibold text-amber-700 dark:text-amber-300">{stand.faellig} fällig</span>
                )}
                {stand.neu > 0 && <span>✨ {stand.neu} neu</span>}
                {stand.gemeistert > 0 && <span>🏆 {stand.gemeistert} gemeistert</span>}
                {(() => {
                  const anzahlFalsch = falscheLernpaare(tp, staende).length
                  return anzahlFalsch > 0 ? (
                    <Link
                      to={`/${bereichId}/quiz/fehler:${tid}`}
                      className="relative z-10 font-semibold text-red-700 underline decoration-dotted dark:text-red-300"
                    >
                      🔁 {anzahlFalsch} falsch
                    </Link>
                  ) : null
                })()}
                {stand.neu < stand.gesamt && (
                  <span
                    className="ml-auto flex items-end gap-0.5"
                    title={`Fächer 1–5: ${stand.proFach.join(' · ')} Fragen`}
                  >
                    {stand.proFach.map((n, i) => {
                      const max = Math.max(...stand.proFach, 1)
                      return (
                        <span
                          key={i}
                          className={`w-1.5 rounded-sm ${n > 0 ? f.balken : 'bg-slate-200'}`}
                          style={{ height: `${4 + Math.round((n / max) * 10)}px` }}
                        />
                      )
                    })}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </Layout>
  )
}

function Session({
  bereichId,
  themaId,
  paare,
}: {
  bereichId: BereichId
  themaId: string
  paare: Lernpaar[]
}) {
  const heute = heuteISO()

  const fehlerModus = themaId === 'fehler' || themaId.startsWith('fehler:')
  const filterThema = fehlerModus
    ? (themaId.includes(':') ? themaId.split(':')[1] : null)
    : themaId
  const themenPaare = useMemo(() => {
    const basis =
      filterThema === null || filterThema === 'alle'
        ? paare
        : paare.filter((p) => p.themaId === filterThema)
    return fehlerModus ? falscheLernpaare(basis, ladeLernpaarStaende()) : basis
  }, [paare, filterThema, fehlerModus])

  // Die Session wird beim Start eingefroren: erst fällige, sonst Extra-Runde.
  const [runde, setRunde] = useState(() => baueRunde(themenPaare, heute, fehlerModus))
  const [index, setIndex] = useState(0)
  const [richtige, setRichtige] = useState(0)
  const [modus, setModus] = useState(ladeQuizModus)

  function wechsleModus(m: QuizModus) {
    setModus(m)
    speichereQuizModus(m)
  }

  const aktuell = runde[index]
  // Optionen-Mischung und Fach werden je Frage einmal eingefroren — das Fach
  // vor der Antwort, damit die Karte den Fach-Wechsel korrekt erzählen kann.
  const eingefroren = useMemo(() => {
    if (!aktuell) return null
    const staende = ladeLernpaarStaende()
    return {
      gemischt: mischeOptionen(aktuell),
      fach: staende[aktuell.id]?.fach ?? null,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aktuell?.id])

  function ergebnis(richtig: boolean) {
    if (!aktuell) return
    merkeLernpaarAntwort(aktuell.id, richtig, heute)
    merkeQuiz(aktuell.themaId, richtig ? 1 : 0, 1, heute)
    if (richtig) setRichtige((n) => n + 1)
  }

  function ergebnisSelbst(wertung: SelbstWertung) {
    if (!aktuell) return
    merkeLernpaarSelbst(aktuell.id, wertung, heute)
    // teilweise zählt als halber Treffer in der Themen-Quote.
    merkeQuiz(aktuell.themaId, wertung === 'gewusst' ? 1 : wertung === 'teilweise' ? 0.5 : 0, 1, heute)
    if (wertung === 'gewusst') setRichtige((n) => n + 1)
  }

  function weiter() {
    setIndex((i) => i + 1)
  }

  function nochEineRunde() {
    if (fehlerModus) {
      // Frisch berechnen, damit richtig beantwortete Karten nicht erneut erscheinen.
      const basis =
        filterThema === null || filterThema === 'alle'
          ? paare
          : paare.filter((p) => p.themaId === filterThema)
      const frischeFalsche = falscheLernpaare(basis, ladeLernpaarStaende())
      // leere Liste → Leer-Zustand (🎉) über runde=[] erreichbar machen
      setRunde(frischeFalsche.slice(0, SESSION_GROESSE))
      setIndex(0)
      setRichtige(0)
      return
    }
    setRunde(baueRunde(themenPaare, heute, fehlerModus))
    setIndex(0)
    setRichtige(0)
  }

  if (fehlerModus && themenPaare.length === 0) {
    return (
      <Layout titel="Themen-Quiz">
        <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-slate-900">
          <p className="text-4xl">🎉</p>
          <h2 className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-100">Keine falschen Karten mehr!</h2>
          <p className="mt-1 text-slate-600 dark:text-slate-300">Alles, was zuletzt falsch war, hast du inzwischen richtig beantwortet.</p>
          <Link
            to={`/${bereichId}/quiz`}
            className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-slate-300 bg-white px-6 font-semibold text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600"
          >
            Zur Themenübersicht
          </Link>
        </div>
      </Layout>
    )
  }

  if (themenPaare.length === 0) {
    return (
      <Layout titel="Themen-Quiz">
        <p className="rounded-lg bg-amber-50 p-4 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          Für dieses Thema sind noch keine Quizfragen hinterlegt.
        </p>
      </Layout>
    )
  }

  // Session fertig → Zusammenfassung (oder 🎉 wenn Fehler-Modus und keine falschen mehr)
  if (index >= runde.length) {
    if (fehlerModus && runde.length === 0) {
      return (
        <Layout titel="Themen-Quiz">
          <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-slate-900">
            <p className="text-4xl">🎉</p>
            <h2 className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-100">Keine falschen Karten mehr!</h2>
            <p className="mt-1 text-slate-600 dark:text-slate-300">Alles, was zuletzt falsch war, hast du inzwischen richtig beantwortet.</p>
            <Link
              to={`/${bereichId}/quiz`}
              className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-slate-300 bg-white px-6 font-semibold text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600"
            >
              Zur Themenübersicht
            </Link>
          </div>
        </Layout>
      )
    }
    const quote = runde.length > 0 ? Math.round((richtige / runde.length) * 100) : 0
    return (
      <Layout titel="Themen-Quiz">
        <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-slate-900">
          <p className="text-4xl">{quote >= 80 ? '🏆' : quote >= 50 ? '💪' : '📚'}</p>
          <h2 className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-100">Runde geschafft!</h2>
          <p className="mt-1 text-slate-600 dark:text-slate-300">
            {richtige} von {runde.length} richtig ({quote} %).
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={nochEineRunde}
              className="min-h-12 rounded-xl bg-sky-600 px-6 font-semibold text-white hover:bg-sky-700"
            >
              Noch eine Runde
            </button>
            <Link
              to={`/${bereichId}/quiz`}
              className="flex min-h-12 items-center justify-center rounded-xl border-2 border-slate-300 bg-white px-6 font-semibold text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600"
            >
              Zur Themenübersicht
            </Link>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout titel="Themen-Quiz">
      <div className="mx-auto max-w-2xl">
        <div className="mb-3 flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
          <span>
            Frage <strong>{index + 1}</strong> / {runde.length}
          </span>
          <span>✔ {richtige} richtig</span>
        </div>
        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className="h-full rounded-full bg-sky-500 transition-all"
            style={{ width: `${Math.round((index / runde.length) * 100)}%` }}
          />
        </div>
        <div className="mb-3 flex gap-1 text-sm">
          {([['auswahl', 'Antworten wählen'], ['freitext', 'Selbst formulieren']] as const).map(([m, label]) => (
            <button key={m} type="button" onClick={() => wechsleModus(m)}
              className={`rounded-lg px-3 py-1.5 font-medium ${
                modus === m ? 'bg-slate-900 text-white dark:bg-slate-700' : 'bg-white text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}>
              {label}
            </button>
          ))}
        </div>
        {aktuell && eingefroren && (
          <LernpaarKarte
            key={aktuell.id}
            paar={aktuell}
            optionen={eingefroren.gemischt.optionen}
            korrekt={eingefroren.gemischt.korrekt}
            fach={eingefroren.fach}
            modus={modus}
            onErgebnis={ergebnis}
            onSelbst={ergebnisSelbst}
            onWeiter={weiter}
          />
        )}
      </div>
    </Layout>
  )
}

// Fällige Fragen zuerst; im Fehler-Modus alle falschen; sonst Extra-Runde.
function baueRunde(themenPaare: Lernpaar[], heute: string, fehlerModus = false): Lernpaar[] {
  if (fehlerModus) return themenPaare.slice(0, SESSION_GROESSE)
  const staende = ladeLernpaarStaende()
  const faellig = faelligeLernpaare(themenPaare, staende, heute)
  if (faellig.length > 0) return faellig.slice(0, SESSION_GROESSE)
  const alle = [...themenPaare]
  for (let i = alle.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[alle[i], alle[j]] = [alle[j], alle[i]]
  }
  return alle.slice(0, SESSION_GROESSE)
}
