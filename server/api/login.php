<?php
declare(strict_types=1);
require __DIR__ . '/_lib.php';
// Login mit Captcha-Pflicht und Sperre nach 3 Fehlversuchen (15 Minuten).

verlange_origin();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') antwort(405, ['fehler' => 'POST erwartet']);
$e = eingabe();
$email = strtolower(trim($e['email'] ?? ''));
$passwort = $e['passwort'] ?? '';

if (!captcha_pruefen($e['captcha'] ?? null)) {
  antwort(400, ['fehler' => 'Captcha falsch oder abgelaufen', 'captcha' => captcha_neu()]);
}

$s = db()->prepare('SELECT * FROM nutzer WHERE email = ?');
$s->execute([$email]);
$n = $s->fetch();

// Gesperrt?
if ($n && $n['gesperrt_bis'] !== null && strtotime($n['gesperrt_bis']) > time()) {
  $rest = (int)ceil((strtotime($n['gesperrt_bis']) - time()) / 60);
  antwort(423, ['fehler' => "Konto gesperrt — versuche es in $rest Min. erneut oder nutze „Passwort vergessen“."]);
}

if (!$n || !password_verify($passwort, $n['pass_hash'])) {
  usleep(400000); // Brute-Force bremsen
  if ($n) {
    $versuche = (int)$n['fehlversuche'] + 1;
    if ($versuche >= 3) {
      db()->prepare("UPDATE nutzer SET fehlversuche = 0, gesperrt_bis = DATE_ADD(NOW(), INTERVAL 15 MINUTE) WHERE id = ?")
        ->execute([$n['id']]);
      antwort(423, ['fehler' => 'Dreimal falsch — Konto für 15 Minuten gesperrt.']);
    }
    db()->prepare('UPDATE nutzer SET fehlversuche = ? WHERE id = ?')->execute([$versuche, $n['id']]);
    antwort(401, ['fehler' => 'E-Mail oder Passwort falsch (' . (3 - $versuche) . ' Versuche übrig)', 'captcha' => captcha_neu()]);
  }
  antwort(401, ['fehler' => 'E-Mail oder Passwort falsch', 'captcha' => captcha_neu()]);
}

// Passwort korrekt: Zähler zurücksetzen
db()->prepare('UPDATE nutzer SET fehlversuche = 0, gesperrt_bis = NULL WHERE id = ?')->execute([$n['id']]);

// Admins brauchen einen zweiten Faktor: 6-stelliger Code per E-Mail (10 Min gültig).
if ($n['rolle'] === 'admin') {
  $code = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
  db()->prepare("UPDATE nutzer SET zwei_fa_code = ?, zwei_fa_gueltig_bis = DATE_ADD(NOW(), INTERVAL 10 MINUTE), zwei_fa_versuche = 0 WHERE id = ?")
    ->execute([hash('sha256', $code), $n['id']]);
  mail_senden($n['email'], 'KBM Prüfungscoach: Dein Anmeldecode',
    "Dein Anmeldecode lautet: $code\n\nEr ist 10 Minuten gültig. Falls du dich nicht anmelden wolltest, ändere dein Passwort.");
  antwort(200, ['zwei_fa' => true, 'hinweis' => 'Code wurde an deine E-Mail geschickt.']);
}

session_regenerate_id(true);
$_SESSION['nutzer_id'] = (int)$n['id'];
antwort(200, ['nutzer' => ['id' => (int)$n['id'], 'email' => $n['email'], 'name' => $n['name'], 'rolle' => $n['rolle']]]);
