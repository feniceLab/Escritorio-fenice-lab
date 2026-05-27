#!/bin/bash
set -e
REPO="git@github.com:feniceLab/Escritorio-fenice-lab.git"
DIR="fenix-lab"
echo "=== Fenix Lab Setup Local ==="
if [ ! -d "$DIR" ]; then
  git clone "$REPO" "$DIR"
fi
cd "$DIR"
git pull origin main
cd escritorio
npm install
if [ ! -f ".env.local" ]; then
  cp .env.example .env.local
  echo "ATENCAO: Edite .env.local com as credenciais."
else
  echo ".env.local ja existe."
fi
echo "Pronto! Dev: cd fenix-lab/escritorio && npm run dev"
