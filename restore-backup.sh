#!/bin/bash

# Kolory
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

BACKUP_DIR="/home/ec2-user/backups"
PROJECT_DIR="/home/ec2-user/stojan-shop"

echo -e "${GREEN}=== RESTORE BACKUP ===${NC}"
echo "Dostępne backupy:"
echo ""

# Lista backupów
select BACKUP in $(ls -1t "$BACKUP_DIR"/backup_*.tar.gz 2>/dev/null); do
    if [ -n "$BACKUP" ]; then
        echo -e "${YELLOW}Wybrany backup: $(basename $BACKUP)${NC}"
        break
    else
        echo -e "${RED}Nieprawidłowy wybór${NC}"
    fi
done

# Potwierdzenie
echo -e "${RED}UWAGA: Ta operacja nadpisze obecne pliki!${NC}"
read -p "Czy na pewno chcesz przywrócić backup? (tak/nie): " confirm

if [ "$confirm" != "tak" ]; then
    echo "Anulowano"
    exit 1
fi

# Zatrzymaj PM2
echo -e "${YELLOW}Zatrzymuję aplikacje...${NC}"
pm2 stop all

# Rozpakuj backup
TEMP_DIR="/tmp/restore_$$"
mkdir -p "$TEMP_DIR"
tar -xzf "$BACKUP" -C "$TEMP_DIR"

BACKUP_NAME=$(basename "$BACKUP" .tar.gz)

# Przywróć frontend
echo -e "${YELLOW}Przywracam frontend...${NC}"
rsync -av --delete \
    --exclude='node_modules' \
    --exclude='.next' \
    "$TEMP_DIR/$BACKUP_NAME/frontend/" "$PROJECT_DIR/frontend/"

# Przywróć backend
echo -e "${YELLOW}Przywracam backend...${NC}"
rsync -av --delete \
    --exclude='node_modules' \
    --exclude='dist' \
    "$TEMP_DIR/$BACKUP_NAME/backend/" "$PROJECT_DIR/backend/"

# Przywróć bazę danych
echo -e "${YELLOW}Przywracam bazę danych...${NC}"
DB_FILE=$(find "$TEMP_DIR/$BACKUP_NAME/database" -name "*.sql.gz" | head -1)
if [ -f "$DB_FILE" ]; then
    gunzip -c "$DB_FILE" | PGPASSWORD="Koszykowka123**" psql -U postgres -h localhost stojan_shop
    echo -e "${GREEN}✓ Baza danych przywrócona${NC}"
fi

# Cleanup
rm -rf "$TEMP_DIR"

# Rebuild
echo -e "${YELLOW}Przebudowuję aplikacje...${NC}"
cd "$PROJECT_DIR/frontend" && npm install && npm run build
cd "$PROJECT_DIR/backend" && npm install && npm run build

# Restart PM2
echo -e "${GREEN}Restartuję aplikacje...${NC}"
pm2 restart all

echo -e "${GREEN}=== RESTORE ZAKOŃCZONY ===${NC}"