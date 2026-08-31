<?php
declare(strict_types=1);
require __DIR__ . '/../_lib.php';
// GET: alle Klassen mit Mitgliederzahl · POST {name}: Klasse anlegen.

verlange_admin();
if ($_SERVER['REQUEST_METHOD'] !== 'GET') verlange_origin();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  $z = db()->query('SELECT k.id, k.name, COUNT(n.id) AS mitglieder
                    FROM klassen k LEFT JOIN nutzer n ON n.klasse_id = k.id
                    GROUP BY k.id ORDER BY k.name')->fetchAll();
  antwort(200, ['klassen' => $z]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $name = trim(eingabe()['name'] ?? '');
  if ($name === '' || mb_strlen($name) > 100) antwort(400, ['fehler' => 'Ungültiger Klassenname']);
  try {
    db()->prepare('INSERT INTO klassen (name) VALUES (?)')->execute([$name]);
  } catch (PDOException) {
    antwort(409, ['fehler' => 'Klasse existiert bereits']);
  }
  antwort(201, ['ok' => true, 'id' => (int)db()->lastInsertId()]);
}
antwort(405, ['fehler' => 'GET oder POST erwartet']);
