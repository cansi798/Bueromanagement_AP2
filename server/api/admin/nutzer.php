<?php
declare(strict_types=1);
require __DIR__ . '/../_lib.php';
// GET ?klasse_id=N: Mitglieder auflisten.
// POST {klasse_id, mitglieder: [{email, name?}, …]}  ODER  {klasse_id, email, name?}
//   → legt Konten mit generierten Startpasswörtern an und gibt sie EINMALIG zurück.
// DELETE {id}: Konto löschen.

verlange_admin();
if ($_SERVER['REQUEST_METHOD'] !== 'GET') verlange_origin();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  // ?rolle=lehrer → alle Lehrkräfte (für die Zuordnung); sonst ?klasse_id=N.
  if (($_GET['rolle'] ?? '') === 'lehrer') {
    $z = db()->query("SELECT id, email, name FROM nutzer WHERE rolle = 'lehrer' ORDER BY name, email")->fetchAll();
    antwort(200, ['lehrer' => $z]);
  }
  $klasseId = (int)($_GET['klasse_id'] ?? 0);
  $s = db()->prepare("SELECT id, email, name, rolle, erstellt,
                      (gesperrt_bis IS NOT NULL AND gesperrt_bis > NOW()) AS gesperrt
                      FROM nutzer WHERE klasse_id = ? ORDER BY name, email");
  $s->execute([$klasseId]);
  antwort(200, ['mitglieder' => $s->fetchAll()]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $e = eingabe();
  $klasseId = (int)($e['klasse_id'] ?? 0);
  if ($klasseId <= 0) antwort(400, ['fehler' => 'klasse_id fehlt']);
  $liste = $e['mitglieder'] ?? (isset($e['email']) ? [['email' => $e['email'], 'name' => $e['name'] ?? '']] : []);
  if (!is_array($liste) || count($liste) === 0) antwort(400, ['fehler' => 'Keine Mitglieder übergeben']);
  if (count($liste) > 200) antwort(400, ['fehler' => 'Maximal 200 auf einmal']);

  $rolle = ($e['rolle'] ?? 'schueler') === 'lehrer' ? 'lehrer' : 'schueler';
  $angelegt = [];
  $fehler = [];
  $ins = db()->prepare('INSERT INTO nutzer (klasse_id, email, name, pass_hash, rolle) VALUES (?, ?, ?, ?, ?)');
  foreach ($liste as $m) {
    $email = strtolower(trim($m['email'] ?? ''));
    $name = trim($m['name'] ?? '');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) { $fehler[] = "$email: ungültige E-Mail"; continue; }
    $passwort = passwort_generieren();
    try {
      $ins->execute([$rolle === 'lehrer' ? null : $klasseId, $email, $name,
                     password_hash($passwort, PASSWORD_DEFAULT), $rolle]);
      if ($rolle === 'lehrer') {
        db()->prepare('INSERT IGNORE INTO lehrer_klassen (nutzer_id, klasse_id) VALUES (?, ?)')
          ->execute([(int)db()->lastInsertId(), $klasseId]);
      }
      $angelegt[] = ['email' => $email, 'name' => $name, 'passwort' => $passwort, 'rolle' => $rolle];
    } catch (PDOException) {
      $fehler[] = "$email: existiert bereits";
    }
  }
  antwort(201, ['angelegt' => $angelegt, 'fehler' => $fehler,
    'hinweis' => 'Passwörter werden nur EINMAL angezeigt — jetzt speichern/austeilen!']);
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
  $id = (int)(eingabe()['id'] ?? 0);
  $selbst = aktueller_nutzer();
  if ($id === (int)$selbst['id']) antwort(400, ['fehler' => 'Du kannst dich nicht selbst löschen']);
  db()->prepare("DELETE FROM nutzer WHERE id = ? AND rolle IN ('schueler','lehrer')")->execute([$id]);
  antwort(200, ['ok' => true]);
}
antwort(405, ['fehler' => 'GET, POST oder DELETE erwartet']);
