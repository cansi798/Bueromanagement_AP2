import { describe, expect, it } from 'vitest'
import { ladeQuizModus, speichereQuizModus } from '../src/lib/quizmodus'

// Mock localStorage für Node-Tests
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()
globalThis.localStorage = localStorageMock as any

describe('quizmodus', () => {
  it('Default ist auswahl', () => {
    localStorage.clear()
    expect(ladeQuizModus()).toBe('auswahl')
  })
  it('speichert und lädt freitext', () => {
    speichereQuizModus('freitext')
    expect(ladeQuizModus()).toBe('freitext')
  })
  it('kaputte Werte fallen auf auswahl zurück', () => {
    localStorage.setItem('kbm.v1.quizmodus', JSON.stringify('quatsch'))
    expect(ladeQuizModus()).toBe('auswahl')
  })
})
