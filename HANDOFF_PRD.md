# Handoff PRD — Integração Operacional Starken (Asana & Trello)

Este documento resume todo o progresso realizado para que o desenvolvimento possa ser continuado suavemente via Claude Code ou outro agente.

---

## 1. Visão Geral do Projeto
Transformar o sistema Starken Performance (estático) em um orquestrador operacional usando **Vercel Serverless Functions** como backend proxy para as APIs do Asana e Trello.

---

## 2. Arquitetura Implementada

- **Frontend:** `checklist-relatorios.html` (Single Page Application).
- **Backend:** Pasta `/api` no diretório raiz, configurada para Vercel Functions.
- **Banco de Dados:** Supabase (existente, mas precisa de novas tabelas para o operacional).
- **Integrações:**
  - **Asana:** Gestão de tarefas em 3 pilares (Conteúdo, Tráfego, Criativos).
  - **Trello:** Exportação e migração legada para o Asana.

---

## 3. Progresso das Fases (PRD v4.0)

### ✅ Fase 1: Fundação & Migração Trello (CONCLUÍDA)
- **APIs Criadas:**
  - `api/trello/export.js`: Lista boards e exporta JSON estruturado.
  - `api/trello/migrate.js`: Converte cards do Trello em tasks no Asana com mapeamento de seções.
- **Interface UI:**
  - Nova aba "Tarefas (Asana)" na sidebar.
  - Modal de Configuração com botão "Migrar do Trello".
  - Fluxo de migração passo-a-passo (Select Board -> Map Lists -> Execute).
- **Asana Core:**
  - `api/asana/projects.js`, `sections.js`, `tasks.js`, `config.js` (CRUD completo).

### ⏳ Fase 2: Provisionamento Zero-Touch (PRÓXIMA ETAPA)
- **Objetivo:** Botão "Provisionar Cliente" que cria automaticamente os 3 projetos no Asana.
- **Pendência:** Criar tabelas no Supabase (ver `implementation_plan.md`).

---

## 4. Arquivos Relevantes no Repositório

```text
/
├── api/
│   ├── asana/
│   │   ├── config.js     # Validação de PAT e mapeamento local
│   │   ├── projects.js   # Listagem de projetos
│   │   ├── sections.js   # Listagem de seções
│   │   └── tasks.js      # GET/POST/PUT de tarefas
│   └── trello/
│       ├── export.js     # Extração de dados do Trello
│       └── migrate.js    # Inserção no Asana
├── checklist-relatorios.html # Frontend (JS injetado ao final)
├── package.json          # Dependências do Vercel
└── vercel.json           # Configuração de rewrites
```

---

## 5. Credenciais e Configurações (Ambiente)

O projeto depende das seguintes **Environment Variables** no Vercel (Devem ser configuradas manualmente no dashboard da Vercel para o Project ID `prj_faOARNS8ONgxAAbwjq4PJzmLbzmI`):

- `ASANA_PAT`: `2/1213720645962709/1213723115016342:c757cd050ad985f081dbe81c1dfbc549`
- `TRELLO_KEY`: `652082e6501f51d8407dcb3e37470ac0`
- `TRELLO_TOKEN`: `35a16e0d9fca110aad7105922b07acfdef8b08304bc7ee5162e1ce62e837c32a`
- `SUPABASE_SERVICE_KEY`: `sbp_2304e595ec570665a5b5ad16c8f97f88699a30fc`

---

## 6. Instruções para o Próximo Agente

1. **Testar Fase 1:** Com as Env Vars no Vercel, o botão "Migrar do Trello" deve funcionar imediatamente.
2. **Executar Tabelas SQL:** Use a `SUPABASE_SERVICE_KEY` para criar as tabelas SQL listadas no `implementation_plan.md`.
3. **Desenvolver `api/asana/provision.js`:** Seguir a lógica de criação de 3 projetos (Conteúdo, Tráfego, Criativos) com Custom Fields.
4. **Implementar Webhooks:** Criar o endpoint de recepção para o Hand-off automático.
