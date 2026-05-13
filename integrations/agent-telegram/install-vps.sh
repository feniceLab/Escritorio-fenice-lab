#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="${APP_ROOT:-/var/www/starken-os}"
INTEGRATION_DIR="$APP_ROOT/integrations/agent-telegram"
ENV_FILE="$INTEGRATION_DIR/.env"
SERVICE_FILE="/etc/systemd/system/starken-agent-telegram.service"
USER_NAME="${USER_NAME:-root}"

if [[ ! -d "$INTEGRATION_DIR" ]]; then
  echo "Integration directory not found: $INTEGRATION_DIR" >&2
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  cp "$INTEGRATION_DIR/.env.example" "$ENV_FILE"
  chmod 600 "$ENV_FILE"
  echo "Created $ENV_FILE. Fill bot tokens before starting the service."
fi

mkdir -p "$APP_ROOT/agent-memory" "$APP_ROOT/.runtime/agent-telegram"
chmod 700 "$APP_ROOT/.runtime/agent-telegram" || true

cat > "$SERVICE_FILE" <<EOF
[Unit]
Description=Starken Agent Telegram Router
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=$USER_NAME
WorkingDirectory=$APP_ROOT
Environment=NODE_ENV=production
Environment=AGENT_TELEGRAM_ENV=$ENV_FILE
ExecStartPre=/usr/bin/node $INTEGRATION_DIR/sync-memory.mjs
ExecStart=/usr/bin/node $INTEGRATION_DIR/router.mjs
Restart=always
RestartSec=8
KillSignal=SIGTERM

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
if [[ "${ENABLE_AGENT_TELEGRAM_SERVICE:-0}" == "1" ]]; then
  systemctl enable starken-agent-telegram.service
else
  systemctl disable starken-agent-telegram.service >/dev/null 2>&1 || true
fi

echo "Installed service: starken-agent-telegram.service"
echo "Next:"
echo "  1. Edit $ENV_FILE"
echo "  2. systemctl enable --now starken-agent-telegram"
echo "  3. journalctl -u starken-agent-telegram -f"
