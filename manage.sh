#!/bin/bash

# Kolory dla lepszej czytelności
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Ścieżki
FRONTEND_DIR="/home/ec2-user/stojan-shop/frontend"
BACKEND_DIR="/home/ec2-user/stojan-shop/backend"
ECOSYSTEM_FILE="/home/ec2-user/stojan-shop/ecosystem.config.js"

case "$1" in
  start)
    echo -e "${GREEN}Starting applications...${NC}"
    cd /home/ec2-user/stojan-shop
    pm2 start ecosystem.config.js
    pm2 save
    ;;

  stop)
    echo -e "${YELLOW}Stopping applications...${NC}"
    pm2 stop all
    ;;

  restart)
    echo -e "${YELLOW}Restarting applications...${NC}"
    pm2 restart ecosystem.config.js
    ;;

  rebuild)
    echo -e "${GREEN}Rebuilding applications...${NC}"

    # Frontend
    echo -e "${YELLOW}Building frontend...${NC}"
    cd $FRONTEND_DIR
    npm install
    npm run build

    # Backend
    echo -e "${YELLOW}Building backend...${NC}"
    cd $BACKEND_DIR
    npm install
    npm run build

    # Restart PM2
    echo -e "${GREEN}Restarting PM2...${NC}"
    pm2 restart ecosystem.config.js
    ;;

  logs)
    pm2 logs
    ;;

  status)
    pm2 status
    ;;

  monit)
    pm2 monit
    ;;

  setup)
    echo -e "${GREEN}Initial setup...${NC}"

    # Tworzenie folderów na logi
    mkdir -p $FRONTEND_DIR/logs
    mkdir -p $BACKEND_DIR/logs

    # Instalacja PM2 globalnie jeśli nie ma
    if ! command -v pm2 &> /dev/null; then
      echo -e "${YELLOW}Installing PM2...${NC}"
      npm install -g pm2
    fi

    # Build aplikacji
    $0 rebuild

    # Start z PM2
    pm2 start ecosystem.config.js
    pm2 save
    pm2 startup systemd -u ec2-user --hp /home/ec2-user
    ;;

  *)
    echo "Usage: $0 {start|stop|restart|rebuild|logs|status|monit|setup}"
    exit 1
    ;;
esac