// Anbindung an das optionale PHP-Backend (server/api/…).
// Ohne Backend (z. B. GitHub Pages) schlagen die Aufrufe leise fehl —
// die App läuft dann im Gast-Modus mit localStorage weiter.
import { getItem, removeItem, setItem } from './storage'

export interface Nutzer {
  id: number
  email: string
  name: string
  rolle: 'admin' | 'lehrer' | 'schueler'
}

const BASIS = './server/api'
const NUTZER_KEY = 'kbm.v1.nutzer'

async function anfrage<T = Record<string, unknown>>(
  pfad: string,
  opts: RequestInit = {},
): Promise<{ ok: boolean; status: number; daten: T }> {
  const res = await fetch(`${BASIS}/${pfad}`, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  })
  const daten = (await res.json().catch(() => ({}))) as T
  return { ok: res.ok, status: res.status, daten }
}

export function angemeldeterNutzer(): Nutzer | null {
  return getItem<Nutzer>(NUTZER_KEY)
}

export function merkeNutzer(n: Nutzer | null): void {
  if (n === null) removeItem(NUTZER_KEY)
  else setItem(NUTZER_KEY, n)
}

// Besteht auf dem Server noch eine Session? (Für Auto-Login nach Reload.)
export async function backendNutzer(): Promise<Nutzer | null> {
  try {
    const { ok, daten } = await anfrage<{ nutzer: Nutzer | null }>('me.php')
    return ok ? (daten.nutzer ?? null) : null
  } catch {
    return null
  }
}

export async function captchaHolen(): Promise<string | null> {
  try {
    const { ok, daten } = await anfrage<{ frage: string }>('captcha.php')
    return ok ? daten.frage : null
  } catch {
    return null
  }
}

export async function kontoLogin(
  email: string,
  passwort: string,
  captcha: string,
): Promise<{ nutzer?: Nutzer; zweiFa?: boolean; fehler?: string; captchaNeu?: string }> {
  try {
    const { ok, daten } = await anfrage<{
      nutzer?: Nutzer
      zwei_fa?: boolean
      fehler?: string
      captcha?: { frage: string }
    }>('login.php', { method: 'POST', body: JSON.stringify({ email, passwort, captcha }) })
    if (ok && daten.nutzer) return { nutzer: daten.nutzer }
    if (ok && daten.zwei_fa) return { zweiFa: true }
    return { fehler: daten.fehler ?? 'Anmeldung fehlgeschlagen', captchaNeu: daten.captcha?.frage }
  } catch {
    return { fehler: 'Kein Schulserver erreichbar — nutze den Zugangscode (Gast-Modus).' }
  }
}

export async function kontoLogout(): Promise<void> {
  try {
    await anfrage('logout.php', { method: 'POST' })
  } catch {
    /* offline ok */
  }
  merkeNutzer(null)
}

export async function fortschrittVomServer(): Promise<Record<string, unknown> | null> {
  try {
    const { ok, daten } = await anfrage<{ daten: Record<string, unknown> | null }>('fortschritt.php')
    return ok ? (daten.daten ?? null) : null
  } catch {
    return null
  }
}

export async function fortschrittZumServer(daten: Record<string, unknown>): Promise<boolean> {
  try {
    const { ok } = await anfrage('fortschritt.php', { method: 'PUT', body: JSON.stringify(daten) })
    return ok
  } catch {
    return false
  }
}
