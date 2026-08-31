import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { istFreigeschaltet, pruefeCode, schalteFrei } from '../lib/gate'
import { backendNutzer, captchaHolen, kontoLogin, merkeNutzer } from '../lib/api'
import { syncStart } from '../lib/sync'

type Modus = 'code' | 'konto'

export default function Gate({ children }: { children: ReactNode }) {
  const [offen, setOffen] = useState(istFreigeschaltet)
  const [modus, setModus] = useState<Modus>('code')
  const [eingabe, setEingabe] = useState('')
  const [fehler, setFehler] = useState('')
  // Konto-Modus
  const [email, setEmail] = useState('')
  const [passwort, setPasswort] = useState('')
  const [captchaFrage, setCaptchaFrage] = useState<string | null>(null)
  const [captchaAntwort, setCaptchaAntwort] = useState('')
  const [laedt, setLaedt] = useState(false)

  // PDF-Generierung: ?code=<Zugangscode> in der URL schaltet die Sitzung frei.
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get('code')
    if (param && !offen) {
      pruefeCode(param).then((ok) => ok && setOffen(true))
    }
    // Besteht schon eine Server-Session? → automatisch anmelden + Sync.
    if (!offen) {
      backendNutzer().then((n) => {
        if (n) {
          merkeNutzer(n)
          schalteFrei()
          syncStart()
          setOffen(true)
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (modus === 'konto' && captchaFrage === null) {
      captchaHolen().then((frage) =>
        setCaptchaFrage(frage ?? 'nicht-verfuegbar'),
      )
    }
  }, [modus, captchaFrage])

  if (offen) return <>{children}</>

  async function codeAbsenden(e: FormEvent) {
    e.preventDefault()
    if (await pruefeCode(eingabe.trim())) {
      schalteFrei()
      setOffen(true)
    } else {
      setFehler('Falscher Code – bitte erneut versuchen.')
    }
  }

  async function kontoAbsenden(e: FormEvent) {
    e.preventDefault()
    setLaedt(true)
    setFehler('')
    const r = await kontoLogin(email.trim(), passwort, captchaAntwort.trim())
    setLaedt(false)
    if (r.nutzer) {
      merkeNutzer(r.nutzer)
      schalteFrei()
      await syncStart()
      setOffen(true)
      return
    }
    if (r.zweiFa) {
      setFehler('Admin-Konto erkannt: Bitte melde dich im Admin-Panel (server/admin.html) mit dem E-Mail-Code an.')
      return
    }
    setFehler(r.fehler ?? 'Anmeldung fehlgeschlagen')
    setCaptchaAntwort('')
    setCaptchaFrage(r.captchaNeu ?? null) // null ⇒ neu laden
  }

  const backendDa = captchaFrage !== null && captchaFrage !== 'nicht-verfuegbar'

  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h1 className="text-xl font-bold text-slate-900">KBM Prüfungscoach</h1>

        <div className="mt-4 flex rounded-xl bg-slate-100 p-1 text-sm font-semibold">
          {(
            [
              ['code', '🔑 Zugangscode'],
              ['konto', '👤 Mein Konto'],
            ] as [Modus, string][]
          ).map(([m, label]) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setModus(m)
                setFehler('')
              }}
              className={`min-h-10 flex-1 rounded-lg transition ${
                modus === m ? 'bg-white text-slate-900 shadow' : 'text-slate-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {modus === 'code' ? (
          <form onSubmit={codeAbsenden}>
            <p className="mt-3 text-sm text-slate-600">
              Gast-Modus: Fortschritt wird nur auf diesem Gerät gespeichert.
            </p>
            <input
              type="password"
              value={eingabe}
              onChange={(e) => {
                setEingabe(e.target.value)
                setFehler('')
              }}
              placeholder="Zugangscode aus dem Unterricht"
              autoFocus
              className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-3 text-base focus:border-sky-500 focus:outline-none"
            />
            {fehler && <p className="mt-2 text-sm text-red-600">{fehler}</p>}
            <button
              type="submit"
              className="mt-4 min-h-12 w-full rounded-lg bg-sky-600 px-4 font-semibold text-white hover:bg-sky-700 active:bg-sky-800"
            >
              Loslegen
            </button>
          </form>
        ) : (
          <form onSubmit={kontoAbsenden}>
            <p className="mt-3 text-sm text-slate-600">
              Mit Schul-Konto: Dein Fortschritt wird auf jedem Gerät synchronisiert.
            </p>
            {captchaFrage === 'nicht-verfuegbar' ? (
              <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                Auf dieser Installation gibt es keinen Konto-Server — nutze den
                Zugangscode (Gast-Modus).
              </p>
            ) : (
              <>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="E-Mail"
                  className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-3 text-base focus:border-sky-500 focus:outline-none"
                />
                <input
                  type="password"
                  value={passwort}
                  onChange={(e) => setPasswort(e.target.value)}
                  placeholder="Passwort"
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3 text-base focus:border-sky-500 focus:outline-none"
                />
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm text-slate-600">
                    🤖 {captchaFrage ?? '…'} =
                  </span>
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
                  onClick={async () => {
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
                  }}
                  className="mt-2 block w-full text-center text-xs text-slate-400 underline"
                >
                  Passwort vergessen?
                </button>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  )
}
