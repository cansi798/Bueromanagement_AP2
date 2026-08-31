<?php
declare(strict_types=1);
require __DIR__ . '/../_lib.php';
// Lehrer ↔ Klassen zuordnen (nur Admin).
// GET: alle Zuordnungen · POST {lehrer_id, klasse_id}: anlegen · DELETE {lehrer_id, klasse_id}: entfernen.

verlange_admin();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  $z = db()->query("SELECT lk.nutzer_id AS lehrer_id, n.name, n.email, lk.klasse_id, k.name AS klasse
                    FROM lehrer_klassen lk
                    JOIN nutzer n ON n.id = lk.nutzer_id
                    JOIN klassen k ON k.id = lk.klasse_id
                    ORDER BY k.name, n.name")->fetchAll();
  antwort(200, ['zuordnungen' => $z]);
}

$e = eingabe();
$lehrerId = (int)($e['lehrer_id'] ?? 0);
$klasseId = (int)($e['klasse_id'] ?? 0);
if ($lehrerId <= 0 || $klasseId <= 0) antwort(400, ['fehler' => 'lehrer_id und klasse_id nötig']);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $s = db()->prepare("SELECT 1 FROM nutzer WHERE id = ? AND rolle = 'lehrer'");
  $s->execute([$lehrerId]);
  if (!$s->fetch()) antwort(400, ['fehler' => 'Kein Lehrer-Konto mit dieser ID']);
  db()->prepare('INSERT IGNORE INTO lehrer_klassen (nutzer_id, klasse_id) VALUES (?, ?)')
    ->execute([$lehrerId, $klasseId]);
  antwort(201, ['ok' => true]);
}
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
  db()->prepare('DELETE FROM lehrer_klassen WHERE nutzer_id = ? AND klasse_id = ?')
    ->execute([$lehrerId, $klasseId]);
  antwort(200, ['ok' => true]);
}
antwort(405, ['fehler' => 'GET, POST oder DELETE erwartet']);
