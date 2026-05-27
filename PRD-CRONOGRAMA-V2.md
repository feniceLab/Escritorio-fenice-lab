# PRD — Cronograma de Conteúdo v2
### Starken Performance

---

## 1. Contexto

O módulo atual de "Aprovação de Conteúdo" é básico: um formulário linear com select de cliente, campo de semana, e posts adicionados um a um em formato de lista. Não há controle de status, não há envio direto ao cliente, e a gestão visual é limitada.

**Objetivo:** Transformar o módulo em um sistema completo de gestão de cronograma de conteúdo com interface moderna, fluxo de status, e envio direto ao cliente.

---

## 2. Personas

| Persona | Descrição |
|---|---|
| **Gestor de Tráfego** (usuário principal) | Cria cronogramas, gerencia posts, envia para aprovação do cliente |
| **Cliente** (visualizador externo) | Recebe o cronograma via WhatsApp/link e aprova ou solicita alterações |

---

## 3. Funcionalidades

### 3.1 — Dashboard de Cronogramas

**Substituir** a tela atual por um dashboard com cards visuais:

```
┌─────────────────────────────────────────────────────────────┐
│ Cronogramas de Conteúdo                    [+ Novo Cronograma] │
│                                                               │
│ ┌─ Filtros ──────────────────────────────────────────────┐   │
│ │ [Todos clientes ▼]  [Todos status ▼]  [Março 2026 ▼]  │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                               │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐          │
│ │ 🟡 PENDENTE  │ │ 🟢 APROVADO  │ │ 🔵 RASCUNHO  │          │
│ │              │ │              │ │              │          │
│ │ Pizzaria Nei │ │ Sr Salsicha  │ │ Estilo Tulipa│          │
│ │ 3ª Sem Março │ │ 2ª Sem Março │ │ 4ª Sem Março │          │
│ │ 5 posts      │ │ 4 posts      │ │ 2 posts      │          │
│ │ Enviado 15/03│ │ Aprovado 12/3│ │              │          │
│ │              │ │              │ │              │          │
│ │ [Abrir]      │ │ [Abrir]      │ │ [Editar]     │          │
│ └──────────────┘ └──────────────┘ └──────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

**Cards mostram:**
- Nome do cliente + empresa (badge colorido Starken/Alpha)
- Período (ex: "3ª Semana de Março")
- Quantidade de posts
- Status com cor e ícone
- Data do último evento (criado, enviado, aprovado)
- Ações rápidas

### 3.2 — Status do Cronograma (fluxo)

```
RASCUNHO → PRONTO → ENVIADO → APROVADO
                              ↘ REVISÃO → PRONTO → ...
```

| Status | Cor | Descrição |
|---|---|---|
| `rascunho` | 🔵 Azul | Em construção, posts sendo adicionados |
| `pronto` | 🟣 Roxo | Completo, pronto para enviar ao cliente |
| `enviado` | 🟡 Amarelo | Enviado ao cliente, aguardando resposta |
| `aprovado` | 🟢 Verde | Cliente aprovou o cronograma |
| `revisao` | 🟠 Laranja | Cliente pediu alterações |

Regras:
- Só pode marcar como "pronto" se tiver pelo menos 1 post
- Só pode enviar se estiver "pronto"
- Ao clicar em "Revisão", abre campo para observações do cliente
- Ao aprovar, registra data/hora da aprovação

### 3.3 — Editor de Cronograma (popup/modal fullscreen)

Ao clicar em "Novo Cronograma" ou "Editar", abre um **modal fullscreen** com:

**Cabeçalho:**
```
┌─────────────────────────────────────────────────────────────┐
│ ← Voltar    Cronograma: Pizzaria do Nei    [status badge]   │
│             3ª Semana de Março 2026                          │
│                                                               │
│ [Salvar Rascunho]  [Marcar Pronto]  [Enviar ao Cliente]     │
└─────────────────────────────────────────────────────────────┘
```

**Área de posts — Grid de cards arrastáveis:**
```
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ POST 1          │ │ POST 2          │ │ POST 3          │
│ ┌─────────────┐ │ │ ┌─────────────┐ │ │ ┌─────────────┐ │
│ │   [imagem]  │ │ │ │   [imagem]  │ │ │ │  + Imagem   │ │
│ │             │ │ │ │             │ │ │ │             │ │
│ └─────────────┘ │ │ └─────────────┘ │ │ └─────────────┘ │
│                 │ │                 │ │                 │
│ 📅 18.03       │ │ 📅 19.03       │ │ 📅 —           │
│ CARROSSEL FEED  │ │ REELS          │ │ STORIES        │
│                 │ │                 │ │                 │
│ "Venha conhecer │ │ "O sabor que.. │ │                 │
│  nosso novo..." │ │                 │ │                 │
│                 │ │                 │ │                 │
│ [Editar] [🗑️]  │ │ [Editar] [🗑️]  │ │ [Editar] [🗑️]  │
│ ↕ arrastar      │ │ ↕ arrastar      │ │ ↕ arrastar      │
└─────────────────┘ └─────────────────┘ └─────────────────┘

                    [+ Adicionar Post]
