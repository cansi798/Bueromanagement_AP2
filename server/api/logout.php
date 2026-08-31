<?php
declare(strict_types=1);
require __DIR__ . '/_lib.php';
verlange_origin();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') antwort(405, ['fehler' => 'POST erwartet']);
$_SESSION = [];
session_destroy();
antwort(200, ['ok' => true]);
