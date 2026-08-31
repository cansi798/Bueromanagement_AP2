<?php
declare(strict_types=1);
require __DIR__ . '/_lib.php';
// Liefert eine neue Rechenaufgabe für das Login-Formular.
antwort(200, captcha_neu());
