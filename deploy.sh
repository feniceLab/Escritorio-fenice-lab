#!/bin/bash
set -e

PROJECT="/var/www/fenix-lab/escritorio"
LOG="/var/www/fenix-lab/deploy.log"

echo "========================================" >> $LOG
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Deploy iniciado" >> $LOG

cd $PROJECT

# Salvar .env.local antes do pull
cp .env.local /tmp/env.local.bak 2>/dev/null || true

# Puxar última versão
git pull origin main >> $LOG 2>&1

# Restaurar .env.local (nunca sobrescrever com versão do repo)
cp /tmp/env.local.bak .env.local 2>/dev/null || true

# Instalar dependências novas se houver
npm install --production=false >> $LOG 2>&1

# Build
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Iniciando build..." >> $LOG
if npm run build >> $LOG 2>&1; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Build OK — reiniciando PM2..." >> $LOG
  pm2 restart fenix-lab >> $LOG 2>&1
  pm2 save >> $LOG 2>&1
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Deploy concluído com sucesso!" >> $LOG
else
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] BUILD FALHOU — mantendo versão anterior" >> $LOG
  exit 1
fi
