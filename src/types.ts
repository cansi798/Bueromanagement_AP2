export type BereichId = 'wiso' | 'kbz' | 'buchfuehrung' | 'muendlich'

export interface MedienSlot {
  titel: string
  url?: string
  status: 'geplant' | 'vorhanden'
}

export interface Medien {
  video?: MedienSlot
  podcast?: MedienSlot
}

export interface Bereich {
  id: BereichId
  name: string
  kurz: string
  beschreibung: string
  farbe: string // Tailwind-Farbstamm, z. B. "sky"
  hatStufen: boolean // false nur für 'muendlich'
}

export interface Thema {
  id: string
  bereich: BereichId
  name: string
  beschreibung: string
  haeufigkeit: string[] // Termin-IDs, z. B. "2024-sommer"
  lernzettel: string // Markdown
  eselsbruecken: string[]
  selbstcheck: string[] // kurze Fragen für Stufe 1
  medien?: Medien
}

export type AufgabenQuelle = 'original' | 'abgeleitet' | 'generiert'
export type AufgabenTyp = 'mc' | 'offen' | 'rechnen' | 'zuordnung'

// Ziffern-Zuordnung wie auf dem IHK-Antwortbogen: zu jeder Teilaufgabe (item)
// wird die Nummer aus der Legende (ziffern) eingetragen.
export interface ZuordnungZiffer {
  nr: number
  text: string
}

export interface ZuordnungItem {
  label: string // "a", "b", …
  text: string
  korrekt: number // nr aus der Legende
}

export interface Zuordnung {
  ziffern: ZuordnungZiffer[]
  items: ZuordnungItem[]
}

export interface DiagrammPunkt {
  x: string
  y: number
}

// Organigramm-Knoten; `unter` verweist auf die id des Vorgesetzten,
// `stab` hängt den Knoten seitlich als Stabstelle an.
export interface DiagrammKnoten {
  id: string
  text: string
  unter?: string
  stab?: boolean
}

// Einzelzeichen für Schilder-/Symbol-Aufgaben (Sicherheitszeichen, EPK-Operatoren).
export interface DiagrammZeichen {
  nr: string
  form: 'kreis' | 'dreieck' | 'quadrat' | 'rechteck' | 'raute' | 'sechseck'
  farbe?: 'gruen' | 'rot' | 'gelb' | 'blau' | 'grau' | 'weiss'
  innen?: string
  text?: string
}

// Wirtschaftskreislauf-Skizze: Ströme zwischen linker und rechter Box.
export interface KreislaufVariante {
  name: string
  stroeme: { text: string; richtung: 'links' | 'rechts' }[]
}

export interface AnlagenDiagramm {
  typ: 'linie' | 'balken' | 'kreis' | 'organigramm' | 'schilder' | 'kreislauf'
  titel: string
  xAchse?: string
  yAchse?: string
  einheit?: string
  quelle?: string
  serien?: { name: string; punkte: DiagrammPunkt[] }[]
  knoten?: DiagrammKnoten[]
  zeichen?: DiagrammZeichen[]
  varianten?: KreislaufVariante[]
  linksBox?: string
  rechtsBox?: string
}

export interface Aufgabe {
  id: string
  themaId: string
  bereich: BereichId
  quelle: AufgabenQuelle
  termin?: string
  typ: AufgabenTyp
  text: string
  anlagenText?: string
  anlagenDiagramm?: AnlagenDiagramm
  punkte?: number
  optionen?: string[] // nur typ 'mc'
  korrekt?: number[] // nur typ 'mc'
  zuordnung?: Zuordnung // nur typ 'zuordnung'
  loesung: string
  erklaerung?: string
}

export interface Pruefung {
  termin: string
  bereich: BereichId
  name: string
  zeitMinuten: number
  punkteGesamt: number
  aufgabenIds: string[]
}

export interface Karteikarte {
  id: string
  themaId: string
  bereich: BereichId
  vorderseite: string
  rueckseite: string
}

// Lernfrage für das Themen-Quiz (Leitner-gestützt) — MC oder Ziffern-Zuordnung.
export interface Lernpaar {
  id: string
  themaId: string
  bereich: BereichId
  typ?: 'mc' | 'zuordnung' // fehlt = 'mc'
  frage: string
  optionen?: string[] // nur mc
  korrekt?: number[] // nur mc
  zuordnung?: Zuordnung // nur zuordnung
  erklaerung: string
  schwierigkeit?: 1 | 2 | 3
  quellTermin?: string
}

export interface GlossarEintrag {
  begriff: string
  definition: string
  bereiche: BereichId[]
}

// Nachschlage-Formel für die Kachel „Begriffe & Formeln" (KaTeX-Markdown).
export interface FormelEintrag {
  id: string
  titel: string
  formel: string
  erklaerung?: string
  bereiche: BereichId[]
  kategorie: string
}

// Kachel „Kaufmännisches Rechnen": feste Übungsaufgabe mit Zahleneingabe.
export interface RechnenAufgabeFest {
  id: string
  text: string // Markdown (GFM-Tabellen für Markttabellen erlaubt)
  loesungswert: number
  einheit: string // "€" | "%" | "Stück" | "kWh" | "" …
  toleranz: number // absoluter Betrag; 0 = nur exakt
  loesungsweg: string // Markdown, Schritt für Schritt
  quelle?: { sammlung: number; aufgabe: string } // nur Original-Prüfungsaufgaben
}

export interface RechnenKapitel {
  id: string
  gruppe: 'grundlagen' | 'pruefung'
  titel: string
  kurz: string
  erklaerung: string // Markdown mit KaTeX
  aufgaben: RechnenAufgabeFest[]
}

// Vom Generator gelieferte Übungsaufgabe (gleiche Wertung wie feste Aufgaben).
export interface GenerierteAufgabe {
  text: string
  loesungswert: number
  einheit: string
  toleranz: number
  loesungsweg: string
}
