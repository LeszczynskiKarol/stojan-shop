#!/bin/bash
DB_NAME="stojan_shop"
DB_USER="postgres"
DB_PASS="Koszykowka123**"

echo "Czyszczę bazę danych..."

PGPASSWORD=$DB_PASS psql -h localhost -U $DB_USER -d $DB_NAME << EOF
BEGIN;
-- Wyłączamy tymczasowo sprawdzanie kluczy obcych
SET session_replication_role = 'replica';

-- Usuwanie wszystkich tabel w odpowiedniej kolejności
DROP TABLE IF EXISTS product_categories CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS manufacturers CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS blog_posts CASCADE;
DROP TABLE IF EXISTS legal_pages CASCADE;
DROP TABLE IF EXISTS analytics_sessions CASCADE;
DROP TABLE IF EXISTS analytics_events CASCADE;

-- Przywracamy sprawdzanie kluczy obcych
SET session_replication_role = 'origin';
COMMIT;
EOF

echo "Baza danych wyczyszczona!"