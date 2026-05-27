# PLANO DE IMPLEMENTAÇÃO — Escritório Virtual Starken
## Versão 1.0 — 2026-04-27

---

## VISÃO GERAL

O escritório virtual é uma empresa de marketing digital com 18 agentes NPC,
cada um com papel, ferramentas e nível de autonomia definidos.

**CEO:** Lord Stanken (agentId: lord-stanken)
**Modelo base de todos:** openai-codex/gpt-5.4
**Presença:** DeskRPG escritório + OpenClaw TUI + Telegram (CEO e gerentes)

---

## HIERARQUIA DA EMPRESA

```
Lord Stanken (CEO)
├── Lurdinha (Gerente Operacional)
│   ├── Maria (Onboarding de Clientes)
│   ├── Gabi (Gerente de Conta)
│   ├── Téo (Eficiência Operacional)
│   └── Zezin (Monitoramento Proativo)
├── Ravi (Engenharia de Plataforma)
│   ├── Josy (Integrações & Ferramentas)
│   ├── Gaia (Produto & Evolução)
│   └── Maya (Memória & Conhecimento)
├── Diego (Tráfego Pago)
│   └── Clara (Relatórios & Análise)
├── Noel (Conteúdo)
│   ├── Gabriel (Design)
│   ├── Sneider (Design)
│   └── Nina (QA de Publicações)
└── João (Relatórios & Análise de Dados)
    └── Clara (Relatórios)
```

---

## FASE 1 — RENOMEAR LORD STANKEN (CEO)
**Tempo estimado: 30 min**

### 1.1 Renomear agente no OpenClaw
- Renomear agentId de `gael-ceo` para `lord-stanken` no OpenClaw
- Atualizar binding do agente main (TUI) para `lord-stanken`
- Configurar persona do Lord Stanken no BOOT.md do workspace

### 1.2 Atualizar DeskRPG
- Atualizar `openclaw_config.agentId` do NPC Lord Stanken de `gael-ceo` → `lord-stanken`
- Remover NPC duplicado "Noel - Conteudo" (sem acento)

### 1.3 Conectar Telegram
- Configurar bot Telegram via `openclaw channels add telegram`
- Vincular canal Telegram ao agente `lord-stanken`
- Configurar também para: gerente-operacional (Lurdinha), ravi-engenharia-plataforma

---

## FASE 2 — ARQUIVOS DE SOUL, PROMPT E PERSONA
**Tempo estimado: 2-3h**

Para cada agente criar 3 arquivos em `/var/www/starken-os/escritorio/agents/{agentId}/`:
- `soul.md` — Identidade, valores, história, personalidade (300+ linhas)
- `prompt.md` — System prompt operacional, regras de ação (300+ linhas)
- `persona.md` — Como se comporta, tom, estilo, exemplos (300+ linhas)

### Agentes e seus arquivos:
1. lord-stanken/
2. gerente-operacional/
3. maria-onboarding-clientes/
4. joao-relatorios-analise/
5. zezin-monitoramento-proativo/
6. josy-integracoes-ferramentas/
7. gabi-gerente-conta/
8. noel-conteudo/
9. gabriel-design/
10. diego-trafego-pago/
11. clara-relatorios/
12. sneider-design/
13. ravi-engenharia-plataforma/
14. nina-qa-publicacoes/
15. teo-eficiencia-operacional/
16. gaia-produto-e-evolucao/
17. maya-memoria-e-conhecimento/

---

## FASE 3 — REGRAS DE AUTORIZAÇÃO
**Tempo estimado: 1h**

### 3.1 Níveis de Autonomia
- **FULL AUTO**: Age sem perguntar (tarefas rotineiras do papel)
- **NOTIFY**: Age e avisa depois (tarefas urgentes)
- **APPROVE**: Pede aprovação antes (tarefas de impacto)
- **ESCALATE**: Sobe para o CEO (tarefas críticas)

### 3.2 Matriz de Aprovação por Agente
| Agente | FULL AUTO | NOTIFY | APPROVE | ESCALATE |
|--------|-----------|--------|---------|----------|
| Lord Stanken | Decisões estratégicas internas | Mudanças de plano | Gastos >R$1000 | — |
| Lurdinha | Organizar tarefas | Alertas operacionais | Contratar/demitir | Lord Stanken |
| Diego | Ajustar criativos | Pausar campanha | Budget >R$500 | Lord Stanken |
| Ravi | Deploy de features | Breaking changes | Infraestrutura | Lord Stanken |
| Clara | Gerar relatórios | Anomalias | — | Lurdinha |
| Maria | Responder clientes | Onboarding novo | Proposta comercial | Lurdinha |
| Gabi | Atualizar status conta | Churn risk | Cancelamento | Lurdinha |
| Noel | Criar conteúdo | Publicar | Campanha nova | Lord Stanken |
| Gabriel | Criar artes | — | Identidade visual | Noel |
| Sneider | Criar artes | — | Brand manual | Noel |
| Nina | Revisar posts | Bloqueio de post | — | Noel |
| João | Análise de dados | Relatório mensal | — | Lord Stanken |
| Zezin | Monitorar métricas | Alerta crítico | — | Lurdinha |
| Josy | Testar integração | Falha de API | Nova integração | Ravi |
| Gaia | Roadmap features | Release | — | Lord Stanken |
| Maya | Salvar memórias | — | Apagar dados | Lord Stanken |
| Téo | Otimizações | Bottleneck crítico | Processos novos | Lurdinha |

