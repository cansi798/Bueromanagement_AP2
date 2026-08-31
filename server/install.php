<?php
declare(strict_types=1);
require __DIR__ . '/api/_lib.php';
// Erstinstallation: legt den ERSTEN Admin an. Funktioniert nur, solange noch
// kein Admin existiert, und nur mit dem setup_key aus config.php.
// Aufruf im Browser: https://deine-domain.de/server/install.php

$vorhanden = (int)db()->query("SELECT COUNT(*) FROM nutzer WHERE rolle = 'admin'")->fetchColumn();
if ($vorhanden > 0) { http_response_code(403); exit('Es existiert bereits ein Admin — install.php ist deaktiviert. Datei jetzt vom Server löschen!'); }

$meldung = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $k = konfig();
  if (!hash_equals($k['setup_key'], $_POST['setup_key'] ?? '')) {
    $meldung = 'Setup-Key falsch (steht in deiner config.php).';
  } elseif (!filter_var($_POST['email'] ?? '', FILTER_VALIDATE_EMAIL)) {
    $meldung = 'Bitte eine gültige E-Mail angeben.';
  } elseif (strlen($_POST['passwort'] ?? '') < 8) {
    $meldung = 'Passwort braucht mindestens 8 Zeichen.';
  } else {
    db()->prepare("INSERT INTO nutzer (email, name, pass_hash, rolle) VALUES (?, ?, ?, 'admin')")
      ->execute([strtolower(trim($_POST['email'])), trim($_POST['name'] ?? 'Admin'),
                 password_hash($_POST['passwort'], PASSWORD_DEFAULT)]);
    exit('✅ Admin angelegt! WICHTIG: Lösche jetzt die Datei server/install.php vom Server. Danach im Admin-Panel (server/admin.html) anmelden.');
  }
}
?><!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>KBM Coach · Erstinstallation</title>
<body style="font-family:system-ui;max-width:420px;margin:3rem auto;padding:0 1rem">
<h1>Ersten Admin anlegen</h1>
<?php if ($meldung) echo '<p style="color:#b91c1c">' . htmlspecialchars($meldung) . '</p>'; ?>
<form method="post" style="display:grid;gap:.7rem">
  <input name="setup_key" placeholder="Setup-Key (aus config.php)" required style="padding:.7rem">
  <input name="name" placeholder="Dein Name" style="padding:.7rem">
  <input name="email" type="email" placeholder="Admin-E-Mail" required style="padding:.7rem">
  <input name="passwort" type="password" placeholder="Passwort (min. 8 Zeichen)" required style="padding:.7rem">
  <button style="padding:.8rem;background:#0f172a;color:#fff;border:0;border-radius:8px;font-weight:600">Admin anlegen</button>
</form></body></html>
