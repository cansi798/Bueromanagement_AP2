# Server-Paket: Konten, Klassen & Fortschritt (ALL-INKL)

Macht aus der statischen App eine Mehrbenutzer-App mit Login. Läuft auf jedem
PHP-8-Hosting mit MySQL/MariaDB — Anleitung hier für **ALL-INKL (KAS)**.

## Installation (einmalig, ~15 Minuten)

1. **Datenbank anlegen:** KAS → Datenbanken → neue Datenbank. Notiere
   Datenbankname (= Benutzername, z. B. `d0123456`) und Passwort.
2. **Schema importieren:** KAS → Datenbanken → phpMyAdmin öffnen → deine DB
   wählen → *Importieren* → `schema.sql` hochladen → OK.
3. **Dateien hochladen** (per FTP/KAS-Dateimanager) in deinen Webspace,
   z. B. nach `/kbm/`:
   - den kompletten App-Build (`dist/`-Inhalt) ins Verzeichnis
   - den Ordner `server/` daneben (also `/kbm/server/…`)
4. **Konfigurieren:** `server/api/config.beispiel.php` → kopieren zu
   `server/api/config.php` und DB-Zugang, Mail-Absender, App-URL + eigenen
   `setup_key` eintragen. (`config.php` gehört NIE ins Git — steht in
   .gitignore.)
5. **Ersten Admin anlegen:** `https://deine-domain.de/kbm/server/install.php`
   aufrufen, Setup-Key + E-Mail + Passwort eingeben.
   **Danach `install.php` vom Server LÖSCHEN!**
6. **Verwalten:** `https://deine-domain.de/kbm/server/admin.html`
   → Anmelden (mit Captcha + **E-Mail-2FA-Code** für Admins)
   → Klassen anlegen → Mitglieder einzeln oder per JSON-Import
   (`[{"email":"…","name":"…"}]`) — Startpasswörter werden **einmalig**
   angezeigt.

## Sicherheit (eingebaut)

- Passwörter: bcrypt (`password_hash`), nie im Klartext gespeichert.
- **Captcha** (selbstgebaut, Rechenaufgabe, serverseitig geprüft, Einmal-Nutzung,
  5 Min gültig) bei Login und Passwort-vergessen — bremst Bots ohne Fremdanbieter.
- **Sperre nach 3 Fehlversuchen** für 15 Minuten (+ künstliche Verzögerung).
- **Admin-2FA:** Nach dem Passwort kommt ein 6-stelliger Code per E-Mail
  (10 Min gültig, max. 3 Versuche).
- **Passwort-Reset per E-Mail:** Link mit gehashtem Einmal-Token (1 h gültig).
- Sessions: HttpOnly + SameSite; Session-ID-Rotation nach Login.
- SQL nur über Prepared Statements; Schüler erreichen nur den eigenen
  Fortschritt; Admin-Endpoints prüfen die Rolle serverseitig.

## API-Kurzreferenz

| Endpoint | Zweck |
|---|---|
| `GET  api/captcha.php` | neue Rechenaufgabe |
| `POST api/login.php` | Login `{email, passwort, captcha}` — Admins erhalten `{zwei_fa:true}` |
| `POST api/login-2fa.php` | Admin-Code bestätigen `{email, code}` |
| `POST api/logout.php` / `GET api/me.php` | Abmelden / Wer bin ich |
| `POST api/passwort-vergessen.php` | Reset-Mail `{email, captcha}` |
| `POST api/passwort-neu.php` | Neues Passwort `{token, passwort}` |
| `GET/PUT api/fortschritt.php` | Eigenen Lernfortschritt laden/speichern (JSON) |
| `GET/POST api/admin/klassen.php` | Klassen listen/anlegen |
| `GET/POST/DELETE api/admin/nutzer.php` | Mitglieder listen / anlegen (einzeln + JSON-Liste) / löschen |

## Nächster Schritt (App-Anbindung)

Die App speichert Fortschritt aktuell in `localStorage`. Die Anbindung
(Login-Maske für Schüler + automatischer Abgleich mit `api/fortschritt.php`)
ist der Folgeschritt — Design siehe
`docs/superpowers/specs/2026-08-31-mehrbenutzer-vorplanung.md`.
