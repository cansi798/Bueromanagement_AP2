// Aufgaben-Generatoren der Rechnen-Kachel: jede Funktion würfelt "glatte",
// prüfungstypische Werte und baut den Lösungsweg aus denselben Zwischen-
// werten auf, mit denen auch das Ergebnis berechnet wird.
import type { GenerierteAufgabe } from '../types'
import { formatiereZahl } from './zahl'

function zufall(min: number, max: number, schritt = 1): number {
  const stufen = Math.floor((max - min) / schritt)
  return min + Math.floor(Math.random() * (stufen + 1)) * schritt
}

function wahl<T>(liste: T[]): T {
  return liste[Math.floor(Math.random() * liste.length)]
}

const euro = (n: number) => `${formatiereZahl(n)} €`

function dreisatz(): GenerierteAufgabe {
  const artikel = wahl(['Ordner', 'Druckerpatronen', 'Kopierpapier-Pakete', 'USB-Sticks'])
  const menge1 = zufall(4, 12)
  const stueckpreis = zufall(2, 15) / 2 // 1,00–7,50 in 50-Cent-Schritten
  const preis1 = Math.round(menge1 * stueckpreis * 100) / 100
  const menge2 = zufall(15, 60, 5)
  const loesung = Math.round(menge2 * stueckpreis * 100) / 100
  return {
    text: `${menge1} ${artikel} kosten zusammen ${euro(preis1)}. Berechnen Sie den Preis für ${menge2} ${artikel} (gleicher Stückpreis)!`,
    loesungswert: loesung,
    einheit: '€',
    toleranz: 0.01,
    loesungsweg: [
      `1 Stück: ${euro(preis1)} ÷ ${menge1} = ${euro(stueckpreis)}`,
      `${menge2} Stück: ${euro(stueckpreis)} × ${menge2} = **${euro(loesung)}**`,
    ].join('\n\n'),
  }
}

function prozentrechnung(): GenerierteAufgabe {
  const variante = wahl(['prozentwert', 'prozentsatz', 'vermehrt'] as const)
  if (variante === 'prozentwert') {
    const grundwert = zufall(20_000, 300_000, 10_000)
    const satz = zufall(2, 15)
    const loesung = (grundwert * satz) / 100
    return {
      text: `Das Budget beträgt ${euro(grundwert)}. Berechnen Sie ${satz} % davon in Euro!`,
      loesungswert: loesung, einheit: '€', toleranz: 0.01,
      loesungsweg: `${euro(grundwert)} × ${satz} ÷ 100 = **${euro(loesung)}**`,
    }
  }
  if (variante === 'prozentsatz') {
    const alt = zufall(100_000, 200_000, 10_000)
    const erhoehung = zufall(10_000, 50_000, 10_000)
    const loesung = Math.round((erhoehung / alt) * 10_000) / 100
    return {
      text: `Das Budget wird von ${euro(alt)} um ${euro(erhoehung)} erhöht. Um wie viel Prozent steigt es?`,
      loesungswert: loesung, einheit: '%', toleranz: 0.01,
      loesungsweg: `${euro(erhoehung)} ÷ ${euro(alt)} × 100 = **${formatiereZahl(loesung)} %**`,
    }
  }
  const netto = zufall(200, 2_000, 50)
  const brutto = Math.round(netto * 1.19 * 100) / 100
  return {
    text: `Ein Bürostuhl kostet netto ${euro(netto)}. Berechnen Sie den Bruttopreis (19 % USt)!`,
    loesungswert: brutto, einheit: '€', toleranz: 0.01,
    loesungsweg: `${euro(netto)} × 1,19 = **${euro(brutto)}**`,
  }
}

function zinsrechnung(): GenerierteAufgabe {
  const kapital = zufall(10_000, 200_000, 10_000)
  const satz = zufall(4, 24, 1) / 4 // 1,00–6,00 % in 0,25er-Schritten
  const variante = wahl(['jahr', 'monate', 'tage'] as const)
  const tage = variante === 'jahr' ? 360 : variante === 'monate' ? zufall(3, 9) * 30 : zufall(30, 330, 30)
  const zeitText =
    variante === 'jahr' ? 'für 1 Jahr' : variante === 'monate' ? `für ${tage / 30} Monate` : `für ${tage} Tage`
  const loesung = Math.round(((kapital * satz * tage) / (100 * 360)) * 100) / 100
  return {
    text: `Ein Betrag von ${euro(kapital)} wird ${zeitText} zu ${formatiereZahl(satz)} % p. a. angelegt. Berechnen Sie die Zinsen (kaufmännisch, 30/360)!`,
    loesungswert: loesung, einheit: '€', toleranz: 0.01,
    loesungsweg: `Z = K × p × t ÷ (100 × 360) = ${euro(kapital)} × ${formatiereZahl(satz)} × ${tage} ÷ 36.000 = **${euro(loesung)}**`,
  }
}

export const GENERATOREN: Record<string, () => GenerierteAufgabe> = {
  dreisatz,
  prozentrechnung,
  zinsrechnung,
}
