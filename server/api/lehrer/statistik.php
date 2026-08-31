<?php
declare(strict_types=1);
require __DIR__ . '/../_lib.php';
// Live-Klassenübersicht für Lehrkräfte: pro Mitglied Lernstand-Kennzahlen +
// Klassenstatistik (Durchschnitt, häufigste Problem-Aufgaben).
// GET ?klasse_id=N  — Lehrkraft muss der Klasse zugeordnet sein (Admin: alle).

$n = verlange_lehrer();
$klasseId = (int)($_GET['klasse_id'] ?? 0);
if ($klasseId <= 0) antwort(400, ['fehler' => 'klasse_id fehlt']);
if (!klasse_erlaubt($n, $klasseId)) antwort(403, ['fehler' => 'Diese Klasse ist dir nicht zugeordnet']);

$s = db()->prepare("SELECT nu.id, nu.name, nu.email, f.daten, f.aktualisiert
                    FROM nutzer nu LEFT JOIN fortschritt f ON f.nutzer_id = nu.id
                    WHERE nu.klasse_id = ? AND nu.rolle = 'schueler'
                    ORDER BY nu.name, nu.email");
$s->execute([$klasseId]);

$mitglieder = [];
$summeQuote = 0;
$mitQuote = 0;
$problemZaehler = [];   // aufgabeId => wie viele Schüler haben sie öfter falsch als richtig
$heute = date('Y-m-d');
$aktivHeute = 0;

foreach ($s->fetchAll() as $z) {
  $d = $z['daten'] ? json_decode($z['daten'], true) : null;
  $stat = $d['aufgabenStatistik'] ?? [];
  $richtig = 0; $gesamt = 0;
  foreach ($stat as $aufgabeId => $v) {
    $richtig += (int)($v['richtig'] ?? 0);
    $gesamt += (int)($v['richtig'] ?? 0) + (int)($v['falsch'] ?? 0);
    if (($v['falsch'] ?? 0) > ($v['richtig'] ?? 0)) {
      $problemZaehler[$aufgabeId] = ($problemZaehler[$aufgabeId] ?? 0) + 1;
    }
  }
  $quote = $gesamt > 0 ? (int)round($richtig / $gesamt * 100) : null;
  if ($quote !== null) { $summeQuote += $quote; $mitQuote++; }
  $sims = $d['simulationen'] ?? [];
  usort($sims, fn($a, $b) => strcmp($b['datum'] ?? '', $a['datum'] ?? ''));
  $streakTag = $d['streak']['letzterTag'] ?? '';
  if ($streakTag === $heute) $aktivHeute++;

  $mitglieder[] = [
    'id' => (int)$z['id'],
    'name' => $z['name'],
    'email' => $z['email'],
    'geuebt' => count($d['erledigteAufgaben'] ?? []),
    'quote' => $quote,
    'streak' => (int)($d['streak']['tage'] ?? 0),
    'aktivHeute' => $streakTag === $heute,
    'simulationen' => count($sims),
    'letzteNote' => $sims[0]['note'] ?? null,
    'zuletzt' => $z['aktualisiert'],
  ];
}

arsort($problemZaehler);
$problemAufgaben = [];
foreach (array_slice($problemZaehler, 0, 10, true) as $id => $anzahl) {
  $problemAufgaben[] = ['aufgabeId' => $id, 'schueler' => $anzahl];
}

antwort(200, [
  'mitglieder' => $mitglieder,
  'klasse' => [
    'anzahl' => count($mitglieder),
    'aktivHeute' => $aktivHeute,
    'quoteSchnitt' => $mitQuote > 0 ? (int)round($summeQuote / $mitQuote) : null,
    'problemAufgaben' => $problemAufgaben,
  ],
  'stand' => date('c'),
]);
