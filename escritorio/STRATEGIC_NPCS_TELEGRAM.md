# NPCs estrategicos e Telegram

Este documento registra a camada de NPCs estrategicos adicionada ao Escritorio Virtual. A base original tem 12 NPCs estrategicos; Steve Jobs foi adicionado como extra porque o bot Telegram dele ja foi criado.

## Fonte unica

Os NPCs ficam na tabela `npcs`, no mesmo `channel_id` do escritorio:

`24219fff-5008-465b-994d-077db53e554a`

Nao existe um motor paralelo. Cada NPC usa `openclaw_config` com:

- `agentId`
- `personaConfig.identity`
- `personaConfig.soul`
- `powers.allowedTools`
- `powers.allowedActions`
- `commandCenter.menuBindings`
- `commandCenter.automationRules`
- `commandCenter.telegramRoutes.clientGroups`

## Seed

Rode na raiz de `escritorio`:

```bash
npm run seed:strategic-npcs
```

O script e idempotente: rodar novamente atualiza os NPCs existentes sem duplicar.

## NPCs adicionados

1. Claude Hopkins - Copy Cientifico
2. Eugene Schwartz - Desejo & Mercado
3. Frank Kern - Funis Conversacionais
4. Pedro Sobral - Meta Ads
5. Alex Hormozi - Oferta & Monetizacao
6. Daniel Kahneman - Decisao & Comportamento
7. James Clear - Processos & Habitos
8. Cal Newport - Foco & Operacao Profunda
9. Sam Altman - IA & Produto
10. Taleb - Risco & Antifragilidade
11. Tony Robbins - Vendas & Energia
12. Priscila Zillo - Branding Humanizado
13. Steve Jobs - Produto & Experiencia

## Grupos Telegram vinculados

| Cliente | Chat ID |
|---|---:|
| Starken Tecnologia | `-5125029324` |
| Restaurante Oca | `-5230253545` |
| Academia Sao Pedro | `-5277163335` |
| Arena Gourmet | `-5260098332` |
| Hamburgueria Feio | `-5106159402` |
| Madrugao Centro | `-5289822297` |
| Madrugao Fortaleza | `-5044192212` |
| Madrugao Garcia | `-5267593990` |
| Cota Facil S.F | `-5070819698` |
| Super X Garuva | `-5285438735` |
| Super X Guaratuba | `-5262319336` |
| Suprema Pizza | `-5118825071` |
| Dilokas Pizzaria | `-5025292662` |
| Super X Itapua | `-5249165843` |

## Tokens dos bots

O seed nao grava token real. Para ativar um bot individual, crie o bot no BotFather, adicione no grupo correto e defina a variavel de ambiente indicada em:

`openclaw_config.telegramTokenEnv` e `openclaw_config.telegramSetup.tokenEnv`

Exemplo:

```bash
TELEGRAM_PEDRO_SOBRAL_BOT_TOKEN=123456:abc...
```

Depois reinicie o servidor para o `telegram-manager` detectar o token.

## Rotinas

As rotinas estrategicas entram desativadas por padrao quando sao recorrentes, para evitar envio automatico sem revisao humana. A acao manual por cliente fica ativa:

- revisar contexto do cliente selecionado
- criar nota do cliente
- criar task acionavel
- solicitar aprovacao
- enviar resumo Telegram quando revisado
