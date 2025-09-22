#! // backend/src/scripts/backup-aws.sh
#!/bin/bash
# Zmienne środowiskowe z AWS
AWS_HOST="localhost"
AWS_DB="stojan_shop"
AWS_USER="postgres"
AWS_PASS="Koszykowka123**"

# Utwórz folder na backup jeśli nie istnieje
mkdir -p ./backups
DATE=$(date +"%Y%m%d_%H%M%S")

TABLES=("products" "categories" "manufacturers" "orders" "users" "blog_posts" "legal_pages" "analytics_sessions" "analytics_events")

echo "Rozpoczynam backup bazy z EC2..."
for TABLE in "${TABLES[@]}"
do
  echo "Backup tabeli: $TABLE"
  PGPASSWORD=$AWS_PASS pg_dump -h $AWS_HOST -U $AWS_USER -d $AWS_DB --table=$TABLE -F c > "./backups/${TABLE}_${DATE}.dump"
  if [ $? -eq 0 ]; then
    echo "✓ Backup tabeli $TABLE zakończony sukcesem"
  else
    echo "✗ Błąd podczas backupu tabeli $TABLE"
  fi
done