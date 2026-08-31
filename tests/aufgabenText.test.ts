import { describe, it, expect } from 'vitest'
import { zerlegeAufgabenText, zerlegeZuordnungsOption } from '../src/lib/aufgabenText'

describe('zerlegeAufgabenText', () => {
  it('zieht fette Original-Nummern heraus', () => {
    expect(zerlegeAufgabenText('**Aufgabe 1.1** — Sie sind tätig …')).toEqual({
      nr: '1.1',
      text: 'Sie sind tätig …',
    })
  })
  it('zieht schlichte Nummern heraus', () => {
    expect(zerlegeAufgabenText('Aufgabe 4.12: Berechnen Sie …').nr).toBe('4.12')
  })
  it('lässt Texte ohne Nummer unverändert', () => {
    expect(zerlegeAufgabenText('Berechnen Sie den Break-even.')).toEqual({
      nr: null,
      text: 'Berechnen Sie den Break-even.',
    })
  })
})

describe('zerlegeZuordnungsOption', () => {
  it('erkennt Zuordnungsketten', () => {
    expect(zerlegeZuordnungsOption('a) 2, b) 1, c) 3')).toEqual(['a) 2', 'b) 1', 'c) 3'])
  })
  it('lehnt normale Optionen ab', () => {
    expect(zerlegeZuordnungsOption('Der Vertrag ist nichtig, weil …')).toBeNull()
    expect(zerlegeZuordnungsOption('a) nur ein Teil')).toBeNull()
  })
})
