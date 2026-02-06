#!/bin/bash
LOCAL_DB="stojan_shop"
LOCAL_USER="postgres"
LOCAL_PASS="Koszykowka123**"

echo "Rozpoczynam przywracanie bazy danych lokalnie..."

# Kolejność jest ważna ze względu na klucze obce:
TABLES=(
  "manufacturers"  # najpierw producenci
  "categories"     # potem kategorie
  "products"       # potem produkty
  "product_categories"  # potem powiązania
  "orders" 
  "users" 
  "blog_posts" 
  "legal_pages" 
  "analytics_sessions" 
  "analytics_events"
)

for TABLE in "${TABLES[@]}"
do
  echo "Przywracanie tabeli $TABLE..."
  PGPASSWORD=$LOCAL_PASS pg_restore -h localhost -U $LOCAL_USER -d $LOCAL_DB \
    --clean --if-exists --disable-triggers \
    --no-owner --no-privileges \
    --table=$TABLE "./backups/${TABLE}_20250210_163051.dump"
done

echo "Zakończono proces przywracania bazy danych"