---

## FASE 4 — MCPs POR AGENTE
**Tempo estimado: 1h**

### 4.1 MCPs disponíveis no OpenClaw
- **web** — Pesquisa na web
- **browser** — Controle de navegador
- **acpx** — Agent Control Protocol (comunicação entre agentes)
- **cron** — Tarefas agendadas

### 4.2 Atribuição de MCPs por papel
| Agente | MCPs | Ferramentas externas |
|--------|------|---------------------|
| Lord Stanken | acpx, web, browser, cron | Telegram, todos os agentes |
| Lurdinha | acpx, cron | Todos os agentes, Supabase |
| Diego | web, browser | Meta Ads, Google Ads, relatórios |
| Clara | web | Supabase, planilhas |
| Ravi | acpx, browser | GitHub, Vercel, Supabase, APIs |
| Josy | web, browser | Todas as APIs externas |
| Gaia | acpx | Roadmap, GitHub issues |
| Maya | acpx | Supabase (memórias), histórico |
| Maria | — | CRM, emails |
| Gabi | web | CRM, Stripe |
| Noel | web, browser | Meta, Instagram |
| Gabriel | browser | Figma, Canva |
| Sneider | browser | Figma, Canva |
| Nina | — | Meta publish queue |
| João | web | Supabase, planilhas |
| Zezin | web, cron | Dashboards, métricas |
| Téo | acpx | Processos internos |

---

## FASE 5 — HOOKS POR AGENTE
**Tempo estimado: 1h**

### 5.1 Hooks disponíveis no OpenClaw
- `hooks.internal.enabled` — Hook de inicialização
- `cron` — Execução agendada

### 5.2 Hooks por agente
| Agente | Hook de Inicio | Cron |
|--------|---------------|------|
| Zezin | health-check | A cada 30min — verificar métricas |
| Maya | load-memories | Diário 08:00 — consolidar memórias |
| Clara | — | Semanal seg 09:00 — relatório semanal |
| Nina | — | Diário 07:00 — revisar fila de publicações |
| Téo | — | Semanal sex 17:00 — relatório de eficiência |
| Lord Stanken | briefing-matinal | Diário 08:30 — briefing do dia |
| João | — | Mensal 1° dia — relatório mensal |

---

## FASE 6 — CONEXÃO COM CLAUDE
**Tempo estimado: 30min**

### 6.1 Todos os agentes usam Claude via
- Gateway OpenClaw → Codex (openai-codex/gpt-5.4) — já configurado ✅
- Para agentes que precisam Claude diretamente: via gateway resource anthropic-max

### 6.2 Lord Stanken — acesso especial
- Lord Stanken pode alternar entre Codex (padrão) e Claude Max (análises complexas)
- Configurar `allowModelSwitch: true` na persona

---

## FASE 7 — CRON E AGENDAMENTOS
**Tempo estimado: 30min**

### 7.1 Schedule completo
```
08:00 — Maya: consolidar memórias do dia anterior
08:30 — Lord Stanken: briefing matinal (resumo de pendências)
09:00 seg — Clara: relatório semanal de performance
*/30 * * * — Zezin: health check de métricas
07:00 — Nina: revisar fila de publicações do dia
17:00 sex — Téo: relatório de eficiência semanal
01 * * * — João: relatório mensal (dia 1)
```

---

## ORDEM DE EXECUÇÃO

| # | Tarefa | Arquivo criado |
|---|--------|----------------|
| 1 | Renomear lord-stanken no OpenClaw | — |
| 2 | Atualizar DeskRPG DB (agentId) | — |
| 3 | Criar soul.md de todos os 17 agentes | agents/{id}/soul.md |
| 4 | Criar prompt.md de todos os 17 agentes | agents/{id}/prompt.md |
| 5 | Criar persona.md de todos os 17 agentes | agents/{id}/persona.md |
| 6 | Upload dos prompts para o OpenClaw | openclaw agents update |
| 7 | Configurar Telegram para Lord Stanken | openclaw channels add |
| 8 | Configurar hooks e cron | openclaw cron add |
| 9 | Testar cada agente | teste manual |

---

## STATUS ATUAL

- [x] 19 agentes criados no OpenClaw
- [x] DeskRPG conectado ao OpenClaw (porta 18789)
- [x] Codex OAuth válido (234h)
- [ ] lord-stanken renomeado (gael-ceo → lord-stanken)
- [ ] Arquivos soul/prompt/persona criados
- [ ] Telegram configurado
- [ ] Hooks e cron configurados
- [ ] Device pairing corrigido (causa timeout esporádico)
- [ ] JWT_SECRET atualizado (segurança)
