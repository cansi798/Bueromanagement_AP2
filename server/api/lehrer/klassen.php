<?php
declare(strict_types=1);
require __DIR__ . '/../_lib.php';
// Klassen der angemeldeten Lehrkraft (Admins sehen alle Klassen).

$n = verlange_lehrer();

if ($n['rolle'] === 'admin') {
  $z = db()->query('SELECT k.id, k.name, COUNT(nu.id) AS mitglieder
                    FROM klassen k LEFT JOIN nutzer nu ON nu.klasse_id = k.id AND nu.rolle = "schueler"
                    GROUP BY k.id ORDER BY k.name')->fetchAll();
} else {
  $s = db()->prepare('SELECT k.id, k.name, COUNT(nu.id) AS mitglieder
                      FROM lehrer_klassen lk
                      JOIN klassen k ON k.id = lk.klasse_id
                      LEFT JOIN nutzer nu ON nu.klasse_id = k.id AND nu.rolle = "schueler"
                      WHERE lk.nutzer_id = ?
                      GROUP BY k.id ORDER BY k.name');
  $s->execute([$n['id']]);
  $z = $s->fetchAll();
}
antwort(200, ['klassen' => $z]);
