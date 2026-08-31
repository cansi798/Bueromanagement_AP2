// KI-Bewertung offener Antworten — läuft KOMPLETT im Browser (WebLLM/WebGPU).
// Kein Server, keine API-Keys: Das Modell (Gemma 2 2B) wird einmalig geladen
// und im Browser-Cache gespeichert. Voraussetzung: WebGPU (aktuelles Chrome/Edge).
import type { MLCEngine } from '@mlc-ai/web-llm'

export const KI_MODELL = 'gemma-2-2b-it-q4f16_1-MLC'
export const KI_MODELL_NAME = 'Gemma 2 (2B, lokal im Browser)'

let enginePromise: Promise<MLCEngine> | null = null

export function kiVerfuegbar(): boolean {
  return typeof navigator !== 'undefined' && 'gpu' in navigator
}

export function kiGeladen(): boolean {
  return enginePromise !== null
}

export function ladeEngine(
  onProgress?: (text: string, prozent: number) => void,
): Promise<MLCEngine> {
  if (!enginePromise) {
    // Dynamischer Import: WebLLM landet in einem eigenen Chunk und wird erst
    // geladen, wenn die KI-Bewertung wirklich benutzt wird.
    enginePromise = import('@mlc-ai/web-llm')
      .then(({ CreateMLCEngine }) =>
        CreateMLCEngine(KI_MODELL, {
          initProgressCallback: (r) => onProgress?.(r.text, Math.round(r.progress * 100)),
        }),
      )
      .catch((e) => {
        enginePromise = null // nächster Versuch möglich
        throw e
      })
  }
  return enginePromise
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
          'Bewerte die Schülerantwort im Vergleich zur Musterlösung. Antworte auf Deutsch, ' +
          'kurz und strukturiert: 1) Note von 1–6 mit einem Satz Begründung, ' +
          '2) Was war richtig?, 3) Was fehlt oder ist falsch? Maximal 120 Wörter.',
      },
      {
        role: 'user',
        content: `Aufgabe:\n${frage}\n\nMusterlösung:\n${musterloesung}\n\nSchülerantwort:\n${antwort}`,
      },
    ],
    temperature: 0.3,
    max_tokens: 350,
  })
  return res.choices[0]?.message?.content?.trim() || 'Keine Bewertung erhalten.'
}
