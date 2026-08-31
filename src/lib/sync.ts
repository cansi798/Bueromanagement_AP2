// Fortschritts-Sync mit dem Schulserver: localStorage bleibt die schnelle
// Wahrheit im Browser; bei Konto-Login wird der Server-Stand geladen und
// jede Änderung debounced zurückgeschrieben.
import { abonniereStorage, getItem, setItem } from './storage'
import { fortschrittVomServer, fortschrittZumServer } from './api'

// Diese Schlüssel gehören NICHT zum Lernfortschritt.
const AUSGENOMMEN = new Set(['kbm.v1.gate', 'kbm.v1.nutzer'])

let aktiv = false
let timer: ReturnType<typeof setTimeout> | null = null

function sammleAlles(): Record<string, unknown> {
  const daten: Record<string, unknown> = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key || !key.startsWith('kbm.v1.') || AUSGENOMMEN.has(key)) continue
    daten[key] = getItem(key)
  }
  return daten
}

async function hochladen(): Promise<void> {
  if (!aktiv) return
  await fortschrittZumServer(sammleAlles())
}

// Beim Login: Server-Stand übernehmen (Server gewinnt); ist der Server noch
// leer, wird der lokale Stand hochgeladen (Erst-Login rettet Gast-Fortschritt).
export async function syncStart(): Promise<void> {
  const server = await fortschrittVomServer()
  if (server && Object.keys(server).length > 0) {
    for (const [key, wert] of Object.entries(server)) {
      if (key.startsWith('kbm.v1.') && !AUSGENOMMEN.has(key)) setItem(key, wert)
    }
  } else {
    await fortschrittZumServer(sammleAlles())
  }
  aktiv = true
}

export function syncStop(): void {
  aktiv = false
  if (timer) clearTimeout(timer)
}

abonniereStorage((key) => {
  if (!aktiv || AUSGENOMMEN.has(key)) return
  if (timer) clearTimeout(timer)
  timer = setTimeout(hochladen, 2500)
})

// Beim Verlassen der Seite letzten Stand sichern (Best Effort).
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (aktiv && timer) {
      clearTimeout(timer)
      // sendBeacon geht nicht mit PUT — bewusst fetch mit keepalive:
      fortschrittZumServer(sammleAlles())
    }
  })
}
