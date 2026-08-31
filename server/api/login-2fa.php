<?php
declare(strict_types=1);
require __DIR__ . '/_lib.php';
// Zweiter Schritt des Admin-Logins: E-Mail-Code prüfen (max. 3 Versuche).

verlange_origin();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') antwort(405, ['fehler' => 'POST erwartet']);
$e = eingabe();
$email = strtolower(trim($e['email'] ?? ''));
$code = trim((string)($e['code'] ?? ''));

$s = db()->prepare("SELECT * FROM nutzer WHERE email = ? AND rolle = 'admin'");
$s->execute([$email]);
$n = $s->fetch();

if (!$n || !$n['zwei_fa_code'] || !$n['zwei_fa_gueltig_bis'] || strtotime($n['zwei_fa_gueltig_bis']) < time()) {
  antwort(400, ['fehler' => 'Kein gültiger Code — bitte neu anmelden.']);
}
if ((int)$n['zwei_fa_versuche'] >= 3) {
  db()->prepare('UPDATE nutzer SET zwei_fa_code = NULL WHERE id = ?')->execute([$n['id']]);
  antwort(423, ['fehler' => 'Zu viele Fehlversuche — bitte neu anmelden.']);
}
if (!hash_equals($n['zwei_fa_code'], hash('sha256', $code))) {
  db()->prepare('UPDATE nutzer SET zwei_fa_versuche = zwei_fa_versuche + 1 WHERE id = ?')->execute([$n['id']]);
  antwort(401, ['fehler' => 'Code falsch (' . (2 - (int)$n['zwei_fa_versuche']) . ' Versuche übrig)']);
}

db()->prepare('UPDATE nutzer SET zwei_fa_code = NULL, zwei_fa_gueltig_bis = NULL, zwei_fa_versuche = 0 WHERE id = ?')->execute([$n['id']]);
session_regenerate_id(true);
$_SESSION['nutzer_id'] = (int)$n['id'];
antwort(200, ['nutzer' => ['id' => (int)$n['id'], 'email' => $n['email'], 'name' => $n['name'], 'rolle' => $n['rolle']]]);
