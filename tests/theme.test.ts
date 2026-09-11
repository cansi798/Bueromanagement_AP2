import { beforeEach, describe, expect, it, vi } from 'vitest'

// Minimal DOM/Browser-Mock für node-Umgebung
const classList = new Set<string>()
const documentMock = {
  documentElement: {
    classList: {
      toggle: (cls: string, force?: boolean) => {
        if (force === true) classList.add(cls)
        else if (force === false) classList.delete(cls)
        else classList.has(cls) ? classList.delete(cls) : classList.add(cls)
      },
      remove: (cls: string) => classList.delete(cls),
      contains: (cls: string) => classList.has(cls),
    },
  },
}

// Stub localStorage
const store: Record<string, string> = {}
const localStorageMock = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v },
  removeItem: (k: string) => { delete store[k] },
  clear: () => { for (const k of Object.keys(store)) delete store[k] },
}

// matchMedia: matches=false (simuliert helles System-Theme)
const matchMediaMock = (q: string) => ({
  matches: false,
  media: q,
  addEventListener() {},
  removeEventListener() {},
})

vi.stubGlobal('document', documentMock)
vi.stubGlobal('localStorage', localStorageMock)
vi.stubGlobal('window', { matchMedia: matchMediaMock, localStorage: localStorageMock })

import { ladeTheme, speichereTheme, wendeThemeAn } from '../src/lib/theme'

beforeEach(() => {
  localStorageMock.clear()
  classList.clear()
})

describe('theme', () => {
  it('Default ist system', () => expect(ladeTheme()).toBe('system'))

  it('speichereTheme persistiert und wendet an', () => {
    speichereTheme('dunkel')
    expect(ladeTheme()).toBe('dunkel')
    expect(documentMock.documentElement.classList.contains('dark')).toBe(true)
    speichereTheme('hell')
    expect(documentMock.documentElement.classList.contains('dark')).toBe(false)
  })

  it('wendeThemeAn("system") folgt prefers-color-scheme', () => {
    // matchMedia liefert matches=false → hell.
    wendeThemeAn('system')
    expect(documentMock.documentElement.classList.contains('dark')).toBe(false)
  })
})
