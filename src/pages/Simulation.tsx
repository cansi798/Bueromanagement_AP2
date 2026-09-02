import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import Markdown from '../components/Markdown'
import Timer from '../components/Timer'
import KIBewertung from '../components/KIBewertung'
import Anlage from '../components/Anlage'
import AnlagenDiagramm from '../components/AnlagenDiagramm'
import { ladeAufgaben, ladePruefungen, useDaten } from '../lib/data'
import { wertungMC } from '../lib/quiz'
import { heuteISO, merkeAufgabenErgebnis, merkeErledigt, merkeSimulation } from '../lib/progress'
import { terminVonNummer } from '../lib/termine'
import { ihkNote } from '../lib/noten'
import { zerlegeAufgabenText } from '../lib/aufgabenText'
import OptionText from '../components/OptionText'
import {
  aktuellesModell,
  bewertePruefungsAufgabe,
  kiVerfuegbar,
  type AufgabenBewertung,
} from '../lib/ki'
import type { Aufgabe, BereichId } from '../types'

type KIStatus = 'idle' | 'laedt' | 'fertig' | 'fehler'

export default function Simulation() {
  const { bereichId, nr } = useParams<{ bereichId: BereichId; nr: string }>()
  const termin = terminVonNummer(nr ?? '')
  const { daten: pruefungen } = useDaten(ladePruefungen)
  const { daten: aufgaben } = useDaten(() => ladeAufgaben(bereichId!))
  const [gestartet, setGestartet] = useState(false)
  const [abgegeben, setAbgegeben] = useState(false)
  const [mcAntworten, setMcAntworten] = useState<Record<string, number[]>>({})
  const [textAntworten, setTextAntworten] = useState<Record<string, string>>({})
  const [selbst, setSelbst] = useState<Record<string, boolean>>({})
  const [kiStatus, setKiStatus] = useState<KIStatus>('idle')
  const [statistikGezaehlt, setStatistikGezaehlt] = useState(false)
  const [kiFortschritt, setKiFortschritt] = useState('')
  const [kiErgebnisse, setKiErgebnisse] = useState<Record<string, AufgabenBewertung>>({})

  const pruefung = pruefungen?.find((p) => p.termin === termin && p.bereich === bereichId)
  const liste: Aufgabe[] = useMemo(() => {
    if (!pruefung || !aufgaben) return []
    return pruefung.aufgabenIds
      .map((id) => aufgaben.find((a) => a.id === id))
      .filter((a): a is Aufgabe => Boolean(a))
  }, [pruefung, aufgaben])

  if (!pruefung || !aufgaben) {
    return <Layout titel="Simulation"><p className="text-slate-500">Lade …</p></Layout>
  }

  function toggleMC(aufgabe: Aufgabe, i: number) {
    if (abgegeben) return
    const mehrfach = (aufgabe.korrekt ?? []).length > 1
    setMcAntworten((alt) => {
      const bisher = alt[aufgabe.id] ?? []
      const neu = mehrfach
        ? bisher.includes(i)
          ? bisher.filter((x) => x !== i)
          : [...bisher, i]
        : [i]
      return { ...alt, [aufgabe.id]: neu }
    })
  }

  function abgeben() {
    setAbgegeben(true)
    const heute = heuteISO()
    let mc = 0
    let mcMax = 0
    liste.forEach((a) => {
      if (a.typ === 'mc') {
        mcMax += a.punkte ?? 1
        const richtig = wertungMC(a.korrekt ?? [], mcAntworten[a.id] ?? [])
        if (richtig) mc += a.punkte ?? 1
        merkeAufgabenErgebnis(a.id, richtig, heute)
      } else {
        merkeErledigt(a.id, heute)
      }
    })
    // Vorläufiges Ergebnis: NUR am MC-Teil gemessen (max = MC-Punkte) — sonst
    // würden unbewertete offene Aufgaben die Note fälschlich nach unten ziehen.
    // Die KI-Korrektur überschreibt den Eintrag später mit dem Gesamtergebnis.
    if (termin && mcMax > 0) {
      merkeSimulation({ termin, bereich: bereichId!, punkte: mc, max: mcMax, mitKI: false, datum: heute })
    }
    window.scrollTo({ top: 0 })
  }

  // Auswertung
  const mcErgebnisse = liste
    .filter((a) => a.typ === 'mc')
    .map((a) => ({ a, richtig: wertungMC(a.korrekt ?? [], mcAntworten[a.id] ?? []) }))
  const mcPunkte = mcErgebnisse.filter((e) => e.richtig).reduce((s, e) => s + (e.a.punkte ?? 1), 0)
  const selbstPunkte = liste
    .filter((a) => a.typ !== 'mc' && selbst[a.id])
    .reduce((s, a) => s + (a.punkte ?? 1), 0)

  // KI-Gesamtbericht: alle offenen Aufgaben nacheinander wie ein Korrektor punkten.
  const offene = liste.filter((a) => a.typ !== 'mc')
  const maxPunkteGesamt = liste.reduce((s, a) => s + (a.punkte ?? 1), 0)

  async function kiBerichtErstellen() {
    setKiStatus('laedt')
    const ergebnisse: Record<string, AufgabenBewertung> = {}
    try {
      for (let i = 0; i < offene.length; i++) {
        const a = offene[i]
        const antwort = (textAntworten[a.id] ?? '').trim()
        setKiFortschritt(`Aufgabe ${i + 1} von ${offene.length} wird korrigiert …`)
        if (antwort.length < 3) {
          ergebnisse[a.id] = { punkte: 0, max: a.punkte ?? 1, feedback: 'Keine Antwort abgegeben.' }
          continue
        }
        ergebnisse[a.id] = await bewertePruefungsAufgabe(
          a.text,
          a.loesung,
          antwort,
          a.punkte ?? 1,
          (text, prozent) => setKiFortschritt(`Modell lädt: ${prozent} % — ${text.slice(0, 50)}`),
        )
        setKiErgebnisse({ ...ergebnisse })
      }
      setKiErgebnisse(ergebnisse)
      setKiStatus('fertig')
      // Endgültiges Ergebnis mit KI-Punkten und IHK-Note im Lernstand speichern.
      const heute = heuteISO()
      const offenePunkte = Object.values(ergebnisse).reduce((s, x) => s + x.punkte, 0)
      const gesamt = Math.round((mcPunkte + offenePunkte) * 10) / 10
      // Aufgaben-Statistik nur beim ERSTEN erfolgreichen Durchlauf zählen
      // (sonst verzerrt „Nochmal versuchen" die Richtig/Falsch-Zähler).
      if (!statistikGezaehlt) {
        for (const [id, x] of Object.entries(ergebnisse)) {
          merkeAufgabenErgebnis(id, x.punkte >= x.max * 0.5, heute)
        }
        setStatistikGezaehlt(true)
      }
      if (termin) {
        merkeSimulation({
          termin,
          bereich: bereichId!,
          punkte: gesamt,
          max: maxPunkteGesamt,
          note: ihkNote(maxPunkteGesamt > 0 ? (gesamt / maxPunkteGesamt) * 100 : 0).note,
          mitKI: true,
          datum: heute,
        })
      }
    } catch {
      setKiStatus('fehler')
    }
  }

  const kiOffenePunkte = Object.values(kiErgebnisse).reduce((s, e) => s + e.punkte, 0)
  const kiGesamt = Math.round((mcPunkte + kiOffenePunkte) * 10) / 10
  const kiProzent = maxPunkteGesamt > 0 ? (kiGesamt / maxPunkteGesamt) * 100 : 0
  const note = ihkNote(kiProzent)

  if (!gestartet) {
    return (
      <Layout titel={`Simulation · ${pruefung.name}`}>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-slate-700">
            Du bearbeitest jetzt <strong>{liste.length} Aufgaben</strong> in{' '}
            <strong>{pruefung.zeitMinuten} Minuten</strong> – wie in der echten Prüfung. Lösungen
            siehst du erst nach der Abgabe.
          </p>
          <button
            type="button"
            onClick={() => setGestartet(true)}
            className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-3 font-semibold text-white hover:bg-slate-700 sm:w-auto"
          >
            Simulation starten ⏱
          </button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout titel={abgegeben ? 'Auswertung' : `Simulation · ${pruefung.name}`}>
      {!abgegeben && (
        <div className="sticky top-14 z-10 -mx-4 mb-4 flex items-center justify-between bg-slate-100/95 px-4 py-2 backdrop-blur">
          <Timer minuten={pruefung.zeitMinuten} onAbgelaufen={abgeben} />
          <button
            type="button"
            onClick={abgeben}
            className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white"
          >
            Abgeben
          </button>
        </div>
      )}

      {abgegeben && (
        <div className="mb-5 rounded-2xl border-2 border-sky-200 bg-sky-50 p-4">
          <p className="font-bold text-slate-900">
            Ergebnis: {mcPunkte + selbstPunkte} von {pruefung.punkteGesamt} Punkten
          </p>
          <p className="text-sm text-slate-600">
            MC automatisch gewertet · offene Aufgaben nach deiner Selbsteinschätzung unten.
          </p>

          {/* KI-Prüfungsbericht mit IHK-Note */}
          {kiVerfuegbar() && offene.length > 0 && (
            <div className="mt-3 border-t border-sky-200 pt-3">
              {kiStatus === 'idle' && (
                <div>
                  <button
                    type="button"
                    onClick={kiBerichtErstellen}
                    className="min-h-11 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
                  >
                    🤖 Komplette Prüfung von der KI korrigieren lassen
                  </button>
                  <p className="mt-1.5 text-xs text-slate-500">
                    Die KI ({aktuellesModell().name}) punktet alle {offene.length} offenen
                    Aufgaben wie ein Korrektor und errechnet deine Note nach IHK-Schlüssel.
                  </p>
                </div>
              )}
              {kiStatus === 'laedt' && (
                <p className="text-sm font-medium text-violet-800">
                  ⏳ {kiFortschritt} ({Object.keys(kiErgebnisse).length}/{offene.length} fertig)
                </p>
              )}
              {kiStatus === 'fertig' && (
                <div className="rounded-xl border-2 border-violet-300 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
                    🤖 KI-Prüfungsbericht
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-4">
                    <div>
                      <p className="text-3xl font-black text-slate-900">
                        Note {note.note}
                        <span className="ml-2 text-lg font-bold text-violet-700">({note.wort})</span>
                      </p>
                      <p className="text-sm text-slate-600">
                        {kiGesamt} von {maxPunkteGesamt} erfassten Punkten ·{' '}
                        {Math.round(kiProzent)} % · IHK-Schlüssel
                      </p>
                    </div>
                    <div className="ml-auto text-right text-sm text-slate-500">
                      <p>MC automatisch: {mcPunkte} P.</p>
                      <p>Offene (KI): {Math.round(kiOffenePunkte * 10) / 10} P.</p>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    Einzelfeedback steht unten an jeder Aufgabe. KI-Noten sind eine
                    Lern-Einschätzung — keine amtliche Bewertung.
                  </p>
                </div>
              )}
              {kiStatus === 'fehler' && (
                <p className="text-sm text-red-700">
                  KI-Korrektur abgebrochen (Modell-Problem).{' '}
                  <button type="button" onClick={kiBerichtErstellen} className="font-semibold underline">
                    Nochmal versuchen
                  </button>
                </p>
              )}
            </div>
          )}

          <Link to={`/${bereichId}/stufe3`} className="mt-2 inline-block text-sm font-medium text-sky-700">
            ← Zurück zu den Aufgabensammlungen
          </Link>
        </div>
      )}

      <div className="space-y-5">
        {liste.map((a, idx) => {
          const zerlegt = zerlegeAufgabenText(a.text)
          return (
          <div key={a.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="mb-2 text-sm font-semibold text-slate-500">
              Aufgabe {zerlegt.nr ?? idx + 1}
              {a.punkte !== undefined && ` · ${a.punkte} Punkte`}
            </p>
            <div className={a.anlagenText || a.anlagenDiagramm ? 'lg:grid lg:grid-cols-2 lg:gap-5' : ''}>
              <div>
                <Markdown text={zerlegt.text} />
                {a.typ === 'mc' ? (
                  <div className="mt-3 space-y-2">
                    {(a.optionen ?? []).map((opt, i) => {
                      const gewaehlt = (mcAntworten[a.id] ?? []).includes(i)
                      let stil = gewaehlt
                        ? 'border-sky-500 bg-sky-50'
                        : 'border-slate-300 bg-white'
                      if (abgegeben) {
                        if ((a.korrekt ?? []).includes(i)) stil = 'border-green-500 bg-green-50'
                        else if (gewaehlt) stil = 'border-red-400 bg-red-50'
                      }
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => toggleMC(a, i)}
                          className={`block min-h-12 w-full rounded-lg border-2 px-3 py-2 text-left text-[15px] ${stil}`}
                        >
                          <OptionText text={opt} />
                        </button>
                      )
                    })}
                  </div>
                ) : abgegeben ? (
                  <div className="mt-3">
                    <div className={(textAntworten[a.id] ?? '').trim() ? 'grid gap-2 xl:grid-cols-2' : ''}>
                      {(textAntworten[a.id] ?? '').trim() && (
                        <div className="rounded-lg border border-sky-200 bg-sky-50 p-3">
                          <p className="mb-1 text-xs font-semibold uppercase text-sky-700">
                            ✍️ Deine Antwort
                          </p>
                          <p className="whitespace-pre-wrap text-[15px] text-slate-800">
                            {textAntworten[a.id]}
                          </p>
                        </div>
                      )}
                      <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                        <p className="mb-1 text-xs font-semibold uppercase text-green-700">
                          Musterlösung
                        </p>
                        <Markdown text={a.loesung} />
                      </div>
                    </div>
                    {kiErgebnisse[a.id] && (
                      <div className="mt-2 rounded-lg border border-violet-200 bg-violet-50 p-3">
                        <p className="text-sm font-bold text-violet-800">
                          🤖 KI-Korrektur: {kiErgebnisse[a.id].punkte} / {kiErgebnisse[a.id].max}{' '}
                          Punkte
                        </p>
                        <p className="mt-1 text-sm text-slate-700">{kiErgebnisse[a.id].feedback}</p>
                      </div>
                    )}
                    <KIBewertung
                      frage={a.text}
                      loesung={a.loesung}
                      antwort={textAntworten[a.id] ?? ''}
                      punkte={a.punkte}
                    />
                    {selbst[a.id] === undefined ? (
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setSelbst((s) => ({ ...s, [a.id]: true }))}
                          className="flex-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white"
                        >
                          Hatte ich richtig ✔
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelbst((s) => ({ ...s, [a.id]: false }))}
                          className="flex-1 rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white"
                        >
                          Hatte ich falsch ✘
                        </button>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-slate-500">
                        Bewertet: {selbst[a.id] ? 'richtig ✔' : 'falsch ✘'}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="mt-3">
                    <textarea
                      value={textAntworten[a.id] ?? ''}
                      onChange={(e) =>
                        setTextAntworten((alt) => ({ ...alt, [a.id]: e.target.value }))
                      }
                      placeholder="✍️ Deine Antwort — wird nach der Abgabe mit der Musterlösung verglichen (KI-Bewertung möglich) …"
                      rows={4}
                      className="w-full rounded-lg border border-slate-300 bg-white p-3 text-[15px] focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>
              {(a.anlagenText || a.anlagenDiagramm) && (
                <div className="mt-3 space-y-3 lg:mt-0">
                  {a.anlagenDiagramm && <AnlagenDiagramm diagramm={a.anlagenDiagramm} />}
                  {a.anlagenText && <Anlage text={a.anlagenText} />}
                </div>
              )}
            </div>
          </div>
          )
        })}
      </div>

      {!abgegeben && (
        <button
          type="button"
          onClick={abgeben}
          className="mt-6 w-full rounded-lg bg-slate-900 px-4 py-3 font-semibold text-white"
        >
          Abgeben
        </button>
      )}
    </Layout>
  )
}
