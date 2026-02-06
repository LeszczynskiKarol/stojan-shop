#!/bin/bash

# ============================================
# KONFIGURACJA
# ============================================
BACKUP_DIR="/home/ec2-user/backups"
PROJECT_DIR="/home/ec2-user/stojan-shop"
DB_NAME="stojan_shop"
DB_USER="postgres"
DB_PASSWORD="Koszykowka123**"
DAYS_TO_KEEP=7  # Przechowuj backupy przez 7 dni
MAX_BACKUPS=10  # Maksymalna liczba backupów

# Kolory dla logów
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# ============================================
# FUNKCJE
# ============================================
log_info() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

# ============================================
# TWORZENIE STRUKTURY FOLDERÓW
# ============================================
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
TODAY_BACKUP="$BACKUP_DIR/backup_$TIMESTAMP"

mkdir -p "$TODAY_BACKUP"
mkdir -p "$TODAY_BACKUP/frontend"
mkdir -p "$TODAY_BACKUP/backend"
mkdir -p "$TODAY_BACKUP/database"
mkdir -p "$BACKUP_DIR/logs"

# Log file
LOG_FILE="$BACKUP_DIR/logs/backup_$TIMESTAMP.log"
exec 1> >(tee -a "$LOG_FILE")
exec 2>&1

log_info "=========================================="
log_info "Rozpoczynam backup systemu"
log_info "=========================================="

# ============================================
# BACKUP FRONTEND (bez node_modules)
# ============================================
log_info "Backupuję frontend..."
cd "$PROJECT_DIR/frontend"

# Lista plików/folderów do backupu (wszystko oprócz node_modules i .next)
rsync -av --progress \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='logs' \
    ./ "$TODAY_BACKUP/frontend/" 2>&1 | tail -n 20

if [ $? -eq 0 ]; then
    log_info "✓ Frontend zbackupowany"
else
    log_error "✗ Błąd podczas backupu frontend"
fi

# ============================================
# BACKUP BACKEND (bez node_modules)
# ============================================
log_info "Backupuję backend..."
cd "$PROJECT_DIR/backend"

rsync -av --progress \
    --exclude='node_modules' \
    --exclude='dist' \
    --exclude='logs' \
    ./ "$TODAY_BACKUP/backend/" 2>&1 | tail -n 20

if [ $? -eq 0 ]; then
    log_info "✓ Backend zbackupowany"
else
    log_error "✗ Błąd podczas backupu backend"
fi

# ============================================
# BACKUP BAZY DANYCH PostgreSQL
# ============================================
log_info "Backupuję bazę danych PostgreSQL..."
export PGPASSWORD="$DB_PASSWORD"

pg_dump -U "$DB_USER" -h localhost "$DB_NAME" > "$TODAY_BACKUP/database/${DB_NAME}_$TIMESTAMP.sql"

if [ $? -eq 0 ]; then
    log_info "✓ Baza danych zbackupowana"
    # Kompresuj dump bazy
    gzip "$TODAY_BACKUP/database/${DB_NAME}_$TIMESTAMP.sql"
    log_info "✓ Baza danych skompresowana"
else
    log_error "✗ Błąd podczas backupu bazy danych"
fi

unset PGPASSWORD

# ============================================
# BACKUP PLIKÓW KONFIGURACYJNYCH
# ============================================
log_info "Backupuję pliki konfiguracyjne..."
mkdir -p "$TODAY_BACKUP/configs"

# PM2 ecosystem
cp "$PROJECT_DIR/ecosystem.config.js" "$TODAY_BACKUP/configs/" 2>/dev/null

# Nginx configs
sudo cp /etc/nginx/conf.d/*.conf "$TODAY_BACKUP/configs/" 2>/dev/null
sudo chown ec2-user:ec2-user "$TODAY_BACKUP/configs/"*.conf 2>/dev/null

# .env files
cp "$PROJECT_DIR/frontend/.env.local" "$TODAY_BACKUP/configs/frontend.env.local" 2>/dev/null
cp "$PROJECT_DIR/backend/.env" "$TODAY_BACKUP/configs/backend.env" 2>/dev/null

log_info "✓ Pliki konfiguracyjne zbackupowane"

# ============================================
# KOMPRESJA CAŁEGO BACKUPU
# ============================================
log_info "Kompresuję backup..."
cd "$BACKUP_DIR"
tar -czf "backup_$TIMESTAMP.tar.gz" "backup_$TIMESTAMP"

if [ $? -eq 0 ]; then
    log_info "✓ Backup skompresowany"
    # Usuń nieskompresowany folder
    rm -rf "backup_$TIMESTAMP"
    
    # Oblicz rozmiar
    BACKUP_SIZE=$(du -h "backup_$TIMESTAMP.tar.gz" | cut -f1)
    log_info "Rozmiar backupu: $BACKUP_SIZE"
else
    log_error "✗ Błąd podczas kompresji"
fi

# ============================================
# CZYSZCZENIE STARYCH BACKUPÓW
# ============================================
log_warn "Sprawdzam stare backupy..."

# Metoda 1: Usuń backupy starsze niż X dni
find "$BACKUP_DIR" -name "backup_*.tar.gz" -type f -mtime +$DAYS_TO_KEEP -exec rm {} \; -exec echo "Usunięto stary backup: {}" \;

# Metoda 2: Zachowaj tylko ostatnie X backupów
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/backup_*.tar.gz 2>/dev/null | wc -l)
if [ "$BACKUP_COUNT" -gt "$MAX_BACKUPS" ]; then
    log_warn "Liczba backupów ($BACKUP_COUNT) przekracza limit ($MAX_BACKUPS)"
    ls -1t "$BACKUP_DIR"/backup_*.tar.gz | tail -n +$((MAX_BACKUPS + 1)) | while read old_backup; do
        rm "$old_backup"
        log_warn "Usunięto nadmiarowy backup: $(basename $old_backup)"
    done
fi

# ============================================
# PODSUMOWANIE
# ============================================
log_info "=========================================="
log_info "Backup zakończony!"
log_info "Lokalizacja: $BACKUP_DIR/backup_$TIMESTAMP.tar.gz"
log_info "Aktualna liczba backupów: $(ls -1 "$BACKUP_DIR"/backup_*.tar.gz 2>/dev/null | wc -l)"
log_info "Zajęte miejsce: $(du -sh "$BACKUP_DIR" | cut -f1)"
log_info "=========================================="

# Opcjonalnie: wyślij powiadomienie (jeśli masz skonfigurowane)
# echo "Backup zakończony: $TIMESTAMP" | mail -s "Backup Stojan Shop" admin@example.com