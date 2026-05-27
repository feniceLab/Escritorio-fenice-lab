# PRD — Centro de Informacoes do Cliente (Client Information Hub)

**Projeto:** Starken OS
**Versao:** 1.0
**Data:** 2026-03-20
**Autor:** Juan (Starken Performance)
**Status:** Rascunho para Aprovacao

---

## Indice

1. [Resumo Executivo](#1-resumo-executivo)
2. [User Stories](#2-user-stories)
3. [Detalhamento de Features](#3-detalhamento-de-features)
4. [Modelo de Dados](#4-modelo-de-dados)
5. [Design da API](#5-design-da-api)
6. [Especificacoes de UI/UX](#6-especificacoes-de-uiux)
7. [Pontos de Integracao](#7-pontos-de-integracao)
8. [Integracao Google Drive](#8-integracao-google-drive)
9. [Fundacao para Agente IA](#9-fundacao-para-agente-ia)
10. [Arquitetura Tecnica](#10-arquitetura-tecnica)
11. [Plano de Migracao](#11-plano-de-migracao)
12. [Riscos e Mitigacoes](#12-riscos-e-mitigacoes)
13. [Metricas de Sucesso](#13-metricas-de-sucesso)
14. [Fases de Implementacao](#14-fases-de-implementacao)

---

## 1. Resumo Executivo

### O Que

O **Centro de Informacoes do Cliente** e um hub centralizado dentro do Starken OS que consolida todos os dados contextuais de cada cliente: identidade visual, links de materiais, perfis de redes sociais, tom de voz, publico-alvo, referencias e materiais de producao. Ele substitui a pratica atual de buscar informacoes dispersas em Google Drive, conversas de WhatsApp e memoria dos colaboradores.

### Por Que

1. **Eficiencia operacional**: A equipe (3 pessoas) gerencia 35 clientes entre 2 tenants. Cada vez que um post e criado, alguem precisa lembrar ou procurar cores, fontes, tom de voz e links do cliente. Isso consome tempo repetidamente.

2. **Fundacao para IA**: O hub sera a fonte de contexto para um futuro agente de IA que gerara conteudo automaticamente. Sem dados estruturados, o agente nao tem como produzir conteudo alinhado a marca do cliente.

3. **Onboarding de clientes**: Quando um novo cliente entra, a equipe precisa de um lugar padrao para registrar todas as informacoes. Hoje isso e fragmentado.

4. **Consistencia de marca**: Com dados centralizados, qualquer membro da equipe pode produzir conteudo fiel a identidade do cliente, mesmo sem historico previo com aquele cliente.

### Para Quem

- **Juan** (admin): Cadastra informacoes completas dos clientes, configura identidade visual, gerencia links e materiais.
- **Henrique** (executor): Consulta rapidamente cores, fontes, tom de voz e referencias ao criar conteudo e design.
- **Emily** (editor): Acessa briefings, tom de voz e publico-alvo para escrever copies e legendas.

### Restricoes Tecnicas Inegociaveis

| Restricao | Impacto |
|-----------|---------|
| Zero novas funcoes Vercel | Multiplexar em `api/content.js` (15 actions atuais) OU reaproveitar `api/asana/tasks.js` |
| SPA monolitica | Todo frontend em `checklist-relatorios.html` |
| Sem framework | Vanilla HTML/CSS/JS |
| 3 temas obrigatorios | Light, Dark, Warm — todas as telas devem respeitar CSS variables |
| Push via GitHub Desktop | Sem CLI auth |
| UI em pt-BR, codigo em ingles | Padrao existente no projeto |

---

## 2. User Stories

### 2.1 Essenciais (MVP)

| ID | Como... | Quero... | Para... |
|----|---------|----------|---------|
| US-01 | operador da equipe | acessar um painel centralizado com todas as informacoes de um cliente | nao precisar buscar dados em lugares diferentes |
| US-02 | operador | cadastrar e editar cores, fontes e tom de voz de um cliente | manter a identidade visual acessivel |
| US-03 | operador | salvar links do Google Drive, site e redes sociais do cliente | ter acesso rapido a todos os recursos |
| US-04 | operador | ver um resumo do publico-alvo e persona do cliente | direcionar conteudo adequadamente |
| US-05 | operador | acessar o hub direto pela sidebar, clicando no cliente | ter fluxo rapido sem navegacao extra |
| US-06 | operador | ver o hub integrado com a Gestao de Conteudo | criar tarefas ja com contexto do cliente |

### 2.2 Importantes (V2)

| ID | Como... | Quero... | Para... |
|----|---------|----------|---------|
| US-07 | operador | fazer upload de logo e materiais de referencia | ter tudo no sistema, sem depender do Drive |
| US-08 | operador | definir categorias de conteudo preferidas por cliente | padronizar a producao |
| US-09 | operador | ver um historico de posts publicados dentro do hub | ter contexto do que ja foi feito |
| US-10 | operador | navegar pastas do Google Drive inline | nao precisar sair do sistema |

### 2.3 Futuras (V3 — Agente IA)

| ID | Como... | Quero... | Para... |
|----|---------|----------|---------|
| US-11 | operador | que o agente IA leia o hub e gere sugestoes de post | acelerar a producao de conteudo |
| US-12 | operador | que o agente gere um cronograma semanal baseado no contexto | automatizar planejamento |
| US-13 | operador | que campanhas sejam criadas com base no hub | reduzir trabalho manual de trafego |

---

## 3. Detalhamento de Features

### Fase 1 — MVP (Fundacao)

#### F1.1 Perfil do Cliente (Dados Basicos)
- Nome, segmento, responsavel, status (ativo/standby/encerrado)
- Contrato: data inicio, valor, pacote
- Contatos: telefone, email, WhatsApp do cliente
- Notas gerais (campo texto livre)

#### F1.2 Identidade Visual
- **Cores**: Ate 6 cores com hex code e nome (ex: "Azul Primario" #3b82f6)
- **Fontes**: Fonte titulo, fonte corpo, fonte destaque (nome + link Google Fonts se aplicavel)
- **Logo**: URL do logo principal + variacoes (claro, escuro, monocromatico)
- **Estilo visual**: Tags (ex: "minimalista", "colorido", "moderno", "rustico")

#### F1.3 Voz e Comunicacao
- **Tom de voz**: Descricao textual (ex: "informal, divertido, usa emojis, evita termos tecnicos")
- **Palavras-chave**: Lista de termos que o cliente usa/quer usar
- **Palavras proibidas**: Termos a evitar
- **Persona**: Descricao do publico-alvo (idade, genero, interesses, comportamento)
- **Exemplos de copy**: Ate 5 exemplos de copies aprovadas pelo cliente

#### F1.4 Links e Recursos
- **Google Drive**: Link da pasta principal de materiais
- **Site**: URL do site + links de paginas especificas (cardapio, servicos, etc.)
- **Redes sociais**: Instagram, Facebook, TikTok, LinkedIn, YouTube (URLs)
- **Link de aprovacao**: URL onde o cliente aprova conteudo (se aplicavel)
- **Outros links**: Lista dinamica de label + URL

#### F1.5 Navegacao Integrada
- Sidebar: Clicar em cliente abre o Hub como aba padrao
- Toggle rapido entre Hub e Gestao de Conteudo
- Breadcrumb: Tenant > Cliente > [Hub / Conteudo / Calendario]

### Fase 2 — Enriquecimento

#### F2.1 Materiais e Uploads
- Upload de arquivos de referencia (imagens, PDFs) via Supabase Storage
- Categorias: Logo, Foto de Produto, Template, Referencia Visual, Documento
- Preview inline (imagens) e download (PDFs)
- Lightbox para visualizar imagens em tamanho real

#### F2.2 Historico de Conteudo
- Resumo dos ultimos 20 posts publicados (puxado de `publish_history`)
- Filtro por plataforma (FB/IG) e tipo (imagem/carrossel/video)
- Link para abrir post original na plataforma

#### F2.3 Preferencias de Conteudo
- Tipos de conteudo preferidos (feed, stories, reels, carrossel)
- Frequencia de postagem desejada (X posts por semana)
- Melhores horarios para publicar
- Temas/editorias recorrentes (ex: "promo segunda", "bastidores quarta")

#### F2.4 Google Drive Browser (Links Inteligentes)
- Lista de pastas do Drive com nome amigavel e link direto
- Separacao por categoria: Logos, Fotos, Templates, Videos, Documentos
- Icones visuais por tipo de arquivo
- Botao "Abrir no Drive" em nova aba

### Fase 3 — Agente IA

#### F3.1 Contexto Estruturado para IA
- Endpoint que retorna todo o contexto do cliente em formato JSON otimizado
- Inclui: identidade visual, tom de voz, persona, historico recente, preferencias
- Formato pensado para ser injetado como system prompt de um LLM

#### F3.2 Google Drive API (Opcional)
- Autenticacao via Service Account do Google
- Browse de pastas e arquivos inline no Starken OS
- Preview de imagens direto no sistema
- Requer: Google Cloud project + credenciais + escopo de permissoes

---

## 4. Modelo de Dados

### 4.1 Visao Geral

O hub usa uma abordagem hibrida: uma tabela principal `client_hub` com campos estruturados para dados frequentes + campos JSONB para dados flexiveis. Tabelas auxiliares para materiais (uploads) e links.

### 4.2 Nova Tabela: `client_hub`

```sql
-- ============================================================
-- CLIENT HUB — Centro de Informacoes do Cliente
-- Tabela principal com dados estruturados + JSONB flexivel
-- ============================================================

CREATE TABLE IF NOT EXISTS client_hub (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificacao (vincula ao slug do meta_config e ao client_id do content system)
  client_slug TEXT NOT NULL UNIQUE,         -- Ex: "mortadella-blumenau" (mesmo slug do meta_config)
  client_name TEXT NOT NULL,                -- Nome de exibicao
  tenant TEXT NOT NULL CHECK (tenant IN ('starken', 'alpha')),

  -- Dados basicos
  segment TEXT,                              -- Segmento do negocio
  responsible TEXT,                           -- Nome do responsavel na equipe
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'standby', 'encerrado')),
  client_phone TEXT,                         -- Telefone/WhatsApp do cliente
  client_email TEXT,                         -- Email do cliente
  client_contact_name TEXT,                  -- Nome do contato principal no cliente

  -- Contrato
  contract_start DATE,
  contract_value TEXT,                       -- Ex: "R$ 2.500/mes"
  contract_package TEXT,                     -- Ex: "12 posts + 8 stories + trafego"

  -- Links principais
  website_url TEXT,
  drive_folder_url TEXT,                     -- Link principal do Google Drive
  approval_url TEXT,                         -- Link de aprovacao de conteudo

  -- Identidade Visual (JSONB para flexibilidade)
  brand_colors JSONB DEFAULT '[]',
  -- Formato: [{"name": "Azul Primario", "hex": "#3b82f6"}, {"name": "Vermelho Acento", "hex": "#ef4444"}]

  brand_fonts JSONB DEFAULT '{}',
  -- Formato: {"title": "Montserrat", "body": "Open Sans", "accent": "Playfair Display", "title_url": "...", "body_url": "..."}

  brand_style_tags JSONB DEFAULT '[]',
  -- Formato: ["minimalista", "colorido", "moderno"]

  logo_url TEXT,                             -- URL do logo principal (Supabase Storage)
  logo_variations JSONB DEFAULT '{}',
  -- Formato: {"light": "url", "dark": "url", "mono": "url", "icon": "url"}

  -- Voz e Comunicacao
  tone_of_voice TEXT,                        -- Descricao textual do tom de voz
  keywords JSONB DEFAULT '[]',               -- ["promo", "delivery", "artesanal"]
  forbidden_words JSONB DEFAULT '[]',        -- ["barato", "desconto"]
  persona_description TEXT,                  -- Descricao do publico-alvo
  copy_examples JSONB DEFAULT '[]',
  -- Formato: [{"text": "Exemplo de copy aprovada", "context": "Post de promo", "date": "2026-03"}]

  -- Redes Sociais
  social_links JSONB DEFAULT '{}',
  -- Formato: {"instagram": "url", "facebook": "url", "tiktok": "url", "linkedin": "url", "youtube": "url"}

  -- Preferencias de Conteudo (V2)
  content_preferences JSONB DEFAULT '{}',
  -- Formato: {
  --   "types": ["feed", "stories", "reels"],
  --   "frequency": "3x semana",
  --   "best_times": ["12:00", "18:00", "20:00"],
  --   "recurring_themes": [{"day": "segunda", "theme": "promo"}, {"day": "quarta", "theme": "bastidores"}]
  -- }

  -- Links adicionais (lista dinamica)
  extra_links JSONB DEFAULT '[]',
  -- Formato: [{"label": "Cardapio", "url": "https://..."}, {"label": "iFood", "url": "https://..."}]

  -- Drive folders organizadas (V2)
  drive_folders JSONB DEFAULT '[]',
  -- Formato: [{"name": "Logos", "url": "https://drive.google.com/...", "category": "logo"},
  --           {"name": "Fotos Produtos", "url": "https://drive.google.com/...", "category": "photo"}]

  -- Notas
  notes TEXT,                                -- Anotacoes livres

  -- Metadados
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  updated_by TEXT
);

-- Indexes
CREATE INDEX idx_client_hub_slug ON client_hub(client_slug);
CREATE INDEX idx_client_hub_tenant ON client_hub(tenant);
CREATE INDEX idx_client_hub_status ON client_hub(status);
CREATE INDEX idx_client_hub_responsible ON client_hub(responsible);

-- RLS
ALTER TABLE client_hub ENABLE ROW LEVEL SECURITY;
CREATE POLICY "client_hub_all" ON client_hub FOR ALL USING (true) WITH CHECK (true);
```

### 4.3 Nova Tabela: `client_hub_materials`

```sql
-- ============================================================
-- CLIENT HUB MATERIALS — Arquivos e materiais do cliente
-- Uploads via Supabase Storage
-- ============================================================

CREATE TABLE IF NOT EXISTS client_hub_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_slug TEXT NOT NULL REFERENCES client_hub(client_slug) ON DELETE CASCADE,

  -- Arquivo
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,                    -- URL publica do Supabase Storage
  file_type TEXT,                            -- MIME type (image/png, application/pdf, etc.)
  file_size INTEGER,                         -- Bytes
  thumbnail_url TEXT,                        -- Para preview (opcional, imagens ja servem como proprio thumbnail)

  -- Organizacao
  category TEXT CHECK (category IN ('logo', 'product_photo', 'template', 'reference', 'document', 'other')),
  description TEXT,                          -- Descricao curta do material
  tags JSONB DEFAULT '[]',                   -- ["principal", "natal-2026", "cardapio"]

  -- Metadados
  uploaded_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_hub_materials_slug ON client_hub_materials(client_slug);
CREATE INDEX idx_hub_materials_category ON client_hub_materials(category);

ALTER TABLE client_hub_materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hub_materials_all" ON client_hub_materials FOR ALL USING (true) WITH CHECK (true);
```

### 4.4 Nova Tabela: `client_hub_activity`

```sql
-- ============================================================
-- CLIENT HUB ACTIVITY — Log de alteracoes no hub
-- ============================================================

CREATE TABLE IF NOT EXISTS client_hub_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_slug TEXT NOT NULL REFERENCES client_hub(client_slug) ON DELETE CASCADE,
  actor TEXT NOT NULL,                       -- Nome do usuario
  action TEXT NOT NULL,                      -- 'created', 'updated_brand', 'uploaded_material', etc.
  field_changed TEXT,                        -- Qual campo foi alterado
  details JSONB,                             -- Detalhes adicionais
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_hub_activity_slug ON client_hub_activity(client_slug);
CREATE INDEX idx_hub_activity_created ON client_hub_activity(created_at DESC);

ALTER TABLE client_hub_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hub_activity_all" ON client_hub_activity FOR ALL USING (true) WITH CHECK (true);
```

### 4.5 Supabase Storage Bucket

```sql
-- Criar bucket para materiais do hub
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-hub-materials', 'client-hub-materials', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: permitir upload/download publico (via service key na API)
CREATE POLICY "hub_materials_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'client-hub-materials');

CREATE POLICY "hub_materials_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'client-hub-materials');

CREATE POLICY "hub_materials_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'client-hub-materials');
```

### 4.6 Diagrama de Relacoes

```
meta_config (JSONB blob, slug-keyed)
    |
    | client_slug (shared key)
    v
client_hub (1 row per client)
    |
    |--- client_hub_materials (N materials per client)
    |--- client_hub_activity (N log entries per client)
    |
    | client_slug links to...
    v
content_tasks (via client_id = client_slug in content system)
publish_history (via client identifier)
```

---

## 5. Design da API

### 5.1 Estrategia: Reaproveitar `api/asana/tasks.js`

A funcao `api/asana/tasks.js` (Asana integration, descontinuada) sera **completamente reescrita** como `api/asana/tasks.js` servindo de endpoint multiplexado para o Client Hub. O path permanece `/api/asana/tasks` mas o conteudo sera totalmente novo.

> **Motivo**: Evita criar nova funcao Vercel (0 slots disponiveis). O endpoint legado Asana nao e mais utilizado.

**Endpoint**: `POST /api/asana/tasks`
**Parametro de roteamento**: `action` (no body JSON)

### 5.2 Actions do Client Hub

| Action | Metodo | Descricao |
|--------|--------|-----------|
| `hub_get` | POST | Retorna dados completos de 1 cliente pelo slug |
| `hub_list` | POST | Lista resumo de todos os clientes de um tenant |
| `hub_upsert` | POST | Cria ou atualiza dados do hub de um cliente |
| `hub_delete` | POST | Remove hub de um cliente (soft delete via status) |
| `hub_upload_material` | POST | Registra material no banco (upload real via Supabase Storage JS client) |
| `hub_delete_material` | POST | Remove material |
| `hub_list_materials` | POST | Lista materiais de um cliente |
| `hub_get_context` | POST | Retorna contexto otimizado para IA (V3) |
| `hub_activity` | POST | Lista log de atividades de um cliente |
| `hub_bulk_init` | POST | Inicializa hubs para multiplos clientes (migracao) |

### 5.3 Especificacao Detalhada das Actions

#### `hub_get`

```json
// Request
{
  "action": "hub_get",
  "client_slug": "mortadella-blumenau"
}

// Response
{
  "id": "uuid",
  "client_slug": "mortadella-blumenau",
  "client_name": "Mortadella Blumenau",
  "tenant": "starken",
  "segment": "Gastronomia",
  "brand_colors": [{"name": "Vermelho", "hex": "#dc2626"}],
  "tone_of_voice": "Informal, divertido, usa emojis...",
  "social_links": {"instagram": "https://instagram.com/mortadellabnu"},
  // ... all fields
  "materials_count": 12,
  "recent_posts_count": 8
}
```

#### `hub_list`

```json
// Request
{
  "action": "hub_list",
  "tenant": "starken"  // optional, returns all if omitted
}

// Response
[
  {
    "client_slug": "mortadella-blumenau",
    "client_name": "Mortadella Blumenau",
    "tenant": "starken",
    "segment": "Gastronomia",
    "status": "ativo",
    "responsible": "Juan",
    "has_brand": true,      // brand_colors is not empty
    "has_voice": true,      // tone_of_voice is not empty
    "materials_count": 12,
    "completeness": 75      // % of fields filled
  }
]
```

#### `hub_upsert`

```json
// Request
{
  "action": "hub_upsert",
  "client_slug": "mortadella-blumenau",
  "user": "Juan",
  "data": {
    "client_name": "Mortadella Blumenau",
    "tenant": "starken",
    "brand_colors": [
      {"name": "Vermelho Principal", "hex": "#dc2626"},
      {"name": "Branco", "hex": "#ffffff"}
    ],
    "tone_of_voice": "Informal, divertido, jovem. Usa emojis com moderacao.",
    "social_links": {
      "instagram": "https://instagram.com/mortadellabnu",
      "facebook": "https://facebook.com/mortadellabnu"
    }
    // ... partial update, only send changed fields
  }
}

// Response: full updated record
```

#### `hub_upload_material`

```json
// Request
{
  "action": "hub_upload_material",
  "client_slug": "mortadella-blumenau",
  "user": "Juan",
  "file_name": "logo-principal.png",
  "file_url": "https://cpwpxckmuecejtkcobre.supabase.co/storage/v1/object/public/client-hub-materials/mortadella-blumenau/logo-principal.png",
  "file_type": "image/png",
  "file_size": 245000,
  "category": "logo",
  "description": "Logo principal com fundo transparente"
}

// Response: created material record
```

#### `hub_get_context` (V3 — Agente IA)

```json
// Request
{
  "action": "hub_get_context",
  "client_slug": "mortadella-blumenau",
  "include_history": true,
  "history_limit": 10
}

// Response: Contexto otimizado para injecao em prompt de LLM
{
  "client": "Mortadella Blumenau",
  "segment": "Gastronomia",
  "brand": {
    "colors": ["#dc2626", "#ffffff"],
    "fonts": {"title": "Montserrat Bold", "body": "Open Sans"},
    "style": ["moderno", "colorido", "jovem"]
  },
  "voice": {
    "tone": "Informal, divertido, jovem...",
    "keywords": ["artesanal", "feito na hora", "sabor"],
    "avoid": ["barato", "desconto"],
    "persona": "Jovens 18-35, universitarios, amantes de comida..."
  },
  "social": {
    "instagram": "@mortadellabnu",
    "facebook": "Mortadella Blumenau"
  },
  "recent_posts": [
    {
      "date": "2026-03-18",
      "platform": "instagram",
      "type": "carousel",
      "caption_preview": "Novidade no cardapio..."
    }
  ],
  "content_preferences": {
    "types": ["feed", "stories", "reels"],
    "frequency": "4x semana",
    "recurring_themes": [{"day": "segunda", "theme": "promo do dia"}]
  },
  "copy_examples": ["Vem provar o melhor da casa! ..."]
}
```

### 5.4 Codigo Esqueleto da API Reescrita

```javascript
// api/asana/tasks.js — REWRITTEN as Client Hub API
// Multiplexed POST endpoint with action-based routing

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

const HEADERS = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// ... helper functions (ok, fail, supaSelect, supaInsert, supaUpdate, supaDelete)

const HUB_ACTIONS = {
  hub_get: hubGet,
  hub_list: hubList,
  hub_upsert: hubUpsert,
  hub_delete: hubDelete,
  hub_upload_material: hubUploadMaterial,
  hub_delete_material: hubDeleteMaterial,
  hub_list_materials: hubListMaterials,
  hub_get_context: hubGetContext,
  hub_activity: hubActivity,
  hub_bulk_init: hubBulkInit,
};

module.exports = async function handler(req, res) {
  // CORS preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  const { action, ...params } = req.body || {};
  const fn = HUB_ACTIONS[action];

  if (!fn) {
    return res.status(400).json({ error: `Unknown action: ${action}` });
  }

  try {
    const result = await fn(params);
    return res.status(200).json(result);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
```

---

## 6. Especificacoes de UI/UX

### 6.1 Ponto de Entrada — Sidebar

A sidebar ja possui a hierarquia: `Starken Performance > [25 clientes]` e `Alpha Assessoria > [10 clientes]`.

**Mudanca**: Ao clicar em um cliente na sidebar, em vez de abrir diretamente a Gestao de Conteudo, abre o **Hub do Cliente** como view padrao. A Gestao de Conteudo vira uma sub-aba dentro do contexto do cliente.

```
Sidebar (existente)
  Starken Performance
    > Mortadella Blumenau  ← clique abre Hub
    > Hamburgueria Feio
    > ...
  Alpha Assessoria
    > Mestre do Frango
    > ...
```

### 6.2 Layout do Hub — Sub-abas

Ao selecionar um cliente, o painel principal mostra sub-abas horizontais:

```
[Hub] [Conteudo] [Calendario]
```

- **Hub**: Centro de Informacoes (novo)
- **Conteudo**: Gestao de Conteudo existente (ClickUp-like)
- **Calendario**: Calendario de publicacoes existente (filtrado por cliente)

### 6.3 Tela do Hub — Secoes

O Hub e organizado em cards/secoes colapsaveis:

```
+------------------------------------------------------------------+
| MORTADELLA BLUMENAU                           [Editar] [Salvar]  |
| Gastronomia | Starken Performance | Ativo                        |
+------------------------------------------------------------------+

+---------------------------+  +---------------------------+
| IDENTIDADE VISUAL    [-]  |  | VOZ E COMUNICACAO    [-]  |
|                           |  |                           |
| Cores:                    |  | Tom de voz:               |
| [#dc2626] Vermelho        |  | "Informal, divertido..."  |
| [#ffffff] Branco           |  |                           |
| [#1a1a1a] Preto            |  | Palavras-chave:           |
|                           |  | artesanal | delivery |    |
| Fontes:                   |  | sabor                     |
| Titulo: Montserrat Bold   |  |                           |
| Corpo: Open Sans           |  | Evitar:                   |
|                           |  | barato | desconto         |
| Estilo: moderno, jovem     |  |                           |
| Logo: [img preview]        |  | Publico-alvo:             |
+---------------------------+  | "Jovens 18-35..."         |
                               +---------------------------+

+---------------------------+  +---------------------------+
| LINKS E RECURSOS     [-]  |  | CONTRATO E CONTATO  [-]  |
|                           |  |                           |
| Site: example.com     [↗] |  | Responsavel: Juan         |
| Drive: [pasta] link   [↗] |  | Inicio: 01/2026           |
| Instagram: @morta     [↗] |  | Valor: R$ 2.500/mes      |
| Facebook: /morta      [↗] |  | Pacote: 12 posts + ...   |
| Aprovacao: link       [↗] |  | Tel: (47) 99999-0000     |
|                           |  | Email: cliente@email.com  |
| + Adicionar link           |  |                           |
+---------------------------+  +---------------------------+

+------------------------------------------------------------------+
| MATERIAIS DE REFERENCIA                        [Upload] [-]      |
|                                                                   |
| [img] Logo      [img] Cardapio   [img] Fachada   [img] Produto  |
| [pdf] Manual    [img] Template                                    |
+------------------------------------------------------------------+

+------------------------------------------------------------------+
| EXEMPLOS DE COPY APROVADA                              [-]      |
|                                                                   |
| 1. "Vem provar o melhor da casa! ..." — Post promo (Mar/2026)   |
| 2. "Novidade no cardapio..." — Lancamento (Fev/2026)            |
| + Adicionar exemplo                                               |
+------------------------------------------------------------------+

+------------------------------------------------------------------+
| NOTAS                                                    [-]      |
|                                                                   |
| Campo de texto livre para anotacoes...                            |
+------------------------------------------------------------------+
```

### 6.4 Modo de Edicao

O hub tem dois modos:

1. **Visualizacao** (padrao): Mostra dados formatados, links clicaveis, previews de imagem. Campos vazios mostram "Nao informado" em cinza.

2. **Edicao**: Ativado pelo botao "Editar". Campos viram inputs editaveis. Cores ganham color picker. Fontes ganham dropdown. Tags ganham input com chips. Botao "Salvar" persiste tudo com 1 chamada `hub_upsert`.

### 6.5 Componentes de UI Especificos

#### Color Picker Inline
```
[#dc2626] [input hex] [input nome] [x remover]
[#ffffff] [input hex] [input nome] [x remover]
[+ Adicionar cor]
```
- Input type="color" para selecao visual
- Input text para hex manual
- Input text para nome da cor
- Maximo 6 cores

#### Tag Input (Chips)
```
[artesanal ×] [delivery ×] [sabor ×] [+ input digitando...]
```
- Enter ou virgula cria nova tag
- X remove tag
- Usado para: palavras-chave, proibidas, estilo visual

#### Link Row
```
[icone] [Label] [URL editavel] [↗ abrir] [x remover]
```
- Icones por tipo: Instagram, Facebook, TikTok, Drive, Site, Generico
- Botao abre em nova aba

#### Upload de Materiais
- Drag & drop area OU botao de upload
- Upload vai para Supabase Storage: `client-hub-materials/{client_slug}/{filename}`
- Apos upload, registra via `hub_upload_material`
- Grid de thumbnails com hover mostrando nome e opcao de deletar

### 6.6 Responsividade

O hub utiliza CSS Grid com breakpoints:
- **Desktop (>1024px)**: 2 colunas de cards
- **Tablet (768-1024px)**: 1 coluna, cards full width
- **Mobile (<768px)**: Nao e prioridade (time usa desktop), mas layout nao deve quebrar

### 6.7 Temas

Todos os componentes do hub devem usar exclusivamente CSS variables do sistema de temas existente:

```css
/* Variaveis existentes que o hub deve usar */
var(--bg-primary)
var(--bg-secondary)
var(--bg-card)
var(--text-primary)
var(--text-secondary)
var(--text-muted)
var(--border-color)
var(--accent-color)
var(--accent-hover)
var(--shadow-sm)
var(--shadow-md)
var(--radius-sm)
var(--radius-md)
```

Nao criar novas variaveis. Se necessario, usar as existentes com opacidade (`color-mix` ou rgba).

### 6.8 Indicador de Completude

Na sidebar e na listagem, cada cliente mostra um indicador visual de quao completo esta o hub:

```
Mortadella Blumenau  ████████░░ 80%
Hamburgueria Feio    ███░░░░░░░ 30%
Rosa Mexicano BNU    ░░░░░░░░░░ 0%
```

**Calculo de completude** (10 campos, 10% cada):
1. brand_colors preenchido
2. brand_fonts preenchido
3. logo_url preenchido
4. tone_of_voice preenchido
5. keywords preenchido (ao menos 3)
6. persona_description preenchido
7. social_links tem ao menos 1
8. website_url preenchido
9. drive_folder_url preenchido
10. copy_examples tem ao menos 1

---

## 7. Pontos de Integracao

### 7.1 Integracao com Gestao de Conteudo

**Atual**: Ao criar uma tarefa de conteudo, o usuario digita briefing e copy manualmente.

**Com o Hub**: O modal de tarefa ganha um botao "Carregar Contexto" que preenche campos com dados do hub:

- **Briefing**: Auto-popula com template usando tom de voz + persona + palavras-chave
- **Copy sugerida**: Mostra exemplos de copy aprovada como referencia
- **Cores/fontes**: Exibido como referencia visual no modal da tarefa

**Implementacao**: No frontend, ao abrir o modal de tarefa, fazer `hub_get` do cliente atual e exibir painel lateral com informacoes de referencia.

### 7.2 Integracao com Publicacao

**Atual**: Ao publicar, o usuario escolhe cliente, escreve legenda e faz upload de midia.

**Com o Hub**:
- Preview de cores do cliente ao lado do compositor de legenda
- Sugestao de hashtags baseada nas palavras-chave do hub
- Acesso rapido aos materiais do hub para selecao de midia

### 7.3 Integracao com Calendario

**Atual**: Calendario mostra posts publicados/agendados por cliente.

**Com o Hub**:
- Ao clicar em um dia, mostra sugestao de tema baseado nas preferencias de conteudo (V2)
- Dias sem post sugerido ficam destacados (ex: "segunda sem promo" se promo e tema recorrente)

### 7.4 Integracao com meta_config

O `client_slug` do hub e o mesmo slug usado no `meta_config.config.clients`. Dados de Meta (pageId, igUserId, etc.) continuam em `meta_config`. O hub nao duplica esses dados — apenas complementa com informacoes de marca e contexto.

```
meta_config.config.clients["mortadella-blumenau"]
  -> pageId, pageAccessToken, igUserId, adAccountId (dados Meta)

client_hub WHERE client_slug = "mortadella-blumenau"
  -> brand, voice, links, materials (dados de marca/contexto)
```

---

## 8. Integracao Google Drive

### Fase 1 (MVP) — Links Simples

**Abordagem**: Armazenar URLs de pastas do Google Drive como texto.

- Campo principal: `drive_folder_url` (pasta raiz de materiais do cliente)
- Campo avancado: `drive_folders` (JSONB com lista de pastas categorizadas)
- Frontend: Botao "Abrir no Drive" que abre em nova aba
- Zero dependencias de API do Google

**Vantagens**: Implementacao imediata, sem custos, sem complexidade de auth.
**Limitacoes**: Nao e possivel navegar arquivos inline.

### Fase 2 (V2) — Links Inteligentes com Categorias

**Abordagem**: Lista estruturada de pastas com icones e categorias.

```
PASTAS DO DRIVE
├── Logos          [↗ Abrir]  (drive.google.com/...)
├── Fotos Produto  [↗ Abrir]  (drive.google.com/...)
├── Templates      [↗ Abrir]  (drive.google.com/...)
├── Videos         [↗ Abrir]  (drive.google.com/...)
└── + Adicionar pasta
```

- Icones por categoria (pasta, imagem, video, documento)
- Reordenacao drag & drop
- Botao de copia rapida do link

### Fase 3 (V3) — Google Drive API (Opcional)

**Viabilidade**: Requer Google Cloud project com Drive API habilitada.

**Opcao A: Service Account (Recomendada)**
- Criar service account no Google Cloud Console
- Compartilhar pastas de cada cliente com o email da service account
- Armazenar credenciais como env var no Vercel
- API calls via serverless function (multiplexar no mesmo endpoint do hub)

**Opcao B: OAuth per user**
- Mais complexo, requer fluxo de login Google
- Cada usuario autoriza acesso ao seu Drive
- Nao recomendado para equipe de 3 pessoas

**Actions adicionais (V3)**:
- `hub_drive_list`: Lista arquivos de uma pasta do Drive
- `hub_drive_preview`: Retorna URL de preview de um arquivo

**Estimativa**: Service Account setup = 2-3 horas. Browsing UI = 8-10 horas.

**Recomendacao**: Fase 3 so vale a pena se o agente IA precisar acessar arquivos do Drive programaticamente. Para uso humano, links simples (Fase 1-2) sao suficientes.

---

## 9. Fundacao para Agente IA

### 9.1 Visao Geral

O hub serve como a "memoria" estruturada que um agente de IA precisa para gerar conteudo alinhado a marca de cada cliente. A action `hub_get_context` retorna um JSON otimizado para ser injetado como contexto em um prompt de LLM.

### 9.2 Estrutura de Contexto para IA

```json
{
  "client_context": {
    "name": "Mortadella Blumenau",
    "segment": "Gastronomia — hamburgueria artesanal",
    "location": "Blumenau, SC",

    "brand_identity": {
      "visual_style": "Moderno, colorido, jovem",
      "primary_color": "#dc2626",
      "font_style": "Montserrat Bold para titulos, Open Sans para corpo"
    },

    "communication": {
      "tone": "Informal, divertido, jovem. Usa emojis com moderacao. Fala diretamente com o cliente.",
      "vocabulary": {
        "use": ["artesanal", "feito na hora", "sabor unico", "ingredientes frescos"],
        "avoid": ["barato", "desconto", "promodao", "liquidacao"]
      },
      "audience": {
        "description": "Jovens 18-35 anos, universitarios e jovens profissionais. Amantes de gastronomia. Moram em Blumenau e regiao.",
        "interests": ["comida", "gastronomia", "delivery", "experiencias"],
        "pain_points": ["opcoes limitadas", "delivery demorado", "qualidade inconsistente"]
      }
    },

    "content_strategy": {
      "platforms": ["instagram", "facebook"],
      "types": ["feed", "stories", "reels"],
      "frequency": "4x por semana",
      "recurring_themes": {
        "segunda": "Promo do dia",
        "quarta": "Bastidores / Preparo",
        "sexta": "Novidade no cardapio",
        "sabado": "Pedido do cliente / UGC"
      },
      "best_times": ["12:00", "18:00", "20:00"]
    },

    "approved_examples": [
      {
        "text": "Segunda-feira pede aquele burger artesanal pra dar uma animada na semana. Bora?",
        "context": "Post de segunda, promo do dia",
        "style": "casual, call to action"
      }
    ],

    "recent_history": [
      {
        "date": "2026-03-18",
        "platform": "instagram",
        "type": "carousel",
        "caption_preview": "Novidade no cardapio: nosso novo smash burger..."
      }
    ],

    "resources": {
      "website": "https://mortadellabnu.com.br",
      "instagram": "https://instagram.com/mortadellabnu",
      "menu_url": "https://mortadellabnu.com.br/cardapio"
    }
  }
}
```

### 9.3 Como o Agente IA Usaria o Contexto

```
System Prompt:
"Voce e um agente de conteudo para redes sociais. Use o contexto do cliente abaixo
para gerar conteudo alinhado a marca. Siga rigorosamente o tom de voz, use as
palavras-chave indicadas e evite as palavras proibidas."

+ client_context JSON acima

User Prompt:
"Crie 3 opcoes de legenda para um post de carrossel mostrando o novo hamburguer
artesanal. Plataforma: Instagram. Estilo: engajamento."
```

### 9.4 Campos Criticos para IA

Prioridade de preenchimento para que o agente funcione bem:

| Prioridade | Campo | Por que |
|------------|-------|---------|
| CRITICA | tone_of_voice | Sem isso, IA gera conteudo generico |
| CRITICA | keywords + forbidden_words | Vocabulario da marca |
| CRITICA | persona_description | Direciona linguagem e temas |
| ALTA | copy_examples | Exemplos sao o melhor "treinamento" |
| ALTA | content_preferences | Define tipo e frequencia |
| MEDIA | brand_colors + fonts | Relevante para design, menos para copy |
| MEDIA | social_links | Para hashtags e mentions |
| BAIXA | contract info | Nao relevante para geracao de conteudo |

### 9.5 Endpoint de Validacao de Contexto

A action `hub_get_context` inclui um campo `readiness_score`:

```json
{
  "client_context": { ... },
  "readiness_score": {
    "score": 7,
    "max": 10,
    "level": "good",  // "poor" (0-3), "fair" (4-6), "good" (7-8), "excellent" (9-10)
    "missing": ["copy_examples", "content_preferences", "forbidden_words"]
  }
}
```

Isso permite ao frontend mostrar: "Contexto 70% pronto para IA. Faltam: exemplos de copy, preferencias de conteudo."

---

## 10. Arquitetura Tecnica

### 10.1 Onde Cada Coisa Vive

```
checklist-relatorios.html
├── CSS: Novas regras .ch-* (client-hub) no bloco <style>
├── HTML: Novo <div id="tab-client-hub"> com template do hub
├── JS: Novo bloco de funcoes hubXxx() no <script> principal
│   ├── hubRender(slug)          — Renderiza tela do hub
│   ├── hubEdit()                — Ativa modo de edicao
│   ├── hubSave()                — Salva via API
│   ├── hubLoadMaterials(slug)   — Carrega lista de materiais
│   ├── hubUpload(file)          — Upload para Storage + registra
│   ├── hubColorPicker()         — Componente de cores
│   ├── hubTagInput()            — Componente de tags/chips
│   └── hubCompleteness(data)    — Calcula % preenchimento
│
api/asana/tasks.js (REESCRITO)
├── hub_get, hub_list, hub_upsert, hub_delete
├── hub_upload_material, hub_delete_material, hub_list_materials
├── hub_get_context, hub_activity, hub_bulk_init
│
Supabase
├── Tables: client_hub, client_hub_materials, client_hub_activity
├── Storage: bucket "client-hub-materials"
└── RLS: Open policies (auth via service key)
```

### 10.2 Fluxo de Dados

```
                    ┌─────────────┐
                    │   Sidebar    │
                    │ Click client │
                    └──────┬──────┘
                           │
                    ┌──────v──────┐
                    │ switchTab() │
                    │ hubRender() │
                    └──────┬──────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
     ┌──────v──────┐ ┌────v────┐ ┌───────v───────┐
     │  hub_get    │ │hub_list │ │hub_list_      │
     │  (API call) │ │materials│ │materials      │
     └──────┬──────┘ └────┬────┘ └───────┬───────┘
            │              │              │
            └──────────────┼──────────────┘
                           │
                    ┌──────v──────┐
                    │  Render UI  │
                    │  (DOM ops)  │
                    └─────────────┘
```

### 10.3 Cache Strategy

- **In-memory**: `_hubCache[slug]` armazena dados do hub ja carregados. Invalidado ao salvar.
- **localStorage**: Nao usar para dados do hub (muito grandes e frequentemente atualizados).
- **Preload**: Ao carregar a sidebar, fazer `hub_list` para obter completeness de todos os clientes (1 request).

### 10.4 Padrao de Nomeacao

Para manter consistencia com o codigo existente:

| Tipo | Padrao | Exemplo |
|------|--------|---------|
| CSS classes | `.ch-*` | `.ch-card`, `.ch-color-picker`, `.ch-tag-input` |
| JS functions | `hub*` | `hubRender()`, `hubSave()`, `hubEdit()` |
| JS state | `_hub*` | `_hubCache`, `_hubEditing`, `_hubCurrentSlug` |
| API actions | `hub_*` | `hub_get`, `hub_upsert`, `hub_list` |
| DB tables | `client_hub*` | `client_hub`, `client_hub_materials` |

### 10.5 Tamanho Estimado de Codigo

| Componente | Linhas estimadas |
|------------|-----------------|
| CSS (classes .ch-*) | ~300 linhas |
| HTML (template do hub) | ~200 linhas |
| JS (funcoes hub*) | ~800 linhas |
| API (api/asana/tasks.js reescrito) | ~400 linhas |
| SQL (tabelas + seeds) | ~120 linhas |
| **Total** | **~1.820 linhas** |

O HTML principal passaria de ~9.000 para ~10.300 linhas (aumento de ~14%).

---

## 11. Plano de Migracao

### 11.1 Dados Existentes

Os 35 clientes ja existem em duas fontes:

1. **`meta_config`** (JSONB): Slug, nome, tenant, dados Meta (pageId, igUserId, etc.)
2. **`clients_v2`** (SQL): Nome, segmento, responsavel, drive_link, approval_link, logo_url

### 11.2 Estrategia de Migracao

**Passo 1**: Criar tabelas no Supabase (executar SQL do item 4).

**Passo 2**: Script de migracao inicial via action `hub_bulk_init`:

```json
{
  "action": "hub_bulk_init",
  "source": "meta_config"  // Le meta_config e cria rows no client_hub
}
```

A action faz:
1. Le `meta_config.config.clients` (todos os slugs)
2. Para cada slug, cria row em `client_hub` com:
   - `client_slug`: slug do meta_config
   - `client_name`: nome do meta_config
   - `tenant`: derivado do meta_config
   - Demais campos: vazios (serao preenchidos manualmente)
3. Tenta enriquecer com dados de `clients_v2` se match por nome:
   - `segment`, `responsible`, `drive_folder_url` (drive_link), `approval_url`

**Passo 3**: Preenchimento manual progressivo pela equipe.

### 11.3 Cronograma de Migracao

| Acao | Tempo | Quem |
|------|-------|------|
| Criar tabelas Supabase | 5 min | Dev (SQL Editor) |
| Deploy API reescrita | 10 min | Dev (push + Vercel) |
| Executar hub_bulk_init | 1 min | Dev (1 API call) |
| Preencher 5 clientes principais | 2 horas | Juan |
| Preencher restante (30 clientes) | 1-2 semanas | Equipe (gradual) |

### 11.4 Compatibilidade Retroativa

- `meta_config` continua funcionando normalmente (dados Meta nao migram, ficam la)
- `clients_v2` continua existindo (usado por `SQL_GESTAO_PROJETOS_v2.sql`)
- O hub e uma camada adicional, nao substitui nada existente
- Se o hub nao estiver preenchido para um cliente, as telas existentes funcionam normalmente

---

## 12. Riscos e Mitigacoes

### R1: Sobrecarga do HTML Principal

| | |
|-|-|
| **Risco** | O arquivo `checklist-relatorios.html` ja tem 9.000+ linhas. Adicionar ~1.300 linhas pode dificultar manutencao. |
| **Probabilidade** | Media |
| **Impacto** | Medio |
| **Mitigacao** | Manter codigo do hub em blocos claramente delimitados com comentarios de secao (`// ===== CLIENT HUB =====`). Usar prefixo `.ch-*` em CSS e `hub*` em JS para isolamento. Considerar, no futuro, refatorar para modulos ES6 se o arquivo ultrapassar 15.000 linhas. |

### R2: Performance de Carregamento

| | |
|-|-|
| **Risco** | Carregar dados de hub + materiais + historico para cada cliente pode ser lento. |
| **Probabilidade** | Baixa |
| **Impacto** | Medio |
| **Mitigacao** | Lazy loading: so carrega hub quando usuario clica no cliente. Cache in-memory `_hubCache`. Paginacao de materiais (20 por pagina). Dados de historico so carregam quando secao e expandida. |

### R3: Reescrever api/asana/tasks.js Quebra Algo

| | |
|-|-|
| **Risco** | Algum frontend ainda chama o endpoint Asana antigo. |
| **Probabilidade** | Baixa (Asana desativado ha semanas) |
| **Impacto** | Alto se ocorrer |
| **Mitigacao** | Buscar todas as referencias a `/api/asana/tasks` no HTML antes de reescrever. Se houver chamadas legado, manter como fallback: se `action` nao for `hub_*`, retornar `{ error: "Asana integration deprecated" }`. |

### R4: Preenchimento Incompleto dos Hubs

| | |
|-|-|
| **Risco** | Equipe nao preenche os hubs, tornando o sistema inutil. |
| **Probabilidade** | Media-alta |
| **Impacto** | Alto |
| **Mitigacao** | Indicador visual de completude na sidebar (barra de progresso). Gamificacao leve: "X clientes com hub completo". Ao criar tarefa de conteudo, mostrar aviso se hub esta incompleto. Template de preenchimento rapido com campos minimos. |

### R5: Conflito de Slugs entre meta_config e client_hub

| | |
|-|-|
| **Risco** | Slug de um cliente no meta_config nao bate com o client_hub. |
| **Probabilidade** | Baixa (migracao automatica) |
| **Impacto** | Medio |
| **Mitigacao** | `hub_bulk_init` cria hubs diretamente a partir dos slugs do meta_config, garantindo match. Ao adicionar novo cliente no meta_config, criar automaticamente o hub com slug correspondente. |

### R6: Seguranca — Dados de Cliente Expostos

| | |
|-|-|
| **Risco** | RLS aberto (policies `USING (true)`) expoe dados via Supabase REST API se alguem descobrir a URL. |
| **Probabilidade** | Baixa (anon key ja e exposta no frontend, padrao existente) |
| **Impacto** | Medio (dados de marca nao sao sensiveis como tokens) |
| **Mitigacao** | Padrao ja existente no projeto. Dados do hub nao contem tokens ou credenciais. Se necessario no futuro, implementar RLS por tenant. Tokens de Meta ficam no meta_config, que ja tem esse mesmo padrao. |

---

## 13. Metricas de Sucesso

### 13.1 Metricas de Adocao

| Metrica | Meta MVP (30 dias) | Meta V2 (90 dias) |
|---------|---------------------|---------------------|
| Hubs criados | 35/35 (100%) | 35/35 (100%) |
| Completude media | 40% | 70% |
| Hubs com completude >80% | 10 clientes | 25 clientes |
| Usuarios que acessaram Hub | 3/3 | 3/3 |

### 13.2 Metricas de Eficiencia

| Metrica | Baseline (antes) | Meta |
|---------|-------------------|------|
| Tempo para encontrar cor/fonte do cliente | ~2 min (buscar no Drive/WhatsApp) | <5 seg (1 clique no hub) |
| Tempo para iniciar briefing de post | ~5 min (reunir informacoes) | <1 min (contexto auto-carregado) |
| Posts com identidade visual inconsistente | Nao medido | Reducao subjetiva reportada pela equipe |

### 13.3 Metricas de IA Readiness (V3)

| Metrica | Meta |
|---------|------|
| Clientes com readiness_score >= 7 | 20/35 (57%) |
| Clientes com tone_of_voice preenchido | 30/35 (86%) |
| Clientes com copy_examples >= 3 | 15/35 (43%) |

---

## 14. Fases de Implementacao

### Fase 1 — MVP (Estimativa: 20-25 horas de desenvolvimento)

**Sprint 1: Backend (8h)**

| Tarefa | Horas | Dependencia |
|--------|-------|-------------|
| Criar tabelas SQL no Supabase | 0.5h | Nenhuma |
| Criar bucket Storage | 0.5h | Nenhuma |
| Reescrever `api/asana/tasks.js` com actions hub_* | 5h | Tabelas criadas |
| Implementar hub_bulk_init | 1h | API pronta |
| Executar migracao inicial | 0.5h | Tudo acima |
| Testar API (manual via curl/Postman) | 0.5h | API pronta |

**Sprint 2: Frontend Core (10h)**

| Tarefa | Horas | Dependencia |
|--------|-------|-------------|
| CSS: Classes .ch-* com suporte a 3 temas | 2h | Nenhuma |
| HTML: Template do hub (secoes colapsaveis) | 2h | CSS |
| JS: hubRender() — carrega e exibe dados | 2h | API + HTML |
| JS: hubEdit() + hubSave() — modo edicao | 2h | hubRender |
| JS: Color picker + tag input components | 1.5h | hubEdit |
| JS: Integracao sidebar (clique → hub) | 0.5h | hubRender |

**Sprint 3: Polimento MVP (4h)**

| Tarefa | Horas | Dependencia |
|--------|-------|-------------|
| Indicador de completude na sidebar | 1h | hub_list |
| Sub-abas [Hub / Conteudo / Calendario] | 1h | Frontend core |
| Estados vazios (hub nao preenchido) | 0.5h | hubRender |
| Testes manuais em 3 temas | 1h | Tudo |
| Bug fixes e ajustes visuais | 0.5h | Testes |

### Fase 2 — Enriquecimento (Estimativa: 15-18 horas)

| Tarefa | Horas |
|--------|-------|
| Upload de materiais (drag & drop + Storage) | 4h |
| Grid de materiais com preview/lightbox | 3h |
| Drive folders organizadas (lista categorizada) | 2h |
| Historico de posts publicados (integracao publish_history) | 3h |
| Preferencias de conteudo (UI de edicao) | 2h |
| Botao "Carregar Contexto" no modal de tarefa | 2h |
| Testes e polimento | 2h |

### Fase 3 — Agente IA (Estimativa: 10-15 horas)

| Tarefa | Horas |
|--------|-------|
| Action hub_get_context com readiness_score | 3h |
| UI de readiness no hub ("Pronto para IA: 70%") | 2h |
| Google Drive API via Service Account (opcional) | 8h |
| Testes de integracao com LLM (externo) | 2h |

### Timeline Visual

```
Semana 1:  [████ Backend ████][██ Frontend Core ██]
Semana 2:  [██ Frontend Core ██][██ Polimento ██] ← MVP PRONTO
Semana 3:  [████████ Fase 2: Upload + Materiais ████████]
Semana 4:  [████ Fase 2: Historico + Preferencias ████]
Semana 5+: [████ Fase 3: Agente IA (quando priorizado) ████]
```

### Entregaveis por Fase

| Fase | Entregavel | Criterio de Aceite |
|------|------------|-------------------|
| MVP | Hub funcional com edicao e visualizacao | 35 hubs criados, edicao salva e persiste, 3 temas funcionando |
| V2 | Upload de materiais + historico | Upload funciona, preview de imagens, historico carrega de publish_history |
| V3 | Contexto para IA disponivel | hub_get_context retorna JSON completo, readiness_score calculado |

---

## Apendice A: Glossario

| Termo | Definicao |
|-------|-----------|
| Hub | Centro de Informacoes do Cliente — tela centralizada com todos os dados |
| Slug | Identificador unico do cliente em formato URL-safe (ex: "mortadella-blumenau") |
| Tenant | Empresa/agencia (Starken Performance ou Alpha Assessoria) |
| Completude | Percentual de campos preenchidos no hub de um cliente |
| Readiness Score | Pontuacao de quao pronto o contexto esta para uso por agente IA |
| Multiplexar | Reusar uma funcao serverless para multiplas actions via parametro de roteamento |

## Apendice B: Decisoes Tecnicas

### Por que JSONB em vez de tabelas normalizadas?

Campos como `brand_colors`, `brand_fonts`, `social_links` e `keywords` sao listas/objetos flexiveis que variam por cliente. Usar JSONB evita:
- Criar 5+ tabelas auxiliares (client_colors, client_fonts, etc.)
- Joins complexos para montar o perfil completo
- Migracoes ao adicionar novo campo

O trade-off (busca menos eficiente em JSONB) e irrelevante para 35 clientes.

### Por que reaproveitar api/asana/tasks.js em vez de multiplexar em content.js?

1. `content.js` ja tem 15 actions e ~500 linhas. Adicionar 10+ actions deixaria o arquivo com 800+ linhas.
2. Separacao logica: content.js = gestao de conteudo, asana/tasks.js = hub de clientes.
3. O endpoint Asana esta completamente ocioso — melhor reutilizar do que desperdicar.
4. Zero impacto nos 12 slots de funcoes Vercel.

### Por que client_slug como chave em vez de UUID?

O `meta_config` ja usa slugs como chave dos clientes no JSONB. Usar o mesmo slug como chave do hub garante match direto sem lookup. O slug e legivel (debug mais facil) e estavel (nao muda).

---

*Fim do PRD — Centro de Informacoes do Cliente v1.0*
