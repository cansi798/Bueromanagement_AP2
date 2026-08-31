<?php
// Gemeinsame Helfer: DB (PDO), Session, JSON-Ein/Ausgabe, Rechte-Checks.
declare(strict_types=1);

session_set_cookie_params([
  'httponly' => true,
  'samesite' => 'Lax',
  'secure' => !empty($_SERVER['HTTPS']),
]);
session_start();

function konfig(): array {
  static $k = null;
  if ($k === null) {
    $pfad = __DIR__ . '/config.php';
    if (!file_exists($pfad)) antwort(500, ['fehler' => 'config.php fehlt (config.beispiel.php kopieren)']);
    $k = require $pfad;
  }
  return $k;
}

function db(): PDO {
  static $pdo = null;
  if ($pdo === null) {
    $k = konfig();
    $pdo = new PDO(
      "mysql:host={$k['db_host']};dbname={$k['db_name']};charset=utf8mb4",
      $k['db_user'], $k['db_pass'],
      [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
    );
  }
  return $pdo;
}

function eingabe(): array {
  $roh = file_get_contents('php://input');
  $d = json_decode($roh ?: '[]', true);
  return is_array($d) ? $d : [];
}

function antwort(int $status, array $daten): never {
  http_response_code($status);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode($daten, JSON_UNESCAPED_UNICODE);
  exit;
}

function aktueller_nutzer(): ?array {
  if (empty($_SESSION['nutzer_id'])) return null;
  $s = db()->prepare('SELECT id, email, name, rolle, klasse_id FROM nutzer WHERE id = ?');
  $s->execute([$_SESSION['nutzer_id']]);
  return $s->fetch() ?: null;
}

function verlange_login(): array {
  $n = aktueller_nutzer();
  if (!$n) antwort(401, ['fehler' => 'Nicht angemeldet']);
  return $n;
}

function verlange_admin(): array {
  $n = verlange_login();
  if ($n['rolle'] !== 'admin') antwort(403, ['fehler' => 'Nur für Admins']);
  return $n;
}

function verlange_lehrer(): array {
  $n = verlange_login();
  if (!in_array($n['rolle'], ['admin', 'lehrer'], true)) antwort(403, ['fehler' => 'Nur für Lehrkräfte']);
  return $n;
}

// Darf diese Lehrkraft diese Klasse sehen? (Admins: immer.)
function klasse_erlaubt(array $n, int $klasseId): bool {
  if ($n['rolle'] === 'admin') return true;
  $s = db()->prepare('SELECT 1 FROM lehrer_klassen WHERE nutzer_id = ? AND klasse_id = ?');
  $s->execute([$n['id'], $klasseId]);
  return (bool)$s->fetch();
}

// Selbstgebautes Rechen-Captcha (kein externer Dienst): Antwort liegt nur in
// der Server-Session — Bots ohne Session/JS scheitern, KI-Scraper werden gebremst.
function captcha_neu(): array {
  $a = random_int(2, 9);
  $b = random_int(2, 9);
  $op = random_int(0, 1);
  $_SESSION['captcha_antwort'] = $op === 0 ? $a + $b : $a * $b;
  $_SESSION['captcha_zeit'] = time();
  return ['frage' => $op === 0 ? "$a + $b" : "$a × $b"];
}

function captcha_pruefen($eingabe): bool {
  $soll = $_SESSION['captcha_antwort'] ?? null;
  $zeit = $_SESSION['captcha_zeit'] ?? 0;
  unset($_SESSION['captcha_antwort'], $_SESSION['captcha_zeit']); // Einmal-Nutzung
  if ($soll === null || time() - $zeit > 300) return false;       // max. 5 Min gültig
  return (int)$eingabe === (int)$soll;
}

function passwort_generieren(int $laenge = 10): string {
  $zeichen = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
  $p = '';
  for ($i = 0; $i < $laenge; $i++) $p .= $zeichen[random_int(0, strlen($zeichen) - 1)];
  return $p;
}
