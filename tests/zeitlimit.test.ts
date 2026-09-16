import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mitZeitlimit, neuerStillstandswaechter } from '../src/lib/zeitlimit'

// Schutz gegen "hängt für immer": Bewertungen und Modell-Downloads müssen
// nach Stillstand mit einer verständlichen Fehlermeldung abbrechen.
describe('mitZeitlimit', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('reicht das Ergebnis durch, wenn das Promise rechtzeitig fertig ist', async () => {
    const p = mitZeitlimit(Promise.resolve(42), 1000, 'zu langsam')
    await expect(p).resolves.toBe(42)
  })

  it('bricht mit der Meldung ab, wenn das Limit überschritten wird', async () => {
    const nie = new Promise(() => {})
    const p = mitZeitlimit(nie, 1000, 'Die KI-Bewertung hat zu lange gedauert.')
    const erwartung = expect(p).rejects.toThrow('Die KI-Bewertung hat zu lange gedauert.')
    await vi.advanceTimersByTimeAsync(1001)
    await erwartung
  })

  it('reicht Fehler des Promise unverändert durch', async () => {
    const p = mitZeitlimit(Promise.reject(new Error('GPU weg')), 1000, 'zu langsam')
    await expect(p).rejects.toThrow('GPU weg')
  })
})

describe('neuerStillstandswaechter', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('schlägt Alarm, wenn nie Fortschritt gemeldet wird', async () => {
    const w = neuerStillstandswaechter(1000, 'Download steht still.')
    const erwartung = expect(w.abgelaufen).rejects.toThrow('Download steht still.')
    await vi.advanceTimersByTimeAsync(1001)
    await erwartung
  })

  it('bleibt ruhig, solange regelmäßig Fortschritt gemeldet wird', async () => {
    const w = neuerStillstandswaechter(1000, 'Download steht still.')
    let alarm = false
    w.abgelaufen.catch(() => {
      alarm = true
    })
    for (let i = 0; i < 5; i++) {
      await vi.advanceTimersByTimeAsync(800)
      w.melden()
    }
    expect(alarm).toBe(false)
    w.fertig()
  })

  it('schlägt keinen Alarm mehr, wenn fertig() gerufen wurde', async () => {
    const w = neuerStillstandswaechter(1000, 'Download steht still.')
    let alarm = false
    w.abgelaufen.catch(() => {
      alarm = true
    })
    w.fertig()
    await vi.advanceTimersByTimeAsync(5000)
    expect(alarm).toBe(false)
  })
})
