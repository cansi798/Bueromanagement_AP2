<?php
// In config.php umbenennen und Werte aus dem ALL-INKL-KAS eintragen
// (KAS → Datenbanken: Datenbankname = Benutzername, z. B. d0123456).
return [
  'db_host' => 'localhost',
  'db_name' => 'd0123456',
  'db_user' => 'd0123456',
  'db_pass' => 'HIER-DAS-DB-PASSWORT',
  // Absender für Passwort-Reset-Mails (muss zu deiner Domain gehören):
  'mail_von' => 'coach@deine-domain.de',
  // Basis-URL der App (für den Reset-Link in der Mail), OHNE Slash am Ende:
  'app_url' => 'https://deine-domain.de',
  // Frei wählbarer Geheimwert für die Erstinstallation (install.php):
  'setup_key' => 'BITTE-AENDERN-99',
];
