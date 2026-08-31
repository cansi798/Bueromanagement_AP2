// KI-Bewertung offener Antworten — läuft KOMPLETT im Browser (WebLLM/WebGPU).
// Kein Server, keine API-Keys: Das gewählte Modell wird einmalig geladen und
// im Browser-Cache gespeichert. Voraussetzung: WebGPU (aktuelles Chrome/Edge).
import type { MLCEngine } from '@mlc-ai/web-llm'
import { getItem, setItem } from './storage'

export interface KIModell {
  id: string
  name: string
  groesse: string
  hinweis: string
}

export const KI_MODELLE: KIModell[] = [
  {
    id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC',
    name: 'Blitz (Llama 1B)',
    groesse: '~0,7 GB',
    hinweis: 'Sehr schnell, einfaches Feedback — gut für schwächere Geräte.',
  },
  {
    id: 'gemma-2-2b-it-q4f16_1-MLC',
    name: 'Standard (Gemma 2B)',
    groesse: '~1,4 GB',
    hinweis: 'Guter Kompromiss aus Tempo und Qualität.',
  },
  {
    id: 'Llama-3.1-8B-Instruct-q4f16_1-MLC',
    name: 'Beste Qualität (Llama 8B)',
    groesse: '~4,6 GB',
    hinweis: 'Deutlich besseres Deutsch und Fach-Feedback — braucht viel Speicher/GPU.',
  },
]

const MODELL_KEY = 'kbm.v1.kimodell'

export function aktuellesModell(): KIModell {
  const gespeichert = getItem<string>(MODELL_KEY)
  return KI_MODELLE.find((m) => m.id === gespeichert) ?? KI_MODELLE[1]
}

let enginePromise: Promise<MLCEngine> | null = null
let geladenesModell: string | null = null

export function waehleModell(id: string): void {
  setItem(MODELL_KEY, id)
  if (geladenesModell !== id) {
    // Nächste Bewertung lädt das neu gewählte Modell.
    enginePromise = null
    geladenesModell = null
  }
}

export function kiVerfuegbar(): boolean {
  return typeof navigator !== 'undefined' && 'gpu' in navigator
}

export function kiGeladen(): boolean {
  return enginePromise !== null && geladenesModell === aktuellesModell().id
}

export function ladeEngine(
  onProgress?: (text: string, prozent: number) => void,
): Promise<MLCEngine> {
  const modell = aktuellesModell()
  if (!enginePromise || geladenesModell !== modell.id) {
    geladenesModell = modell.id
    // Dynamischer Import: WebLLM landet in einem eigenen Chunk und wird erst
    // geladen, wenn die KI-Bewertung wirklich benutzt wird.
    enginePromise = import('@mlc-ai/web-llm')
      .then(({ CreateMLCEngine }) =>
        CreateMLCEngine(modell.id, {
          initProgressCallback: (r) => onProgress?.(r.text, Math.round(r.progress * 100)),
        }),
      )
      .catch((e) => {
        enginePromise = null // nächster Versuch möglich
        geladenesModell = null
        throw e
      })
  }
  return enginePromise
}

export interface AufgabenBewertung {
  punkte: number
  max: number
  feedback: string
}

// Bewertet EINE Prüfungsaufgabe wie ein IHK-Korrektor: vergibt Punkte + kurzes
// Feedback. Robustes Textformat statt JSON (kleine Modelle halten JSON schlecht).
export async function bewertePruefungsAufgabe(
  frage: string,
  musterloesung: string,
  antwort: string,
  maxPunkte: number,
  onProgress?: (text: string, prozent: number) => void,
): Promise<AufgabenBewertung> {
  const engine = await ladeEngine(onProgress)
  const res = await engine.chat.completions.create({
    messages: [
      {
        role: 'system',
        content:
          'Du bist ein fairer IHK-Korrektor für Büromanagement. Du bewertest AUSSCHLIESSLICH ' +
          'den Text im Abschnitt SCHÜLERANTWORT — niemals die Musterlösung selbst; sie ist nur ' +
          'dein Vergleichsmaßstab. Entspricht die Schülerantwort der Musterlösung inhaltlich ' +
          '(auch in eigenen Worten), gib die VOLLE Punktzahl; fehlen Teile, gib anteilige Punkte; ' +
          'ist sie falsch oder leer, gib 0. ' +
          'Antworte GENAU in diesem Format, sonst nichts:\n' +
          `PUNKTE: <Zahl zwischen 0 und ${maxPunkte}>\n` +
          'FEEDBACK: <beginne mit einem kurzen wörtlichen Zitat aus der Schülerantwort in ' +
          'Anführungszeichen, dann max. 35 Wörter: was stimmt, was fehlt>',
      },
      {
        role: 'user',
        content:
          `### AUFGABE (${maxPunkte} Punkte)\n${frage}\n\n` +
          `### MUSTERLÖSUNG (nur Vergleichsmaßstab — NICHT bewerten!)\n${musterloesung}\n\n` +
          `### SCHÜLERANTWORT (NUR diese bewerten!)\n${antwort}`,
      },
    ],
    temperature: 0.2,
    max_tokens: 200,
  })
  const text = res.choices[0]?.message?.content ?? ''
  const m = text.match(/PUNKTE:\s*([\d.,]+)/i)
  let punkte = m ? parseFloat(m[1].replace(',', '.')) : NaN
  if (!Number.isFinite(punkte)) punkte = 0
  punkte = Math.max(0, Math.min(maxPunkte, punkte))
  const feedback =
    text.replace(/^[\s\S]*?FEEDBACK:\s*/i, '').trim() || text.trim() || 'Kein Feedback erhalten.'
  return { punkte: Math.round(punkte * 10) / 10, max: maxPunkte, feedback }
}

export async function bewerteAntwort(
  frage: string,
  musterloesung: string,
  antwort: string,
  onProgress?: (text: string, prozent: number) => void,
): Promise<string> {
  const engine = await ladeEngine(onProgress)
  const res = await engine.chat.completions.create({
    messages: [
      {
        role: 'system',
        content:
          'Du bist eine faire, ermutigende Berufsschul-Lehrkraft für Büromanagement. ' +
          'Du bewertest AUSSCHLIESSLICH den Text im Abschnitt SCHÜLERANTWORT — niemals die ' +
          'Musterlösung selbst; sie ist nur dein Vergleichsmaßstab. Entspricht die ' +
          'Schülerantwort der Musterlösung inhaltlich (auch in eigenen Worten), sag das klar ' +
          'und gib Note 1–2. Antworte auf Deutsch, kurz und strukturiert: ' +
          '1) Beginne mit einem kurzen wörtlichen Zitat aus der SCHÜLERANTWORT in ' +
          'Anführungszeichen, 2) Note von 1–6 mit einem Satz Begründung, ' +
          '3) Was war richtig?, 4) Was fehlt oder ist falsch? Maximal 120 Wörter.',
      },
      {
        role: 'user',
        content:
          `### AUFGABE\n${frage}\n\n` +
          `### MUSTERLÖSUNG (nur Vergleichsmaßstab — NICHT bewerten!)\n${musterloesung}\n\n` +
          `### SCHÜLERANTWORT (NUR diese bewerten!)\n${antwort}`,
      },
    ],
    temperature: 0.3,
    max_tokens: 350,
  })
  return res.choices[0]?.message?.content?.trim() || 'Keine Bewertung erhalten.'
}
