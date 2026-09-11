// Merkt sich, ob im Themen-Quiz Auswahl- oder Freitext-Modus aktiv ist.
import { getItem, setItem } from './storage'

const KEY = 'kbm.v1.quizmodus'

export type QuizModus = 'auswahl' | 'freitext'

export function ladeQuizModus(): QuizModus {
  return getItem<QuizModus>(KEY) === 'freitext' ? 'freitext' : 'auswahl'
}

export function speichereQuizModus(m: QuizModus): void {
  setItem(KEY, m)
}
