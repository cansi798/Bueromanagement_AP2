# KBZ-Audit — Kundenbeziehungsprozesse vollständig prüfen + Amtsgericht-Streitwert 10.000 €

**Datum:** 2026-10-01 · **Status:** Design vom Nutzer freigegeben · **Branch:** `feature/kbz-audit`

## Anlass

Nutzer-Auftrag: „Geh Kundenbeziehungsprozesse nochmal durch, dass alles passt. Außerdem gab es eine Aktualisierung bezüglich Amtsgericht — es ist jetzt 10.000; bitte Antworten anpassen, prüfen, was aktuell ist, und einen Vermerk machen."

**Rechtslage (geprüft):** Gesetz zur Änderung des Zuständigkeitsstreitwerts der Amtsgerichte, in Kraft seit **01.01.2026**: Amtsgericht zuständig bis **10.000 €** (§ 23 Nr. 1 GVG, vorher 5.000 €); Anwaltszwang greift erst ab Landgericht, also ebenfalls oberhalb 10.000 €; Berufungsgrenze (§ 511 ZPO) von 600 € auf **1.000 €**; bestimmte Sachgebiete streitwertunabhängig spezialisierten Gerichten zugewiesen.

**Vorab-Befunde (2026-10-01):**

1. Drei Stellen nennen die alte Grenze 5.000 €: `kbz-2024s-a1-3` (Original-Prüfungsfrage, korrekt = 5.000 €-Option), die Gerichtsstand-Dresden-Aufgabe in `aufgaben/kbz.json` (nur Erklärung) und das Amtsgericht-Hamburg-Lernpaar in `lernpaare/kbz.json` (richtige Option + Erklärung). WiSo/BuFü/Mündlich enthalten keine Streitwertgrenze.
2. **162 von 232 KBZ-MC-Aufgaben** haben im `loesung`-Feld Positionsbezüge („**Antwort 2** ist richtig"). Seit der Fairness-Runde (2026-09-03) werden Optionen zur Laufzeit gemischt → diese Texte zeigen auf die falsche Position. Damals wurden nur `erklaerung`-Felder bereinigt.
3. 14 KBZ-Aufgaben hängen an Themen außerhalb der 6 KBZ-Themen (datenschutz 6, berufsausbildung 4, arbeitsschutz 3, projektmanagement 1) — Zuordnung prüfen.

## Ruling: Umgang mit rechtlich veralteten Original-Aufgaben

Original-Aufgaben werden **auf die heutige Rechtslage umgestellt** (die heute richtige Option wird korrekt gewertet). Die Lösung erhält einen sichtbaren Vermerk im Format:

```markdown
> **Rechtsstand 2026:** Seit 01.01.2026 liegt die Grenze bei 10.000 € (§ 23 GVG). Zum Prüfungszeitpunkt (Sommer 2024) galten noch 5.000 €.
```

Dieses Muster gilt für alle Rechtsstand-Funde des Audits. Generierte/abgeleitete Inhalte (Lernpaare, Lernzettel) werden einfach auf den aktuellen Stand gebracht, mit dem Kennzeichen „(Rechtsstand 2026)" an der Stelle (bestehende Konvention).

## Paket A — Sofortfix Amtsgericht

- `kbz-2024s-a1-3`: `korrekt` → Option „… 10.000,00 € ist das Landgericht zuständig."; `loesung` inhaltlich ohne Positionsbezug + Vermerk.
- Gerichtsstand-Dresden-Aufgabe: Erklärung „bis 10.000 €" + Kennzeichen „(Rechtsstand 2026)".
- Amtsgericht-Hamburg-Lernpaar: richtige Option und Erklärung auf 10.000,00 €; Distraktor „3.000,00 €" bleibt Distraktor.
- KBZ-Lernzettel (`themen/kbz.json`, Thema mit Abschnitt „Gerichtliches Mahnverfahren"): kurzer Absatz zur sachlichen Zuständigkeit (AG bis 10.000 €, darüber LG, Anwaltszwang am LG), gekennzeichnet „(Rechtsstand 2026)". Abschnittstitel bleibt unverändert (`FOLIEN_DIAGRAMME`-Schlüssel!).

## Paket B — Audit der KBZ-Inhalte

**Umfang:** `aufgaben/kbz.json` (803), `lernpaare/kbz.json` (209), `themen/kbz.json` (6 Lernzettel).

**Durchführung:** 6 Subagents parallel, je ein KBZ-Thema (kaufvertrag-stoerungen, personalwirtschaft, kostenrechnung, buchfuehrung-kontierung, kundenkommunikation, rechnung-umsatzsteuer); die 14 fremd-zugeordneten Aufgaben prüft der Agent, der thematisch am nächsten ist (bzw. ein Agent erhält sie als Zusatzliste). Subagents arbeiten **nur lesend** und liefern eine Befundliste (JSON) mit:

| Feld | Inhalt |
|---|---|
| `id` | Aufgaben-/Lernpaar-ID bzw. `lernzettel:<themaId>#<Abschnitt>` |
| `kategorie` | `rechtsstand` · `fachlich` · `position` · `zuordnung` · `sonstiges` |
| `befund` | Was ist falsch/veraltet (mit Rechtsgrundlage/Quelle) |
| `vorschlag` | Konkreter Ersatztext bzw. neue `korrekt`-/`themaId`-Werte |
| `sicherheit` | `sicher` · `unsicher` |

**Prüfkriterien:**
- *Rechtsstand 2026:* Beträge, Fristen, Freigrenzen, Prozentsätze, Paragraphen (u. a. Streitwert/Berufung, Aufbewahrung 8/10/6 J., Kleinunternehmer-/Kleinbetragsrechnungsgrenzen, Mindestlohn, SV-Beitragssätze/BBG, Urlaubs-/Kündigungsfristen, E-Rechnungspflicht, Verjährung, Verzugszinsen/Basiszins).
- *Fachlich:* Stimmt die als korrekt markierte Option, die Musterlösung, der Rechenweg (Nachrechnen bei `rechnen`-Aufgaben)?
- *Position:* Jede Lösung/Erklärung einer MC-Aufgabe, die auf Optionsnummern/-positionen verweist.
- *Zuordnung:* Passt `themaId` zum Inhalt?
- *Sonstiges:* Tippfehler, widersprüchliche Lernzettel-Aussagen, kaputtes Markdown, Lösung passt nicht zur Frage.

**Original-Texte** (Aufgabentext/Optionen) werden nur bei Rechtsstand-Änderungen angefasst; Formulierungsvorlieben sind kein Befund.

## Paket C — Freigabe und Einspielen

- `sicher` + `position`/`rechtsstand`/eindeutig `sonstiges` → direkt übernehmen.
- `unsicher` sowie alle `fachlich`-Änderungen an der Wertung (`korrekt`) und alle `zuordnung`-Änderungen → gesammelt dem Nutzer zur Entscheidung vorlegen (Tabelle), erst danach einspielen.
- Einspielen über Staging-Datei `content-pipeline/staging/kbz-audit-<datum>.json` + Merge-Skript (Muster `merge-*.mjs`): Patch je `id` auf Feldebene, bricht ab, wenn eine `id` fehlt oder ein Altwert nicht zum erwarteten Stand passt.

## Paket E — Fehlerhaft angezeigte Berechnungen (Nutzer-Nachtrag)

Nutzer-Hinweis: „Berechnungen sollen teilweise fehlerhaft angezeigt werden." Analyse (2026-10-01) ergab zwei Darstellungs-Ursachen im Markdown-Rendering (`src/components/Markdown.tsx`: remark-gfm + remark-math + rehype-katex):

1. **Einfache Zeilenumbrüche verschwinden.** In CommonMark ist `\n` ein weicher Umbruch → mehrzeilige Rechenwege und Buchungssätze laufen zu **einer Zeile** zusammen (z. B. „… = 9.240,00 € skontofähiger Warenwert. Skonto 2 % von 9.240,00 € = 184,80 €. 9.240,00 € − …"; Buchungssatz „an 5100 … an 4800 …" in einer Zeile). Betroffen u. a. KBZ 20 `loesung` + 14 `erklaerung`, BuFü 5 `loesung`, Rechnen-Kachel 12 `loesungsweg`, WiSo 80 `text`.
   **Fix (Code, global):** Plugin `remark-breaks` in `Markdown.tsx` ergänzen → einfacher Umbruch = sichtbarer Zeilenumbruch, in allen Bereichen. Absätze mit `\n\n`, Tabellen, Listen und KaTeX bleiben unverändert. Render-Test in `tests/markdown.test.tsx` (zwei Zeilen → `<br>`).
2. **Zeilen mit „+ " am Anfang werden zur Aufzählung.** Kalkulationsschemata („+ Materialgemeinkosten …", „= Herstellkosten") verlieren das Pluszeichen (wird zum Listenpunkt), die „="-Zeile hängt sich an den Punkt davor (z. B. `kbz-2025s-a6-6`, `kbz-2025s-a5-4`).
   **Fix (Daten):** Betroffene Schemata als Tabelle (Position | Betrag) bzw. mit maskiertem `\+` umschreiben; Dauertest: keine `loesung`/`erklaerung`/`loesungsweg`-Zeile beginnt mit unmaskiertem `+ `.

Zusätzlich prüfen die Audit-Agenten (Paket B) bei **jeder Rechenaufgabe** (169 KBZ-`rechnen` + rechenhaltige MC) das **Nachrechnen**: Zwischenwerte, Endergebnis, Rundung, Einheiten — Befundkategorie `fachlich`. Die Kachel „Kaufmännisches Rechnen" (`rechnen.json`) profitiert vom globalen Fix 1; ihre Generatoren sind durch 140 Tests abgesichert und nicht Teil des Audits.

## Paket D — Dauerhafte Absicherung

- Neuer Test `tests/positionsbezug.test.ts`: Keine `loesung`/`erklaerung` einer KBZ-MC-Aufgabe bzw. eines KBZ-MC-Lernpaars enthält Positionsbezüge (Muster u. a. `Antwort \d`, `Option \d`, `die (erste|zweite|…|letzte) (Option|Antwort)`). Die Prüfung, ob WiSo/BuFü/Mündlich ebenfalls betroffen sind, wird im audit-report vermerkt; Ausweitung des Tests = eigene Runde (nicht stillschweigend mitändern).
- Test für Streitwertgrenze: kein KBZ-Inhalt nennt „5.000" im Zusammenhang mit Amts-/Landgericht (verhindert Rückfall bei künftigen Content-Merges).

## Vermerke und Abschluss

- `content-pipeline/audit-report.md`: Abschnitt „KBZ-Audit 2026-10-01" mit Rechtsstand-Änderungen (inkl. Quelle), Statistik je Kategorie, Nutzer-Rulings, bewusst nicht geänderte Fälle.
- `npm test` grün; Schema-Validierung grün.
- Download-PDFs (KBZ-Lernzettel/Skripte) und KBZ-Medien-Quell-PDFs regenerieren; dist + ZIP neu.
- `Update-Bericht-2026-10-01/` (nummerierte Dateien + gebündeltes PDF, deutsch, für Schüler/Kollegen) — insbesondere der Rechtsstand-Vermerk Amtsgericht 10.000 €.
- Merge auf `main` + Push nach Nutzer-Review.
