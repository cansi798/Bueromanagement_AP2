<?php
declare(strict_types=1);
require __DIR__ . '/_lib.php';
// Fordert einen Passwort-Reset-Link per E-Mail an (mit Captcha gegen Bots).

if ($_SERVER['REQUEST_METHOD'] !== 'POST') antwort(405, ['fehler' => 'POST erwartet']);
$e = eingabe();
if (!captcha_pruefen($e['captcha'] ?? null)) {
  antwort(400, ['fehler' => 'Captcha falsch oder abgelaufen', 'captcha' => captcha_neu()]);
}
$email = strtolower(trim($e['email'] ?? ''));
$s = db()->prepare('SELECT id, name FROM nutzer WHERE email = ?');
$s->execute([$email]);
$n = $s->fetch();

// Immer dieselbe Antwort — verrät nicht, ob die E-Mail existiert.
if ($n) {
  $token = bin2hex(random_bytes(32));
  db()->prepare("UPDATE nutzer SET reset_token = ?, reset_gueltig_bis = DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE id = ?")
    ->execute([hash('sha256', $token), $n['id']]);
  $k = konfig();
  $link = $k['app_url'] . '/server/passwort-neu.html?token=' . $token;
  $betreff = 'KBM Prüfungscoach: Passwort zurücksetzen';
  $text = "Hallo {$n['name']},\n\nüber diesen Link kannst du innerhalb von 1 Stunde ein neues Passwort setzen:\n$link\n\nFalls du das nicht warst, ignoriere diese Mail.";
  @mail($email, $betreff, $text, 'From: ' . $k['mail_von'] . "\r\nContent-Type: text/plain; charset=utf-8");
}
antwort(200, ['ok' => true, 'hinweis' => 'Wenn die E-Mail existiert, wurde ein Link verschickt.']);
