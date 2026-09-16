// Schutz gegen endloses Hängen der KI-Bewertung: Promises bekommen ein hartes
// Zeitlimit, Modell-Downloads einen Stillstands-Wächter (Timer wird bei jedem
// Fortschritts-Ereignis neu aufgezogen). Läuft ein Limit ab, rejected das
// Promise mit einer verständlichen Meldung — die Fehler-UIs fangen das auf.

export function mitZeitlimit<T>(promise: Promise<T>, ms: number, meldung: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>
  const limit = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(meldung)), ms)
  })
  return Promise.race([promise, limit]).finally(() => clearTimeout(timer)) as Promise<T>
}

export interface Stillstandswaechter {
  /** Bei jedem Fortschritts-Ereignis rufen — zieht den Timer neu auf. */
  melden(): void
  /** Wächter abschalten (Erfolg oder eigener Fehler). */
  fertig(): void
  /** Rejected mit der Meldung, wenn zu lange kein Fortschritt kam. */
  abgelaufen: Promise<never>
}

export function neuerStillstandswaechter(ms: number, meldung: string): Stillstandswaechter {
  let timer: ReturnType<typeof setTimeout>
  let beendet = false
  let alarm!: (e: Error) => void
  const abgelaufen = new Promise<never>((_, reject) => {
    alarm = reject
  })
  const aufziehen = () => {
    clearTimeout(timer)
    if (!beendet) timer = setTimeout(() => alarm(new Error(meldung)), ms)
  }
  aufziehen()
  return {
    melden: aufziehen,
    fertig() {
      beendet = true
      clearTimeout(timer)
    },
    abgelaufen,
  }
}
