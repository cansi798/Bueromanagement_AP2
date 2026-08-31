# Vorplanung: Mehrbenutzer-Modus (Admin, Klassen, Konten, Fortschritt)

**Status: GEPLANT — noch nicht gebaut.** Wunsch der Lehrkraft (2026-08-31):
Datenbank mit Admin-Zugang; Klassen anlegen; Mitglieder per JSON-Import oder
manuell (E-Mail + generiertes Passwort); Schüler können Passwort zurücksetzen;
Lernfortschritt wird pro Nutzer serverseitig gespeichert.

## Empfohlene Architektur: Supabase (kostenloser Tier reicht für Klassen)

Die App bleibt eine statische Seite (GitHub Pages/Webserver) — Supabase liefert
Auth + Postgres + Row-Level-Security als gehostetes Backend:

- **Auth:** E-Mail + Passwort; „Passwort vergessen" ist eingebaut (Reset-Mail).
  Admin legt Konten per Admin-API an (generiertes Startpasswort).
- **Tabellen:** `klassen(id, name)`, `profile(user_id, klasse_id, rolle
  'admin'|'schueler', name)`, `fortschritt(user_id, daten jsonb, updated_at)`
  — `daten` ist 1:1 unser heutiges localStorage-Objekt.
- **RLS:** Schüler lesen/schreiben nur den eigenen Fortschritt; Admin liest
  seine Klassen; Contentdaten bleiben statisch im Frontend (kein DB-Content).
- **Admin-Bereich in der App:** Route `/admin` (nur Rolle admin): Klasse
  anlegen, Mitglieder-Tabelle, JSON-Import (`[{email, name}]` → Konten mit
  Zufallspasswort, Ausgabe als Liste zum Austeilen), Fortschritts-Übersicht.

## Warum die heutige App dafür schon vorbereitet ist

Der gesamte Fortschritt läuft über genau zwei Module:
- `src/lib/storage.ts` (get/set) und `src/lib/progress.ts` / Leitner-Stände.
Für den Umbau genügt ein Sync-Layer: localStorage bleibt Cache, bei Login wird
`fortschritt.daten` geladen/gemerged und debounced zurückgeschrieben. Kein
UI-Umbau nötig; das Code-Gate wird durch die Login-Maske ersetzt (Gast-Modus
mit Code kann bleiben).

## Aufwandsschätzung
Supabase-Projekt + Tabellen + RLS (0,5 T) · Login/Reset-UI (0,5 T) ·
Sync-Layer (0,5 T) · Admin-Bereich mit JSON-Import (1 T) · Tests/Doku (0,5 T).

**Nächster Schritt, wenn es losgehen soll:** Supabase-Konto anlegen (kostenlos),
dann „Mehrbenutzer bauen" sagen — der Rest läuft wie gewohnt über mich.
