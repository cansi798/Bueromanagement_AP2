import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState, type ReactNode } from 'react'
import { angemeldeterNutzer, kontoLogout } from '../lib/api'
import { abonniereStorage } from '../lib/storage'
import { syncStop } from '../lib/sync'

const NAV = [
  { pfad: '/', label: 'Start', icon: '🏠' },
  { pfad: '/lernstand', label: 'Lernstand', icon: '📊' },
  { pfad: '/suche', label: 'Suche', icon: '🔎' },
  { pfad: '/glossar', label: 'Glossar', icon: '📖' },
]

export default function Layout({ children, titel }: { children: ReactNode; titel?: string }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [nutzer, setNutzer] = useState(angemeldeterNutzer)
  useEffect(
    () =>
      abonniereStorage((key) => {
        if (key === 'kbm.v1.nutzer') setNutzer(angemeldeterNutzer())
      }),
    [],
  )

  return (
    <div className="min-h-dvh bg-slate-100 pb-20 md:pb-8">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            {pathname !== '/' && (
              <button
                type="button"
                onClick={() => navigate(-1)}
                aria-label="Zurück"
                className="-ml-2 min-h-11 min-w-11 rounded-lg px-2 text-xl leading-none text-slate-500 hover:bg-slate-100"
              >
                ←
              </button>
            )}
            <Link to="/" className="text-lg font-bold text-slate-900">
              KBM <span className="text-sky-600">Prüfungscoach</span>
            </Link>
          </div>
          <div className="flex items-center gap-1">
            {nutzer && (
              <button
                type="button"
                onClick={async () => {
                  syncStop()
                  await kontoLogout()
                  localStorage.removeItem('kbm.v1.gate')
                  location.reload()
                }}
                title={`Angemeldet: ${nutzer.name || nutzer.email} — klicken zum Abmelden`}
                className="mr-1 max-w-36 truncate rounded-lg bg-sky-50 px-2.5 py-1.5 text-xs font-semibold text-sky-800 hover:bg-sky-100"
              >
                👤 {nutzer.name || nutzer.email} ↪
              </button>
            )}
          <nav className="hidden gap-1 md:flex">
            {NAV.map((n) => (
              <Link
                key={n.pfad}
                to={n.pfad}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  pathname === n.pfad
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {titel && <h1 className="mb-4 text-2xl font-bold text-slate-900">{titel}</h1>}
        {children}
      </main>

      {/* Mobile Bottom-Navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-slate-200 bg-white md:hidden print:hidden">
        {NAV.map((n) => (
          <Link
            key={n.pfad}
            to={n.pfad}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs ${
              pathname === n.pfad ? 'font-semibold text-sky-600' : 'text-slate-500'
            }`}
          >
            <span className="text-lg leading-none">{n.icon}</span>
            {n.label}
          </Link>
        ))}
      </nav>
    </div>
  )
}
