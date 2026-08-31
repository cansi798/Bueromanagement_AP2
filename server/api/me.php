<?php
declare(strict_types=1);
require __DIR__ . '/_lib.php';
$n = aktueller_nutzer();
antwort(200, ['nutzer' => $n ? ['id' => (int)$n['id'], 'email' => $n['email'], 'name' => $n['name'], 'rolle' => $n['rolle']] : null]);
