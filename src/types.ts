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
export type AufgabenTyp = 'mc' | 'offen' | 'rechnen'

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

// MC-Lernfrage für das Themen-Quiz (Leitner-gestützt).
export interface Lernpaar {
  id: string
  themaId: string
  bereich: BereichId
  frage: string
  optionen: string[]
  korrekt: number[]
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
