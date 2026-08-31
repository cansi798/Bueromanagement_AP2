<?php
declare(strict_types=1);
require __DIR__ . '/_lib.php';
$_SESSION = [];
session_destroy();
antwort(200, ['ok' => true]);