```

**Ao clicar "Editar" em um post → abre popup lateral (drawer):**

```
┌──── Editar Post ───────────────────────┐
│                                         │
│ Data de postagem                       │
│ [18.03            ]                    │
│                                         │
│ Tipo de conteúdo                       │
│ [CARROSSEL DE FOTOS         ▼]         │
│                                         │
│ Legenda                                │
│ ┌─────────────────────────────────┐    │
│ │ Venha conhecer nosso novo...    │    │
│ │                                 │    │
│ │                                 │    │
│ └─────────────────────────────────┘    │
│                                         │
│ Arte / Criativo                        │
│ ┌─────────────────────────────────┐    │
│ │                                 │    │
│ │         [imagem preview]        │    │
│ │                                 │    │
│ │ [Trocar imagem]  [Remover]      │    │
│ └─────────────────────────────────┘    │
│                                         │
│ Observações do cliente                 │
│ ┌─────────────────────────────────┐    │
│ │                                 │    │
│ └─────────────────────────────────┘    │
│                                         │
│          [Salvar] [Cancelar]           │
└─────────────────────────────────────────┘
```

### 3.4 — Envio ao Cliente

Ao clicar "Enviar ao Cliente", abre popup com opções:

**Opção A — WhatsApp (principal)**
- Gera link de visualização pública do cronograma (via Vercel/Supabase)
- Monta mensagem pré-formatada com:
  ```
  Olá! Segue o cronograma de conteúdo da *3ª Semana de Março*. 📋

  🔗 [link do cronograma]

  Por favor, verifique os posts e nos avise se está tudo ok ou se precisa de alguma alteração!
  ```
- Abre WhatsApp Web com a mensagem pronta (usando telefone do cliente)
- Status muda automaticamente para "enviado"

**Opção B — Gerar PDF**
- Gera a apresentação em slides como já funciona hoje (mantém funcionalidade existente)
- Útil para envio por e-mail ou salvar offline

### 3.5 — Página Pública de Visualização

URL: `starken-performance.vercel.app/aprovacao?id=XXXXX`

Página limpa, sem sidebar, visual profissional que o cliente acessa:

```
┌─────────────────────────────────────────────────────────┐
│                                                           │
│        🗓️ Cronograma de Conteúdo                        │
│        Pizzaria do Nei — 3ª Semana de Março              │
│        Starken Performance                               │
│                                                           │
│ ─── FEED ────────────────────────────────────────────── │
│                                                           │
│ ┌─────────┐  📅 18.03 · CARROSSEL                       │
│ │ [imagem] │  "Venha conhecer nosso novo cardápio..."    │
│ └─────────┘                                              │
│                                                           │
│ ┌─────────┐  📅 19.03 · REELS                           │
│ │ [imagem] │  "O sabor que conquista a cidade..."        │
│ └─────────┘                                              │
│                                                           │
│ ─── STORIES ─────────────────────────────────────────── │
│                                                           │
│ ┌─────────┐  📅 20.03 · ENQUETE                         │
│ │ [imagem] │  "Qual pizza você prefere?"                 │
│ └─────────┘                                              │
│                                                           │
│        ┌──────────────────────────────────────┐          │
│        │  ✅ Aprovar    │  ✏️ Pedir Revisão  │          │
│        └──────────────────────────────────────┘          │
│                                                           │
│  Campo de observações (se revisão):                      │
│  ┌────────────────────────────────────────────┐          │
│  │                                            │          │
│  └────────────────────────────────────────────┘          │
│  [Enviar feedback]                                       │
│                                                           │
│        Starken Performance © 2026                        │
└─────────────────────────────────────────────────────────┘
```

Quando o cliente clica "Aprovar" ou "Pedir Revisão":
- Atualiza o status no Supabase em tempo real
- Gestor vê a mudança automaticamente no dashboard
- Se revisão: observações ficam registradas no cronograma

### 3.6 — Dados e Supabase

**Nova tabela: `schedules`**
```sql
CREATE TABLE schedules (
  id text PRIMARY KEY,
  client_id text REFERENCES clients(id) ON DELETE CASCADE,
  week_label text NOT NULL,         -- "3ª Semana de Março"
  status text DEFAULT 'rascunho',   -- rascunho|pronto|enviado|aprovado|revisao
  sent_at timestamptz,
  approved_at timestamptz,
  revision_notes text,
  public_token text UNIQUE,         -- token para URL pública
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Nova tabela: `schedule_posts`**
```sql
CREATE TABLE schedule_posts (
  id text PRIMARY KEY,
  schedule_id text REFERENCES schedules(id) ON DELETE CASCADE,
  sort_order integer DEFAULT 0,
  post_date text,                   -- "18.03"
  content_type text,                -- "CARROSSEL DE FOTOS", "REELS", etc.
  section text DEFAULT 'feed',      -- "feed" ou "stories"
  caption text,
  image_url text,                   -- URL da imagem no Supabase Storage
  client_note text,                 -- observação do cliente sobre este post
  created_at timestamptz DEFAULT now()
);
```

**Supabase Storage:**
- Bucket `schedule-images` para armazenar as artes dos posts
- Substituir `imageData` (base64 em localStorage) por upload real

**RLS Policies:**
- Gestor: acesso total (via anon key)
- Página pública: SELECT em schedules e schedule_posts filtrado por `public_token`

---

## 4. Resumo de Telas

| Tela | Tipo | Descrição |
|---|---|---|
| Dashboard Cronogramas | Tab principal | Grid de cards com filtros e status |
| Editor de Cronograma | Modal fullscreen | Criar/editar cronograma com grid de posts |
| Editor de Post | Drawer lateral | Editar detalhes de um post específico |
| Popup de Envio | Modal pequeno | Escolher método de envio (WhatsApp/PDF) |
| Página Pública | URL externa | Cliente visualiza e aprova/pede revisão |

---

## 5. Prioridade de Implementação

| Fase | Entrega | Impacto |
|---|---|---|
| **Fase 1** | Dashboard de cards + status + modal de criação/edição | Alto — muda a experiência principal |
| **Fase 2** | Supabase Storage para imagens + tabelas schedules/posts | Alto — elimina base64 no localStorage |
| **Fase 3** | Envio via WhatsApp com link público | Alto — valor direto ao fluxo de trabalho |
| **Fase 4** | Página pública com aprovação/revisão pelo cliente | Médio-Alto — fecha o loop de feedback |

---

## 6. Especificações Visuais

- **Cards:** border-radius 12px, sombra suave, hover com elevação
- **Status badges:** pills com cor de fundo e ícone
- **Modal fullscreen:** fundo escuro semi-transparente, slide de baixo para cima
- **Drawer lateral:** slide da direita, 400px largura, overlay escuro
- **Cores de status:** seguem design system existente (azul, roxo, amarelo, verde, laranja)
- **Grid de posts:** 3 colunas desktop, 2 tablet, 1 mobile
- **Página pública:** branding Starken, fundo clean, botões grandes para ação no mobile

---

## 7. Métricas de Sucesso

- Tempo para criar cronograma e enviar: < 5 minutos
- Cliente consegue aprovar/pedir revisão em 1 clique
- Zero perda de dados (tudo na nuvem via Supabase)
- Funciona bem no mobile (gestor usa muito celular)
