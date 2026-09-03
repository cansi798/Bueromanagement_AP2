// Einmalskript (2026-09): ergänzt die WiSo-Lernzettel um die im
// Prüfungsabgleich gefundenen Lückenthemen (Sozialversicherung, Kündigungs-
// schutz, Tarif/Betriebsrat, EZB/Geldpolitik, Rechtsformen-Überblick,
// Kaufvertragsstörungen). Idempotent: vorhandene Abschnitte werden nicht
// doppelt angehängt. Aufruf: node content-pipeline/erweitere-wiso-lernzettel.mjs
import fs from 'node:fs'

const PFAD = new URL('../public/data/themen/wiso.json', import.meta.url)
const themen = JSON.parse(fs.readFileSync(PFAD, 'utf8'))

const ERGAENZUNGEN = {
  'berufsausbildung-arbeitsrecht': {
    abschnitte: [
      `## Kündigung und Kündigungsschutz

Eine Kündigung braucht immer die **Schriftform** (§ 623 BGB) — E-Mail oder mündlich sind unwirksam.

- **Ordentliche Kündigung:** mit Frist. Grundfrist § 622 BGB: **4 Wochen zum 15. oder zum Monatsende**; sie verlängert sich für den Arbeitgeber mit der Betriebszugehörigkeit (z. B. 2 Jahre → 1 Monat, 10 Jahre → 4 Monate, 20 Jahre → 7 Monate, jeweils zum Monatsende).
- **Außerordentliche (fristlose) Kündigung** (§ 626 BGB): nur aus **wichtigem Grund** (z. B. Diebstahl), innerhalb von **2 Wochen** nach Kenntnis.

Das **Kündigungsschutzgesetz** gilt in Betrieben mit **mehr als 10 Arbeitnehmern** nach **6 Monaten** Betriebszugehörigkeit. Eine ordentliche Kündigung muss dann sozial gerechtfertigt sein:

1. **personenbedingt** (z. B. dauerhafte Krankheit),
2. **verhaltensbedingt** (z. B. wiederholtes Zuspätkommen — vorher **Abmahnung** nötig!),
3. **betriebsbedingt** (z. B. Auftragsmangel — mit **Sozialauswahl**: Alter, Betriebszugehörigkeit, Unterhaltspflichten, Schwerbehinderung).

**Besonderer Kündigungsschutz:** Schwangere, Eltern in Elternzeit, Schwerbehinderte, Betriebsratsmitglieder und Auszubildende nach der Probezeit. Gegen eine Kündigung hilft nur die **Kündigungsschutzklage** beim Arbeitsgericht — innerhalb von **3 Wochen**.`,
      `## Tarifvertrag, Betriebsrat und Mitbestimmung

**Tarifautonomie** (Art. 9 GG): Gewerkschaften und Arbeitgeberverbände (oder einzelne Arbeitgeber) handeln Tarifverträge **ohne staatlichen Eingriff** aus.

- **Lohn-/Gehaltstarifvertrag:** Entgelthöhe, kurze Laufzeit.
- **Manteltarifvertrag:** Rahmenbedingungen wie Arbeitszeit, Urlaub, Kündigungsfristen — lange Laufzeit.
- Während der Laufzeit gilt die **Friedenspflicht** (kein Streik über geregelte Themen). Das **Günstigkeitsprinzip** erlaubt einzelvertraglich nur Abweichungen **zugunsten** des Arbeitnehmers.

Der **Betriebsrat** vertritt die Belegschaft: wählbar ab **5 wahlberechtigten Arbeitnehmern**, Wahl **alle 4 Jahre**. Seine Rechte sind gestuft:

| Stufe | Beispiel |
| --- | --- |
| **Mitbestimmung** (soziale Angelegenheiten, § 87 BetrVG) | Beginn/Ende der Arbeitszeit, Urlaubsgrundsätze, Verhaltenskontrolle |
| **Mitwirkung/Anhörung** (personelle Angelegenheiten) | Anhörung vor **jeder Kündigung** — sonst ist sie unwirksam |
| **Information** (wirtschaftliche Angelegenheiten) | Wirtschaftsausschuss ab 100 Arbeitnehmern |

**Merke:** Die **JAV** (Jugend- und Auszubildendenvertretung) arbeitet mit dem Betriebsrat zusammen und vertritt alle unter 18 bzw. Azubis unter 25.`,
      `## Sozialversicherung: die fünf Säulen

Die gesetzliche Sozialversicherung schützt Arbeitnehmer vor den großen Lebensrisiken. Beiträge zahlen Arbeitgeber und Arbeitnehmer grundsätzlich **je zur Hälfte (paritätisch)** — Ausnahme: die Unfallversicherung trägt der **Arbeitgeber allein**.

| Säule | Träger | Beitragssatz (2026, ca.) |
| --- | --- | --- |
| **K**rankenversicherung | Krankenkassen | 14,6 % + kassenindividueller Zusatzbeitrag |
| **P**flegeversicherung | Pflegekassen | 3,6 % (Zuschlag für Kinderlose) |
| **R**entenversicherung | Deutsche Rentenversicherung | 18,6 % |
| **A**rbeitslosenversicherung | Bundesagentur für Arbeit | 2,6 % |
| **U**nfallversicherung | **Berufsgenossenschaften** | nur Arbeitgeber (branchenabhängig) |

- **Versicherungspflichtig** sind alle Arbeitnehmer und Auszubildenden ab dem ersten Tag.
- Die **Beitragsbemessungsgrenze** deckelt den beitragspflichtigen Verdienst; oberhalb der **Versicherungspflichtgrenze** (Krankenversicherung) ist ein Wechsel in die private Krankenversicherung möglich.
- **Minijobs** (bis zur Geringfügigkeitsgrenze) sind für Arbeitnehmer weitgehend abgabenfrei; es besteht Rentenversicherungspflicht mit Befreiungsmöglichkeit.

**Merke:** „**KV-PV-RV-AV-UV**" — und nur die **U**nfallversicherung zahlt der Betrieb allein (zuständig: Berufsgenossenschaft, auch für Arbeits- und **Wegeunfälle**).`,
    ],
    selbstcheck: [
      'Welche drei Kündigungsgründe kennt das Kündigungsschutzgesetz — und wann ist vorher eine Abmahnung nötig?',
      'Welche fünf Säulen hat die Sozialversicherung und welche zahlt der Arbeitgeber allein?',
    ],
  },
  'konjunktur-indikatoren': {
    abschnitte: [
      `## Geldpolitik der EZB, Inflation und Deflation

Die **Europäische Zentralbank (EZB)** sichert die **Preisniveaustabilität** im Euroraum — Ziel: Inflation um **2 %**. Ihr wichtigstes Instrument ist der **Leitzins**, zu dem sich Geschäftsbanken bei der EZB Geld leihen.

- **Restriktive Geldpolitik** (gegen Inflation): Leitzins **erhöhen** → Kredite werden teurer → Unternehmen und Haushalte investieren/konsumieren weniger → Nachfrage sinkt → Preisauftrieb lässt nach.
- **Expansive Geldpolitik** (gegen Rezession/Deflation): Leitzins **senken** → Kredite billiger → mehr Investitionen und Konsum → Konjunktur wird angekurbelt.

**Inflation** = anhaltender Anstieg des Preisniveaus, der **Geldwert sinkt**. Gemessen wird sie über den **Verbraucherpreisindex** (Preisentwicklung eines repräsentativen **Warenkorbs**). **Deflation** ist das Gegenteil: sinkende Preise, Kaufzurückhaltung („warten, bis es billiger wird") — gefährlich für die Konjunktur.

| | Gewinner | Verlierer |
| --- | --- | --- |
| **Inflation** | **Schuldner** (Kredite verlieren real an Wert), Sachwertbesitzer | **Sparer**, Gläubiger, Bezieher fester Einkommen |

**Merke:** Leitzins rauf = Inflation runter (restriktiv) · Leitzins runter = Konjunktur rauf (expansiv).`,
    ],
    selbstcheck: [
      'Mit welchem Instrument bekämpft die EZB eine zu hohe Inflation — und über welche Wirkungskette funktioniert das?',
    ],
  },
  'rechtsformen-vollmachten': {
    abschnitte: [
      `## Rechtsformen im Überblick

Bei der Wahl der Rechtsform entscheiden vor allem **Haftung**, **Kapitalbedarf** und **Leitungsbefugnis**:

- **Einzelunternehmen (e. K.):** eine Person, volle Entscheidungsfreiheit, aber **unbeschränkte Haftung** mit dem Privatvermögen; kein Mindestkapital.
- **OHG** (Personengesellschaft): mindestens 2 Gesellschafter, alle führen die Geschäfte und haften **unbeschränkt, gesamtschuldnerisch und persönlich**.
- **KG** (Personengesellschaft): **Komplementär** haftet unbeschränkt und führt die Geschäfte; **Kommanditist** haftet nur mit seiner **Einlage** und hat Kontrollrechte.
- **GmbH** (Kapitalgesellschaft): juristische Person, Haftung beschränkt auf das Gesellschaftsvermögen, **Stammkapital 25.000 €**, Organe: Geschäftsführung + Gesellschafterversammlung.
- **AG** (Kapitalgesellschaft): **Grundkapital 50.000 €** in Aktien zerlegt; Organe: **Vorstand** (leitet), **Aufsichtsrat** (überwacht), **Hauptversammlung** (Aktionäre).
- **eG** (Genossenschaft): Förderung der Mitglieder, Haftung meist auf Geschäftsanteile beschränkt.

**Merke:** Personengesellschaften = persönliche Haftung mindestens eines Gesellschafters · Kapitalgesellschaften = Haftungsbeschränkung, dafür Mindestkapital und mehr Formalitäten (Handelsregister, Notar).`,
      `## Kaufvertrag und Leistungsstörungen

Ein **Kaufvertrag** (§ 433 BGB) kommt durch **zwei übereinstimmende Willenserklärungen** zustande: **Antrag** und **Annahme**. Er verpflichtet den Verkäufer zur Übergabe der mangelfreien Ware, den Käufer zur Zahlung und Abnahme.

Die vier klassischen **Störungen**:

1. **Lieferungsverzug:** Verkäufer liefert trotz Fälligkeit nicht → **Mahnung** (entbehrlich bei Fixtermin), **Nachfrist** setzen → danach **Rücktritt** und/oder **Schadensersatz**.
2. **Sachmangel:** Ware ist fehlerhaft → zuerst Anspruch auf **Nacherfüllung** (Nachbesserung oder Ersatzlieferung), erst danach **Minderung**, **Rücktritt** oder Schadensersatz. **Kaufleute** müssen die Ware **unverzüglich prüfen und rügen** (§ 377 HGB), sonst gilt sie als genehmigt!
3. **Zahlungsverzug:** Käufer zahlt nicht → Mahnung; danach **gerichtliches Mahnverfahren**: Mahnbescheid → **Vollstreckungsbescheid** → Zwangsvollstreckung. Verzugszinsen dürfen berechnet werden.
4. **Annahmeverzug:** Käufer nimmt die Ware nicht ab → Verkäufer kann die Ware **hinterlegen** oder nach Androhung im **Selbsthilfeverkauf** verwerten.

**Merke:** Beim Sachmangel gilt „Nacherfüllung vor Rücktritt" — und im B2B-Geschäft ohne rechtzeitige Mängelrüge verliert der Käufer seine Rechte.`,
    ],
    selbstcheck: [
      'Worin unterscheiden sich Komplementär und Kommanditist einer KG bei Haftung und Geschäftsführung?',
      'Ein Kaufmann entdeckt drei Wochen nach Lieferung einen Mangel und hat nicht gerügt — welche Rechte hat er noch?',
    ],
  },
}

let geaendert = 0
for (const thema of themen) {
  const erg = ERGAENZUNGEN[thema.id]
  if (!erg) continue
  for (const abschnitt of erg.abschnitte) {
    const titel = abschnitt.split('\n')[0]
    if (thema.lernzettel.includes(titel)) continue
    thema.lernzettel = thema.lernzettel.trimEnd() + '\n\n' + abschnitt
    geaendert++
  }
  for (const frage of erg.selbstcheck) {
    if (!thema.selbstcheck.includes(frage)) thema.selbstcheck.push(frage)
  }
}

fs.writeFileSync(PFAD, JSON.stringify(themen, null, 2) + '\n')
console.log(`Fertig: ${geaendert} Abschnitte ergänzt.`)
