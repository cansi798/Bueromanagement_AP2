import { useEffect, useState, type FormEvent } from 'react'
import { captchaHolen, kontoLogin, merkeNutzer } from '../lib/api'
import { syncStart } from '../lib/sync'
import { schalteFrei } from '../lib/gate'

// Wiederverwendbares Konto-Login-Formular (Gate-Tab UND Anmelden-Seite).
// Meldet an, startet den Fortschritts-Sync und ruft danach onErfolg().
export default function KontoLoginForm({ onErfolg }: { onErfolg: () => void }) {
  const [email, setEmail] = useState('')
  const [passwort, setPasswort] = useState('')
  const [captchaFrage, setCaptchaFrage] = useState<string | null>(null)
  const [captchaAntwort, setCaptchaAntwort] = useState('')
  const [fehler, setFehler] = useState('')
  const [laedt, setLaedt] = useState(false)

  useEffect(() => {
    if (captchaFrage === null) {
      captchaHolen().then((frage) => setCaptchaFrage(frage ?? 'nicht-verfuegbar'))
    }
  }, [captchaFrage])

  async function absenden(e: FormEvent) {
    e.preventDefault()
    setLaedt(true)
    setFehler('')
    const r = await kontoLogin(email.trim(), passwort, captchaAntwort.trim())
    setLaedt(false)
    if (r.nutzer) {
      merkeNutzer(r.nutzer)
      schalteFrei()
      await syncStart()
      onErfolg()
      return
    }
    if (r.zweiFa) {
      setFehler('Admin-Konto erkannt: Bitte melde dich im Admin-Panel (server/admin.html) mit dem E-Mail-Code an.')
      return
    }
    setFehler(r.fehler ?? 'Anmeldung fehlgeschlagen')
    setCaptchaAntwort('')
    setCaptchaFrage(r.captchaNeu ?? null)
  }

  async function resetAnfordern() {
    if (!email.trim() || !captchaAntwort.trim()) {
      setFehler('Für den Reset: E-Mail eintragen und die Rechenaufgabe lösen, dann hier klicken.')
      return
    }
    try {
      const res = await fetch('./server/api/passwort-vergessen.php', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), captcha: captchaAntwort.trim() }),
      })
      const d = await res.json()
      setFehler(res.ok ? '📧 Wenn die E-Mail existiert, ist der Reset-Link unterwegs.' : (d.fehler ?? 'Fehler'))
      setCaptchaAntwort('')
      setCaptchaFrage(d.captcha?.frage ?? null)
    } catch {
      setFehler('Server nicht erreichbar.')
    }
  }

  if (captchaFrage === 'nicht-verfuegbar') {
    return (
      <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
        Auf dieser Installation gibt es keinen Konto-Server — nutze den Zugangscode
        (Gast-Modus).
      </p>
    )
  }

  return (
    <form onSubmit={absenden}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="E-Mail"
        autoComplete="username"
        className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-3 text-base focus:border-sky-500 focus:outline-none"
      />
      <input
        type="password"
        value={passwort}
        onChange={(e) => setPasswort(e.target.value)}
        placeholder="Passwort"
        autoComplete="current-password"
        className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3 text-base focus:border-sky-500 focus:outline-none"
      />
      <div className="mt-2 flex items-center gap-2">
        <span className="text-sm text-slate-600">🤖 {captchaFrage ?? '…'} =</span>
        <input
          inputMode="numeric"
          value={captchaAntwort}
          onChange={(e) => setCaptchaAntwort(e.target.value)}
          placeholder="Ergebnis"
          className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-base focus:border-sky-500 focus:outline-none"
        />
      </div>
      {fehler && <p className="mt-2 text-sm text-red-600">{fehler}</p>}
      <button
        type="submit"
        disabled={laedt}
        className="mt-4 min-h-12 w-full rounded-lg bg-sky-600 px-4 font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
      >
        {laedt ? 'Anmelden …' : 'Anmelden'}
      </button>
      <button
        type="button"
        onClick={resetAnfordern}
        className="mt-2 block w-full text-center text-xs text-slate-400 underline"
      >
        Passwort vergessen?
      </button>
    </form>
  )
}
