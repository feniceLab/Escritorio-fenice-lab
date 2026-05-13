#!/usr/bin/env bash
set -euo pipefail

curl -fsS \
  -H 'Content-Type: application/json' \
  -X POST \
  --data '{"action":"auto_publish_overdue_scheduled","dry_run":false,"user":"Sistema (cron diario)"}' \
  'https://escritorio.starkentecnologia.com.br/api/content'
