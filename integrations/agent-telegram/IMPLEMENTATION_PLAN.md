# Plano de Implementação - Agentes Telegram 24h

## Fase 1 - Base segura

- Manter o gateway do escritório intocado.
- Criar manifesto canônico dos agentes.
- Criar memória compartilhada por agente.
- Criar serviço separado `starken-agent-telegram`.

## Fase 2 - Lord Starken e Lurdinha

- Configurar bot do Lord Starken.
- Configurar bot da Lurdinha.
- Validar conversa direta com cada bot.
- Confirmar que ambos usam OpenClaw/Codex OAuth.
- Validar escrita em `telegram-summary.md` e `long-term.md`.

## Fase 3 - Grupo dos agentes

- Criar grupo Telegram dos agentes.
- Adicionar bots.
- Desativar privacy mode quando necessário.
- Configurar `TELEGRAM_AGENTS_GROUP_ID`.
- Testar menção: `Lurdinha, fale com a Josy...`.

## Fase 4 - Espelhamento com escritório

- Enviar resumo Telegram -> `escritorio-summary.md`/eventos do escritório.
- Enviar resumo escritório -> `telegram-summary.md`.
- Exibir atividade externa do agente no painel do escritório.

## Fase 5 - Todos os agentes

- Adicionar Josy, Sneider, Nina, Ravi, Maria, Joao, Zezin, Teo, Gaia e Maya.
- Testar cada bot.
- Testar comunicação entre agentes no grupo.

## Fase 6 - Remover rotas de API Key

- Desabilitar plugin OpenAI no OpenClaw se não for usado.
- Remover `OPENAI_API_KEY` de ambientes que não precisam.
- Monitorar logs de uso após mensagens de Telegram.
