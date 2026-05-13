# Agent Telegram Router

Integração paralela ao escritório virtual. Ela não altera o gateway do escritório.

Objetivo:

- um bot Telegram por agente;
- um grupo Telegram para os agentes conversarem entre si;
- memória compartilhada por agente;
- OpenClaw como runtime 24h;
- Codex OAuth via OpenClaw, sem depender de OpenAI Platform API Key para chat.

## Arquitetura

```txt
Telegram Bot da Lurdinha
        |
        v
router.mjs -> OpenClaw Gateway -> agente gerente-operacional
        |
        v
agent-memory/lurdinha/

Escritório Virtual -> agente/memória compartilhada <- OpenClaw/Telegram
```

## Memória

Cada agente tem:

```txt
agent-memory/<agente>/
  profile.md
  long-term.md
  telegram-summary.md
  escritorio-summary.md
  working-context.md
  raw/
    telegram/
    escritorio/
    openclaw/
```

O Telegram grava tudo em `raw/telegram`, mantém resumo em `telegram-summary.md` e promove fatos importantes para `long-term.md`.

## Configuração

1. Copie o exemplo:

```bash
cp integrations/agent-telegram/.env.example integrations/agent-telegram/.env
```

2. Preencha:

```bash
OPENCLAW_TOKEN=...
TELEGRAM_LURDINHA_TOKEN=...
TELEGRAM_LORD_STARKEN_TOKEN=...
TELEGRAM_AGENTS_GROUP_ID=...
```

3. Habilite o agente no manifesto ou apenas preencha o token. O roteador liga qualquer agente com token presente.

4. Rode:

```bash
node integrations/agent-telegram/sync-memory.mjs
node integrations/agent-telegram/router.mjs
```

## VPS

```bash
sudo bash integrations/agent-telegram/install-vps.sh
sudo nano /var/www/starken-os/integrations/agent-telegram/.env
sudo systemctl start starken-agent-telegram
sudo journalctl -u starken-agent-telegram -f
```

## Grupo dos agentes

Para o grupo funcionar bem:

- adicione todos os bots no grupo;
- no BotFather, desative privacy mode dos bots que devem ouvir o grupo;
- preencha `TELEGRAM_AGENTS_GROUP_ID`;
- mencione os agentes por alias: `Lord Starken`, `Lurdinha`, `Josy`, etc.

Se ninguém for mencionado, a mensagem vai para o agente padrão do grupo definido no manifesto.

## Lord Starken

O nome público canônico é `Lord Starken`.

Ele pode manter aliases como:

- Lord Starken
- Lorde Stark
- Gael
- Gael Ceo

O OpenClaw agentId continua `gael-ceo` para preservar compatibilidade.
