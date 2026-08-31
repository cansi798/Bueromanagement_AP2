-- KBM Prüfungscoach — Datenbankschema für MySQL/MariaDB (ALL-INKL)
-- Import: KAS → Datenbanken → phpMyAdmin → Importieren → diese Datei wählen.
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS klassen (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  erstellt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS nutzer (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  klasse_id INT UNSIGNED NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL DEFAULT '',
  pass_hash VARCHAR(255) NOT NULL,
  rolle ENUM('admin','schueler') NOT NULL DEFAULT 'schueler',
  fehlversuche TINYINT UNSIGNED NOT NULL DEFAULT 0,
  gesperrt_bis DATETIME NULL,
  reset_token VARCHAR(64) NULL,
  reset_gueltig_bis DATETIME NULL,
  zwei_fa_code VARCHAR(64) NULL,
  zwei_fa_gueltig_bis DATETIME NULL,
  zwei_fa_versuche TINYINT UNSIGNED NOT NULL DEFAULT 0,
  erstellt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_nutzer_klasse FOREIGN KEY (klasse_id)
    REFERENCES klassen(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS fortschritt (
  nutzer_id INT UNSIGNED PRIMARY KEY,
  daten LONGTEXT NOT NULL,             -- JSON: 1:1 der localStorage-Stand der App
  aktualisiert TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_fortschritt_nutzer FOREIGN KEY (nutzer_id)
    REFERENCES nutzer(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
