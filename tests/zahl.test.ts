import { describe, expect, it } from 'vitest'
import { bewerteEingabe, formatiereZahl, parseDeutscheZahl } from '../src/lib/zahl'

describe('parseDeutscheZahl', () => {
  it.each([
    ['1.234,56', 1234.56],
    ['1234,56', 1234.56],
    ['1234.56', 1234.56], // Fallback: Punkt als Dezimaltrenner (1-2 Nachkommastellen)
    ['1.234.500', 1234500], // reine Tausenderpunkte
    [' 420000 ', 420000],
    ['420.000,00 €', 420000], // Einheit wird ignoriert
    ['12,5 %', 12.5],
    ['-3,5', -3.5],
  ])('liest "%s" als %d', (eingabe, erwartet) => {
    expect(parseDeutscheZahl(eingabe)).toBe(erwartet)
  })

  it.each([[''], ['   '], ['abc'], ['1,2,3'], ['1..2']])('lehnt "%s" ab', (eingabe) => {
    expect(parseDeutscheZahl(eingabe)).toBeNull()
  })
})

describe('formatiereZahl', () => {
  it('formatiert de-DE mit 2 Nachkommastellen', () => {
    expect(formatiereZahl(1234.5)).toBe('1.234,50')
  })
  it('formatiert ohne Nachkommastellen auf Wunsch', () => {
    expect(formatiereZahl(420000, 0)).toBe('420.000')
  })
})

describe('bewerteEingabe', () => {
  it('leer → leer, Buchstaben → ungueltig', () => {
    expect(bewerteEingabe('', 100, 0)).toBe('leer')
    expect(bewerteEingabe('abc', 100, 0)).toBe('ungueltig')
  })
  it('innerhalb der Toleranz → richtig', () => {
    expect(bewerteEingabe('420.000,00', 420000, 0.01)).toBe('richtig')
    expect(bewerteEingabe('1,26', 1.25, 0.01)).toBe('richtig')
  })
  it('knapp daneben (≤ 10×Toleranz) → knapp', () => {
    expect(bewerteEingabe('1,30', 1.25, 0.01)).toBe('knapp')
  })
  it('Toleranz 0: knapp = innerhalb 1 % des Lösungswerts', () => {
    expect(bewerteEingabe('101', 100, 0)).toBe('knapp')
    expect(bewerteEingabe('100', 100, 0)).toBe('richtig')
  })
  it('weit daneben → falsch', () => {
    expect(bewerteEingabe('999', 100, 0.01)).toBe('falsch')
  })
})
