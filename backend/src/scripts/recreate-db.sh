#!/bin/bash
DB_NAME="stojan_shop"
DB_USER="postgres"
DB_PASS="Koszykowka123**"

echo "Usuwam i tworzę bazę danych od nowa..."

# Rozłączamy wszystkie połączenia
PGPASSWORD=$DB_PASS psql -h localhost -U $DB_USER -d postgres -c "
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = '$DB_NAME'
AND pid <> pg_backend_pid();"

# Usuwamy i tworzymy bazę od nowa
PGPASSWORD=$DB_PASS psql -h localhost -U $DB_USER -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"
PGPASSWORD=$DB_PASS psql -h localhost -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;"

# Tworzymy potrzebne rozszerzenia
PGPASSWORD=$DB_PASS psql -h localhost -U $DB_USER -d $DB_NAME -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"

echo "Baza danych utworzona od nowa!"