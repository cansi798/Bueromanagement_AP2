<?php
declare(strict_types=1);
require __DIR__ . '/_lib.php';
// GET: eigenen Fortschritt laden · PUT: eigenen Fortschritt speichern (JSON).

$n = verlange_login();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  $s = db()->prepare('SELECT daten, aktualisiert FROM fortschritt WHERE nutzer_id = ?');
  $s->execute([$n['id']]);
  $z = $s->fetch();
  antwort(200, ['daten' => $z ? json_decode($z['daten'], true) : null, 'aktualisiert' => $z['aktualisiert'] ?? null]);
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
  verlange_origin();
  $daten = eingabe();
  $json = json_encode($daten, JSON_UNESCAPED_UNICODE);
  if ($json === false || strlen($json) > 512 * 1024) antwort(400, ['fehler' => 'Ungültige oder zu große Daten']);
  db()->prepare('INSERT INTO fortschritt (nutzer_id, daten) VALUES (?, ?)
                 ON DUPLICATE KEY UPDATE daten = VALUES(daten)')->execute([$n['id'], $json]);
  antwort(200, ['ok' => true]);
}
antwort(405, ['fehler' => 'GET oder PUT erwartet']); // POST bewusst nicht erlaubt (CSRF-Härtung)
