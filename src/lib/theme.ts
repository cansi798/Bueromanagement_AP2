// Hell/Dunkel/System-Theme: .dark-Klasse auf <html>, Persistenz in kbm.v1.theme.
import { getItem, setItem } from './storage'

const KEY = 'kbm.v1.theme'

export type Theme = 'hell' | 'dunkel' | 'system'

export function ladeTheme(): Theme {
  const t = getItem<Theme>(KEY)
  return t === 'hell' || t === 'dunkel' ? t : 'system'
}

function systemDunkel(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-color-scheme: dark)').matches
}

export function wendeThemeAn(t: Theme): void {
  const dunkel = t === 'dunkel' || (t === 'system' && systemDunkel())
  document.documentElement.classList.toggle('dark', dunkel)
}

export function speichereTheme(t: Theme): void {
  setItem(KEY, t)
  wendeThemeAn(t)
}

export function themeInitialisieren(): void {
  wendeThemeAn(ladeTheme())
  window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', () => {
    if (ladeTheme() === 'system') wendeThemeAn('system')
  })
}
