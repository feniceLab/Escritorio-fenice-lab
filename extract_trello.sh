#!/bin/bash

KEY="652082e6501f51d8407dcb3e37470ac0"
TOKEN="35a16e0d9fca110aad7105922b07acfdef8b08304bc7ee5162e1ce62e837c32a"
BASE="https://api.trello.com/1"

echo "🔍 Extraindo dados do Trello..."
echo ""

# Pegar todos os boards
echo "📋 Buscando boards..."
BOARDS=$(curl -s "$BASE/members/me/boards?key=$KEY&token=$TOKEN")

echo "$BOARDS" | grep -o '"name":"[^"]*"' | head -10

