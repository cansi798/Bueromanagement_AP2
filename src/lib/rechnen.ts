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
  const stueckpreis = zufall(100, 750, 50) / 100 // 1,00–7,50 € in 50-Cent-Schritten
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
    const satz = zufall(5, 40, 5) // glatte Prozentsätze: 5%, 10%, 15%, …, 40%
    const erhoehung = Math.round((alt * satz) / 100)
    const loesung = satz
    return {
      text: `Das Budget wird von ${euro(alt)} um ${euro(erhoehung)} erhöht. Um wie viel Prozent steigt es?`,
      loesungswert: loesung, einheit: '%', toleranz: 0.01,
      loesungsweg: `Erhöhung ÷ Ausgangswert × 100 = ${formatiereZahl(erhoehung, 0)} ÷ ${formatiereZahl(alt, 0)} × 100 = **${formatiereZahl(loesung)} %**`,
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

function kgGewinnverteilung(): GenerierteAufgabe {
  const komplementaerin = zufall(400_000, 900_000, 10_000)
  const kommanditist1 = zufall(200_000, 500_000, 10_000)
  const kommanditist2 = zufall(100_000, 400_000, 10_000)
  const summe = komplementaerin + kommanditist1 + kommanditist2
  const verzinsung = summe * 0.04
  const gewinn = zufall(Math.ceil((verzinsung + 100_000) / 10_000), 200, 1) * 10_000
  const rest = gewinn - verzinsung
  const frage = wahl(['rest', 'verzinsungK1'] as const)
  const tabelle = [
    `| Gesellschafter | Einlage |`, `| --- | --- |`,
    `| Komplementärin | ${euro(komplementaerin)} |`,
    `| Kommanditist 1 | ${euro(kommanditist1)} |`,
    `| Kommanditist 2 | ${euro(kommanditist2)} |`,
  ].join('\n')
  if (frage === 'verzinsungK1') {
    const loesung = kommanditist1 * 0.04
    return {
      text: `Eine KG erwirtschaftet ${euro(gewinn)} Gewinn. Laut Vertrag erhält jeder Gesellschafter zunächst 4 % auf seine Einlage.\n\n${tabelle}\n\nBerechnen Sie die Kapitalverzinsung für Kommanditist 1 in Euro!`,
      loesungswert: loesung, einheit: '€', toleranz: 0.01,
      loesungsweg: `${euro(kommanditist1)} × 4 ÷ 100 = **${euro(loesung)}**`,
    }
  }
  return {
    text: `Eine KG erwirtschaftet ${euro(gewinn)} Gewinn. Laut Vertrag erhält jeder Gesellschafter zunächst 4 % auf seine Einlage; der Rest wird nach Vertrag verteilt.\n\n${tabelle}\n\nBerechnen Sie den verbleibenden Restgewinn in Euro!`,
    loesungswert: rest, einheit: '€', toleranz: 0.01,
    loesungsweg: [
      `Einlagen gesamt: ${euro(summe)}`,
      `4 % Verzinsung: ${euro(summe)} × 0,04 = ${euro(verzinsung)}`,
      `Restgewinn: ${euro(gewinn)} − ${euro(verzinsung)} = **${euro(rest)}**`,
    ].join('\n\n'),
  }
}

function gleichgewichtspreisUmsatz(): GenerierteAufgabe {
  const preise = [1_200, 1_400, 1_600, 1_800, 2_000]
  const ggIndex = zufall(1, 3)
  const menge = zufall(2_000, 5_000, 500)
  // Nachfrage fällt, Angebot steigt — am GG-Index sind beide gleich.
  const nachfrage = preise.map((_, i) => menge + (ggIndex - i) * zufall(400, 800, 100))
  const angebot = preise.map((_, i) => menge - (ggIndex - i) * zufall(400, 800, 100))
  nachfrage[ggIndex] = menge
  angebot[ggIndex] = menge
  const ggPreis = preise[ggIndex]
  const umsatz = ggPreis * menge
  const zeilen = preise.map((p, i) => `| ${euro(p)} | ${formatiereZahl(nachfrage[i], 0)} | ${formatiereZahl(angebot[i], 0)} |`)
  return {
    text: `Für einen Bürostuhl liegen Marktforschungszahlen vor:\n\n| Preis | Nachfrage (Stück) | Angebot (Stück) |\n| --- | --- | --- |\n${zeilen.join('\n')}\n\nBerechnen Sie den Umsatz in Euro, der beim Gleichgewichtspreis erzielt wird!`,
    loesungswert: umsatz, einheit: '€', toleranz: 0.01,
    loesungsweg: [
      `Gleichgewichtspreis: Nachfrage = Angebot bei ${euro(ggPreis)} (${formatiereZahl(menge, 0)} Stück).`,
      `Umsatz = Preis × Menge = ${euro(ggPreis)} × ${formatiereZahl(menge, 0)} = **${euro(umsatz)}**`,
    ].join('\n\n'),
  }
}

function darlehen(): GenerierteAufgabe {
  const betrag = zufall(200_000, 2_000_000, 100_000)
  const satz = zufall(8, 24, 1) / 4 // 2,00–6,00 %
  const jahre = zufall(4, 10)
  const variante = wahl(['faelligkeit', 'tilgung'] as const)
  if (variante === 'faelligkeit') {
    const zinsenGesamt = Math.round(betrag * (satz / 100) * jahre * 100) / 100
    return {
      text: `Ein Fälligkeitsdarlehen über ${euro(betrag)} läuft ${jahre} Jahre bei ${formatiereZahl(satz)} % p. a. (Tilgung komplett am Ende). Berechnen Sie die gesamten Zinszahlungen über die Laufzeit!`,
      loesungswert: zinsenGesamt, einheit: '€', toleranz: 0.01,
      loesungsweg: [
        `Zinsen pro Jahr: ${euro(betrag)} × ${formatiereZahl(satz)} ÷ 100 = ${euro((betrag * satz) / 100)}`,
        `Gesamt: × ${jahre} Jahre = **${euro(zinsenGesamt)}**`,
      ].join('\n\n'),
    }
  }
  const tilgung = betrag / jahre
  const jahrN = zufall(2, jahre)
  const restschuld = betrag - tilgung * (jahrN - 1)
  const zinsenJahrN = Math.round(restschuld * (satz / 100) * 100) / 100
  return {
    text: `Ein Tilgungsdarlehen über ${euro(betrag)} wird in ${jahre} gleichen Jahresraten getilgt (Zinssatz ${formatiereZahl(satz)} % p. a. auf die Restschuld). Berechnen Sie die Zinsen im ${jahrN}. Jahr!`,
    loesungswert: zinsenJahrN, einheit: '€', toleranz: 0.01,
    loesungsweg: [
      `Jährliche Tilgung: ${euro(betrag)} ÷ ${jahre} = ${euro(tilgung)}`,
      `Restschuld zu Beginn von Jahr ${jahrN}: ${euro(betrag)} − ${jahrN - 1} × ${euro(tilgung)} = ${euro(restschuld)}`,
      `Zinsen: ${euro(restschuld)} × ${formatiereZahl(satz)} ÷ 100 = **${euro(zinsenJahrN)}**`,
    ].join('\n\n'),
  }
}

export const GENERATOREN: Record<string, () => GenerierteAufgabe> = {
  dreisatz,
  prozentrechnung,
  zinsrechnung,
  'kg-gewinnverteilung': kgGewinnverteilung,
  'gleichgewichtspreis-umsatz': gleichgewichtspreisUmsatz,
  darlehen,
}
