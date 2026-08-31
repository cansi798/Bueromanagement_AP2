<?php
declare(strict_types=1);
require __DIR__ . '/_lib.php';
// Setzt per Reset-Token ein neues Passwort.

if ($_SERVER['REQUEST_METHOD'] !== 'POST') antwort(405, ['fehler' => 'POST erwartet']);
$e = eingabe();
$token = $e['token'] ?? '';
$neu = $e['passwort'] ?? '';
if (strlen($neu) < 8) antwort(400, ['fehler' => 'Passwort braucht mindestens 8 Zeichen']);

$s = db()->prepare('SELECT id FROM nutzer WHERE reset_token = ? AND reset_gueltig_bis > NOW()');
$s->execute([hash('sha256', $token)]);
$n = $s->fetch();
if (!$n) antwort(400, ['fehler' => 'Link ungültig oder abgelaufen — bitte neu anfordern.']);

db()->prepare("UPDATE nutzer SET pass_hash = ?, reset_token = NULL, reset_gueltig_bis = NULL, fehlversuche = 0, gesperrt_bis = NULL WHERE id = ?")
  ->execute([password_hash($neu, PASSWORD_DEFAULT), $n['id']]);
antwort(200, ['ok' => true]);
