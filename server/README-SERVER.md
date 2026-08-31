# Backend bei ALL-INKL einrichten (Schritt für Schritt)

Dieses Paket macht aus der statischen App eine Mehrbenutzer-Lernplattform:
**Admin** (verwaltet alles, mit 2FA) · **Lehrkräfte** (sehen ihre Klassen live)
· **Schüler** (lernen, Fortschritt wird gespeichert).

---

## Teil 1: Datenbank anlegen (KAS)

1. Im Browser **kas.all-inkl.com** öffnen und mit deinen KAS-Zugangsdaten
   anmelden (die aus der ALL-INKL-Willkommensmail, Benutzer wie `w0123456`).
2. Links im Menü: **Datenbanken** → Button **„Neue Datenbank anlegen"**.
3. Kommentar z. B. `kbm-coach` eintragen → **Speichern**.
4. KAS zeigt dir jetzt drei Dinge — **notieren**:
   - **Datenbankname** (= gleichzeitig Benutzername), z. B. `d0123456`
   - **Passwort** (kannst du dort auch neu setzen)
   - Host ist bei ALL-INKL immer `localhost`

## Teil 2: Schema importieren (phpMyAdmin)

1. In der Datenbank-Liste bei deiner neuen DB auf **phpMyAdmin** klicken
   (Login geschieht automatisch oder mit den Daten aus Teil 1).
2. Links deine Datenbank (z. B. `d0123456`) anklicken.
3. Oben Reiter **„Importieren"** → **Datei auswählen** → `schema.sql` aus
   diesem Ordner → unten **„OK"**.
4. Ergebnis: 4 Tabellen erscheinen links — `klassen`, `nutzer`,
   `lehrer_klassen`, `fortschritt`. ✅

## Teil 3: Dateien hochladen (FTP)

1. FTP-Programm (z. B. FileZilla) mit deinen ALL-INKL-FTP-Daten verbinden
   (KAS → FTP zeigt sie; Server ist meist `w0123456.kasserver.com`).
2. In das Verzeichnis deiner Domain wechseln (z. B. `/www/htdocs/w0123456/`
   oder den Ordner, auf den die Domain zeigt).
3. Hochladen:
   - den **Inhalt des `dist/`-Ordners** der App (index.html, assets/, data/,
     downloads/) direkt hinein,
   - den kompletten **`server/`-Ordner** daneben.
   Ergebnis-Struktur: `deine-domain.de/index.html` + `deine-domain.de/server/…`

## Teil 4: Konfigurieren

1. Im `server/api/`-Ordner die Datei `config.beispiel.php` **kopieren** und
   die Kopie **`config.php`** nennen.
2. `config.php` öffnen und eintragen:
   - `db_name` + `db_user`: dein Datenbankname aus Teil 1 (beides gleich)
   - `db_pass`: das DB-Passwort
   - `mail_von`: eine E-Mail-Adresse **deiner Domain** (in KAS → E-Mail
     anlegen, z. B. `coach@deine-domain.de`) — Absender für Reset-/2FA-Mails
   - `app_url`: `https://deine-domain.de` (ohne Slash am Ende)
   - `setup_key`: irgendein eigener Geheimtext (brauchst du nur in Teil 5)
3. Geänderte `config.php` per FTP hochladen.

## Teil 5: Ersten Admin anlegen

1. Browser: `https://deine-domain.de/server/install.php`
2. Setup-Key (aus config.php), deinen Namen, E-Mail und ein Passwort
   (min. 8 Zeichen) eintragen → **Admin anlegen**.
3. **WICHTIG: Danach `install.php` per FTP vom Server löschen!**

## Teil 6: Loslegen

| Wer | Wo | Was |
|---|---|---|
| **Admin (du)** | `deine-domain.de/server/admin.html` | Login mit Captcha + **2FA-Code per E-Mail** → Klassen anlegen, Schüler/Lehrkräfte anlegen (einzeln oder JSON-Import `[{"email":"…","name":"…"}]` — Startpasswörter werden **einmalig** angezeigt), Lehrkräfte ↔ Klassen zuordnen |
| **Lehrkraft** | `deine-domain.de/server/lehrer.html` | Login → zugeordnete Klassen wählen → **Live-Übersicht** (Auto-Aktualisierung alle 30 s): wer übt wie viel, Trefferquoten, Streaks, Simulations-Noten, „Schwierigkeiten der Klasse" (Aufgaben, die viele falsch haben) |
| **Schüler** | `deine-domain.de` | Lernen wie gewohnt; „Passwort vergessen" schickt einen Reset-Link per Mail |

## Sicherheit (eingebaut)

- Passwörter mit bcrypt gehasht, nie im Klartext.
- **Selbstgebautes Captcha** (Rechenaufgabe, serverseitig, Einmal-Nutzung) bei
  Login und Passwort-vergessen — kein externer Dienst.
- **Sperre nach 3 Fehlversuchen** (15 Min) + künstliche Verzögerung.
- **Admin-2FA:** 6-stelliger E-Mail-Code nach dem Passwort (10 Min, 3 Versuche).
- Passwort-Reset-Links: gehashter Einmal-Token, 1 Stunde gültig.
- Sessions HttpOnly/SameSite mit ID-Rotation; alles über Prepared Statements;
  Lehrkräfte sehen nur zugeordnete Klassen (serverseitig geprüft).

## Fehlersuche

- **„config.php fehlt"** → Teil 4 vergessen oder falscher Ordner.
- **Mails kommen nicht an** → `mail_von` muss eine echte, in KAS angelegte
  Adresse deiner Domain sein; Spam-Ordner prüfen.
- **„Kein gültiger Code"** beim 2FA → Code ist 10 Min gültig; neu anmelden.
- **500-Fehler** → KAS → Tools → Error-Logs ansehen.

## Noch offen (nächster Schritt in der App)

Die App selbst speichert den Lernstand aktuell im Browser (localStorage).
Der Schüler-Login **in der App** + automatischer Abgleich mit
`api/fortschritt.php` ist der nächste Ausbauschritt — die API dafür ist
fertig und wartet.
