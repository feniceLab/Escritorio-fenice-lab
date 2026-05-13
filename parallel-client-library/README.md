# Parallel Client Library

Sistema paralelo para montar uma biblioteca histórica e operacional por cliente sem alterar:

- o app principal `starken-os`
- as tabelas já usadas em produção
- o bucket atual do app

Este módulo cria uma camada nova no mesmo Supabase, com schema lógico baseado em tabelas `library_*`.

## Objetivo

Salvar por cliente, de forma persistida e auditável:

- postagens históricas
- stories
- carrosséis
- reels e vídeos
- documentos
- materiais já existentes
- referências visuais
- slots vazios para branding manual

Regra principal:

- não criar logo fake
- não criar documento fake
- importar apenas o que já existe
- quando faltar algo, registrar em `library_required_slots`

## Estrutura

- `sql/001_parallel_client_library.sql`
  Cria as novas tabelas, índices, RLS, bucket e triggers.
- `scripts/backfill.ts`
  Faz a carga inicial completa.
- `scripts/incremental-sync.ts`
  Roda sincronização incremental.
- `scripts/lib/*`
  Utilitários de parsing, normalização, acesso REST ao Supabase e importação.

## Fontes usadas

O backfill foi desenhado para consolidar:

- `publish_history`
- `content_groups`
- `content_tasks`
- `content_attachments`
- `client_hub`
- `client_hub_materials`
- `SQL_GESTAO_PROJETOS_v2.sql`
- `SQL_CLIENT_HUB_IMPORT.sql`
- `Exportacao Trello/8kSs8AcB - starken-alpha.json`
- relatórios e artefatos locais do repositório

## Variáveis de ambiente

Os scripts não dependem do app principal e usam somente variáveis próprias:

- `LIBRARY_SUPABASE_URL`
- `LIBRARY_SUPABASE_KEY`

Fallbacks aceitos:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_SERVICE_KEY`
- `SUPABASE_ANON_KEY`
- `SUPABASE_KEY`

## Execução

### 1. Criar schema novo no Supabase

Executar o SQL:

`parallel-client-library/sql/001_parallel_client_library.sql`

### 2. Validar parsing local

```bash
npx tsx parallel-client-library/scripts/backfill.ts --dry-run
```

### 3. Backfill completo

```bash
LIBRARY_SUPABASE_URL="https://SEU-PROJETO.supabase.co" \
LIBRARY_SUPABASE_KEY="SUA_CHAVE" \
npx tsx parallel-client-library/scripts/backfill.ts --write
```

### 4. Backfill de um cliente específico

```bash
LIBRARY_SUPABASE_URL="https://SEU-PROJETO.supabase.co" \
LIBRARY_SUPABASE_KEY="SUA_CHAVE" \
npx tsx parallel-client-library/scripts/backfill.ts --write --client "Mortadella Blumenau"
```

### 5. Sync incremental

```bash
LIBRARY_SUPABASE_URL="https://SEU-PROJETO.supabase.co" \
LIBRARY_SUPABASE_KEY="SUA_CHAVE" \
npx tsx parallel-client-library/scripts/incremental-sync.ts --write
```

## O que vai para a biblioteca nova

### Importado como item real

- postagem histórica de `publish_history`
- mídia de `content_attachments`
- material de `client_hub_materials`
- documentos e links reais de `client_hub`
- cards e anexos do export do Trello
- relatórios e artefatos locais detectados

### Registrado como slot vazio

- logo principal
- logo branca
- logo escura
- avatar/favicon
- brand book
- briefing
- PRD
- PRD de design
- guia de tom de voz
- blueprint de landing page

## Observações

- O bucket novo é `brand-library-assets`.
- O bucket atual `client-hub-materials` não é alterado.
- O app principal não é modificado por este módulo.
- Os scripts são idempotentes e usam upsert onde faz sentido.
