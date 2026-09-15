// Erkennt Gesetzesverweise (§ 433 BGB, Art. 14 GG …) und macht daraus
// Markdown-Links auf gesetze-im-internet.de (amtliche Volltexte).
// Nur bekannte Kürzel werden verlinkt — alles andere bleibt unverändert.

// Kürzel → URL-Slug auf gesetze-im-internet.de (einige Gesetze tragen dort
// Jahres-Suffixe im Pfad; NICHT "vereinfachen").
const GESETZE: Record<string, string> = {
  BGB: 'bgb',
  HGB: 'hgb',
  GG: 'gg',
  KSchG: 'kschg',
  BUrlG: 'burlg',
  BBiG: 'bbig_2005',
  ArbZG: 'arbzg',
  JArbSchG: 'jarbschg',
  MuSchG: 'muschg_2018',
  BetrVG: 'betrvg',
  EntgFG: 'entgfg',
  TzBfG: 'tzbfg',
  UStG: 'ustg_1980',
  GewO: 'gewo',
  ProdHaftG: 'prodhaftg',
  UWG: 'uwg_2004',
  EStG: 'estg',
  AO: 'ao_1977',
}

const KUERZEL = Object.keys(GESETZE).join('|')

// § 433 / §433 / §§ 433 ff. / § 622 Abs. 2 Satz 1 — Nummer + optionale Zusätze,
// dahinter zwingend ein bekanntes Kürzel.
const PARAGRAPH = new RegExp(
  `§§?\\s?(\\d+[a-z]?)((?:\\s(?:Abs\\.\\s?\\d+|Satz\\s?\\d+|S\\.\\s?\\d+|Nr\\.\\s?\\d+|ff?\\.))*)\\s(${KUERZEL})\\b`,
  'g',
)
const ARTIKEL = /Art\.\s?(\d+[a-z]?)((?:\s(?:Abs\.\s?\d+|Satz\s?\d+))*)\sGG\b/g

function verlinkeSegment(text: string): string {
  return text
    .replace(PARAGRAPH, (treffer, nr: string, _zusatz: string, kuerzel: string, pos: number, ganz: string) => {
      // Bereits verlinkte Vorkommen ([…](…)) nicht erneut anfassen.
      if (ganz[pos - 1] === '[') return treffer
      return `[${treffer}](https://www.gesetze-im-internet.de/${GESETZE[kuerzel]}/__${nr}.html)`
    })
    .replace(ARTIKEL, (treffer, nr: string, _zusatz: string, pos: number, ganz: string) => {
      if (ganz[pos - 1] === '[') return treffer
      return `[${treffer}](https://www.gesetze-im-internet.de/gg/art_${nr}.html)`
    })
}

export function verlinkeParagraphen(text: string): string {
  // Codeblöcke (```…```) und Inline-Code (`…`) unangetastet lassen:
  // Text an Code-Grenzen zerlegen, nur die Nicht-Code-Teile ersetzen.
  return text
    .split(/(```[\s\S]*?```|`[^`]*`)/)
    .map((teil, i) => (i % 2 === 1 ? teil : verlinkeSegment(teil)))
    .join('')
}
