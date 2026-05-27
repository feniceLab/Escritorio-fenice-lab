# PRD — Starken OS

## 1. Visão Geral

**Produto:** Starken OS — Sistema Operacional para Agências de Marketing Digital
**URL:** starken-os.vercel.app
**Stack:** SPA em HTML/CSS/JS puro (single file), Supabase (backend), Vercel (deploy)
**Usuários:** 5 colaboradores (Juan, Henrique, Emilly, Leonardo, Dante)
**Clientes atendidos:** 35 (25 Starken Performance + 10 Alpha Assessoria)

### Propósito
Plataforma unificada para gestão completa de agência: criação de conteúdo, agendamento de publicações, cronogramas semanais, relatórios, gestão de tráfego e aprovações de clientes.

---

## 2. Usuários & Roles

| Nome | Role | Cor | Acesso |
|------|------|-----|--------|
| Juan | admin | #3b82f6 | Acesso total |
| Leonardo | admin | #a855f7 | Acesso total |
| Henrique | designer | #8b5cf6 | Apenas Minhas Tasks + Design Overview |
| Emilly | editor | #f59e0b | Conteúdo, publicação, aprovação |
| Dante | executor | #f97316 | Minhas Tasks (somente status Agendar/Aprovação) |

### Login
- Baseado em PIN/senha via Supabase RPC `verify_login`
- Sessão salva em localStorage
- Sem backend de autenticação (JWT etc.)

---

## 3. Arquitetura de Navegação

### Sidebar (sempre dark — #191b23)
```
├── Dashboard
├── 🎯 Minhas Tasks
├── CONTEÚDO
│   ├── 📅 Calendário de Postagens
├── ⭐ Starken Performance (27 clientes)
│   ├── Academia São Pedro
│   ├── Arena Gourmet
│   ├── ... (lista completa)
├── 🟢 Alpha Assessoria (10 clientes)
│   ├── Mestre do Frango
│   ├── Patricia Salgados
│   ├── ... (lista completa)
└── Footer: Avatar + Nome + Tema (Light/Dark/Warm)
```

### Tabs Principais (22 telas)

| # | Tab ID | Nome | Descrição |
|---|--------|------|-----------|
| 1 | dashboard | Dashboard | KPIs, progresso semanal/mensal, cronogramas, agendamentos |
| 2 | minhas-tasks | Minhas Tasks | Tasks do usuário logado, filtro por status |
| 3 | content | Gestão de Conteúdo | Lista de tasks por cliente (ClickUp-like) |
| 4 | calendario | Calendário de Posts | Grid mensal com posts coloridos por status |
| 5 | gestao | Gestão de Projetos | Lista, Kanban, Calendário de projetos |
| 6 | sched-weekly | Cronograma Semanal | Geração e envio de cronogramas semanais |
| 7 | weekly | Checklist Semanal | Checklist de tarefas semanais |
| 8 | monthly | Checklist Mensal | Checklist de tarefas mensais |
| 9 | meta-publish | Publicar/Agendar | Publicação FB/IG com preview |
| 10 | meta-config | Config Meta | Tokens e configuração Meta API |
| 11 | meta-balance | Saldo Meta Ads | Saldo das contas de anúncios |
| 12 | meta-bi | BI Campanhas | Dashboard de performance de campanhas |
| 13 | traffic | Gestão de Tráfego | Gestão de anúncios e tráfego pago |
| 14 | client-hub | Hub do Cliente | Portal com abas: Visão Geral, Marca, Materiais, Links, Atividade, Copy |
| 15 | client-info | Info do Cliente | Ficha cadastral do cliente |
| 16 | content-approval | Aprovação de Conteúdo | Cronogramas para aprovação do cliente |
| 17 | clients | Clientes | Cadastro e gestão de clientes |
| 18 | history | Histórico | Histórico de envios de relatórios |
| 19 | ai-squads | AI Squads | Squads de IA (Copy, Data, Brand, Traffic) |
| 20 | asana-tasks | Asana Tasks | Integração com Asana |
| 21 | google-ads | Google Ads | Gestão de Google Ads |
| 22 | system-logs | Logs do Sistema | Logs de atividade do sistema |

---

## 4. Telas Detalhadas

### 4.1 Dashboard

**Layout:** Grid de cards responsivo

**Componentes:**
- **Stats Cards (4 colunas):**
  - Clientes Starken (azul) — contagem
  - Clientes Alpha (verde) — contagem
  - Pendentes Semana (amarelo) — cronogramas não enviados
  - Enviados Semana (verde) — enviados/gerados

- **Progresso Semanal** — Barra por empresa (Starken / Alpha), mostra publicados · agendados · total
- **Progresso Mensal** — Mesma estrutura, período do mês inteiro
- **Cronogramas da Semana** — Lista de clientes com status (Pendente/Gerado/Enviado)
- **Agendamentos & Publicações da Semana** — Agrupado por DIA → CLIENTE → TASK individual
  - Header do dia: SEG 14/04, TER 15/04... com badge "HOJE"
  - Dentro: avatar cliente + nome + badges (agend/pub/pend)
  - Cada task: ícone status (✅📅⏳) + nome + formato (📷🎬🖼️📱)
- **Últimos Envios** — Lista recente de cronogramas enviados

---

### 4.2 Minhas Tasks

**Layout:** Header com controles + lista de tasks

**Componentes:**
- **Toggle view:** Por Cliente | Lista Única
- **Filtro de status:** Dropdown (todos, a-fazer, design, aprovação, etc.)
- **Contagem:** "X tasks"
- **Pipeline pills:** Contadores rápidos por status (clicáveis)

**Modo Lista Única — Colunas:**
| CLIENTE | NOME | FORMATO | STATUS | 📐 ENTREGA | 📅 POST | PUBLICAÇÃO | PRIO |

**Modo Por Cliente:**
- Seções colapsáveis por cliente com avatar + contagem
- Mesmas colunas sem CLIENTE

**Regras por role:**
- `designer`: Vê botão "📨 Revisão" em tasks com status `design`, badge "✏️ CORRIGIR" para `alteracao-design`
- `executor` (Dante): Só vê tasks com status `agendar` ou `aprovacao`

---

### 4.3 Gestão de Conteúdo (Content Management)

**Layout:** Toolbar + lista hierárquica de tasks

**Funcionalidades:**
- **Hierarquia:** Grupos → Tasks → Subtasks (até 5 níveis recursivos)
- **Colunas:** Nome, Status, Responsável, Data, Indicadores, Prioridade
- **14 status customizados** com cores distintas (ver seção 6)
- **Modal fullscreen (3 painéis):**
  - Esquerda: navegação de subtasks
  - Centro: Briefing, Referências, Criativo Final, Copy, Descrição, Publicar/Agendar
  - Direita: Comentários + Log de atividade
- **Drag & drop** para reordenar tasks
- **Bulk selection:** Checkboxes + barra flutuante (Status, Responsável, Prioridade, Agendar, Deletar)
- **Upload:** Referências visuais + criativo final via Supabase Storage
- **Lightbox:** Click na imagem abre fullsize

---

### 4.4 Calendário de Posts

**Layout:** Grid mensal 7 colunas (SEG-DOM)

**Posts coloridos por status:**
- 🟢 Verde = PUBLISHED
- 🔵 Azul = SCHEDULED
- 🔴 Vermelho = FAILED
- 🟡 Amarelo = QUEUED

**Controles:** Mês anterior/próximo, botão Hoje, filtro por cliente

---

### 4.5 Publicar/Agendar (Meta Publish)

**Layout:** 2 colunas (formulário + preview)

**Formulário:**
- Seletor de cliente
- Plataforma: Facebook, Instagram (multi-select)
- Tipo: Feed, Reels, Story, Carrossel
- Modo: Publicar Agora | Agendar
- Caption (textarea)
- Upload de mídia (múltiplos arquivos)
- Reordenação de fotos (drag & drop + setas)
- Botão publicar/agendar

**Preview:**
- Carousel swipeable com snap, dots, setas
- Preview do post como apareceria no feed

---

### 4.6 Hub do Cliente

**Layout:** Card com 6 sub-abas

**Sub-abas:**
1. Visão Geral — KPIs do cliente
2. Marca — Identidade visual, logos, paleta
3. Materiais — Uploads e assets
4. Links — URLs importantes
5. Atividade — Log de ações
6. Contexto Copy — Briefing de copywriting

---

## 5. Design Tokens

### 5.1 Cores

#### Brand
```
Starken:     #2a4dd7 (primary), #dde1ff (light), #b9c3ff (border), #0034c0 (dark)
Alpha:       #10b981 (primary), #ecfdf5 (light), #a7f3d0 (border), #059669 (dark)
```

#### Semânticas
```
Success:     #16a34a, bg: #f0fdf4, border: #86efac
Warning:     #d97706, bg: #fffbeb, border: #fcd34d
Danger:      #dc2626, bg: #fef2f2, border: #fca5a5
Info:        #0284c7, bg: #f0f9ff, border: #bae6fd
Purple:      #7c3aed, bg: #f5f3ff, border: #c4b5fd
```

#### Texto
```
Primary:     #111827
Secondary:   #4b5563
Tertiary:    #9ca3af
Disabled:    #d1d5db
Inverse:     #ffffff
```

#### Backgrounds
```
App:         #f7f9fc
Surface:     #ffffff
Elevated:    #f2f4f7
Overlay:     rgba(15,23,42,0.55)
```

#### Borders
```
Subtle:      #f3f4f6
Default:     #e5e7eb
Strong:      #d1d5db
Focus:       #6366f1
```

#### Sidebar (sempre dark)
```
Background:  #191b23
Hover:       rgba(255,255,255,0.055)
Active:      rgba(99,102,241,0.14)
Border:      rgba(255,255,255,0.07)
Text Dim:    rgba(255,255,255,0.38)
Text Mid:    rgba(255,255,255,0.62)
Text Bright: rgba(255,255,255,0.88)
Accent:      #6366f1
```

### 5.2 Tipografia

**Font:** Inter (Google Fonts) — weights: 400, 500, 600, 700, 800
**Fallback:** -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif

| Token | Tamanho |
|-------|---------|
| --text-xs | 0.6875rem (11px) |
| --text-sm | 0.75rem (12px) |
| --text-base | 0.8125rem (13px) |
| --text-md | 0.875rem (14px) |
| --text-lg | 1rem (16px) |
| --text-xl | 1.125rem (18px) |
| --text-2xl | 1.375rem (22px) |
| --text-3xl | 1.75rem (28px) |

### 5.3 Espaçamento

| Token | Valor |
|-------|-------|
| --space-1 | 4px |
| --space-2 | 8px |
| --space-3 | 12px |
| --space-4 | 16px |
| --space-5 | 20px |
| --space-6 | 24px |
| --space-8 | 32px |
| --space-10 | 40px |

### 5.4 Border Radius

| Token | Valor |
|-------|-------|
| --radius-xs | 4px |
| --radius-sm | 6px |
| --radius-md | 8px |
| --radius-lg | 12px |
| --radius-xl | 16px |
| --radius-2xl | 20px |
| --radius-full | 9999px |

### 5.5 Sombras

```
--shadow-xs:    0 1px 2px rgba(0,0,0,0.04)
--shadow-sm:    0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)
--shadow-md:    0 4px 8px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.04)
--shadow-lg:    0 10px 20px rgba(0,0,0,0.09), 0 4px 8px rgba(0,0,0,0.04)
--shadow-xl:    0 20px 40px rgba(0,0,0,0.12), 0 8px 16px rgba(0,0,0,0.06)
--shadow-brand: 0 4px 14px rgba(99,102,241,0.25)
```

### 5.6 Transições

```
--transition-fast: 80ms ease
--transition-base: 150ms ease
--transition-slow: 250ms ease
```

---

## 6. Sistema de Status

### Content Management (14 status)

| Status | Label | Cor texto | Cor fundo | Fase |
|--------|-------|-----------|-----------|------|
| a-fazer | A Fazer | #374151 | #f3f4f6 | Início |
| em-andamento | Em Andamento | #1d4ed8 | #dbeafe | Produção |
| criacao-conteudo | Criação de Conteúdo | #7c3aed | #f5f3ff | Produção |
| design | Design | #1d4ed8 | #dbeafe | Design |
| em-revisao | Em Revisão | #c2410c | #fff7ed | Revisão |
| aprovacao-design | Aprovação Design | #dc2626 | #fef2f2 | Aprovação |
| alteracao-design | Alteração Design | #dc2626 | #fef2f2 | Correção |
| aprovacao | Aprovação | #059669 | #ecfdf5 | Aprovação |
| alteracao | Alteração | #92400e | #fffbeb | Correção |
| revisao | Revisão | #dc2626 | #fef2f2 | Revisão |
| aprovado | Aprovado | #065f46 | #d1fae5 | Aprovado |
| agendar | Agendar | #92400e | #fffbeb | Agendamento |
| agendado | Agendado | #1e40af | #dbeafe | Agendado |
| publicado | Publicado | #166534 | #dcfce7 | Final |

### Prioridades

| Prioridade | Ícone | Cor | Background | Border |
|------------|-------|-----|------------|--------|
| urgente | 🚩 | #dc2626 | #fef2f2 | #fecaca |
| alta | 🟠 | #b45309 | #fffbeb | #fde68a |
| normal | 🔵 | #1d4ed8 | #eff6ff | #bfdbfe |
| baixa | ⬇️ | #6b7280 | #f9fafb | #e5e7eb |

### Formatos de Post

| Formato | Ícone | Cor | Background |
|---------|-------|-----|------------|
| feed | 📷 Feed | #4338ca | #eef2ff |
| reels | 🎬 Reels | #6d28d9 | #f5f3ff |
| carrossel | 🖼️ Carrossel | #b45309 | #fffbeb |
| story | 📱 Story | #be185d | #fdf2f8 |

---

## 7. Componentes UI

### 7.1 Cards
- **Card padrão:** bg surface, border-radius 12px, shadow-sm, padding 20px
- **Stat card:** Ícone colorido (36x36px) + label + valor grande
- **Variantes:** starken (azul), alpha (verde), warning (amarelo), success (verde)

### 7.2 Botões
- **Primary:** bg brand (#2a4dd7), text white, radius-md, weight 600
- **Success:** bg #10b981, text white
- **Danger:** bg transparent, border danger, text danger
- **Outline:** bg transparent, border default, text secondary
- **Small (btn-sm):** padding 4px 9px, font-size 0.72rem
- **WhatsApp:** bg #25d366, text white

### 7.3 Badges / Pills
- **Status badge:** Rounded-full, font-size 11px, weight 700, padding 3px 8px
- **Client avatar:** 40x40px, rounded, gradient fill com iniciais
- **Assignee avatar:** 24x24px, circular, cor do usuário
- **Priority badge:** Rounded-full com ícone + label uppercase

### 7.4 Tabelas
- **Header:** Uppercase, gray, font-size 0.75rem, weight 600
- **Rows:** Padding 10px 14px, border-bottom sutil, hover highlight
- **Zebra:** Não usa — hover é o diferenciador

### 7.5 Modals
- **Standard:** Overlay blur + card centralizado, max-width variável
- **Fullscreen (Content Task):** 3 painéis (sidebar 240px + main flex + activity 320px)
- **Close:** Botão X no header ou click no overlay

### 7.6 Forms
- **Inputs:** Border default, radius-md, padding 8px 12px, font Inter
- **Selects:** Mesmo estilo dos inputs
- **Textareas:** Auto-resize, min-height variável
- **Labels:** Font-weight 600, font-size 0.8rem, margin-bottom 4px

### 7.7 Progress Bars
- **Container:** Height 6px, bg elevated, radius-full
- **Fill:** Gradient ou cor sólida (starken=azul, alpha=verde), radius-full
- **Label:** Acima com empresa + contagem à direita

### 7.8 Toasts / Notifications
- **Position:** Fixed bottom-right
- **Types:** success (verde), error (vermelho), info (azul), warning (amarelo)
- **Auto-dismiss:** 4-5 segundos

---

## 8. Temas

### Light (padrão)
- Background: #f7f9fc
- Cards: #ffffff
- Text: #111827
- Borders: #e5e7eb

### Dark
- Background: #0d1117
- Cards: #161b22
- Text: #e6edf3
- Borders: #30363d

### Warm
- Background: #f2ede4
- Cards: #fdf8f0
- Text: #2d2a22
- Borders: #ddd4c0

---

## 9. Breakpoints Responsivos

| Breakpoint | Mudanças |
|------------|----------|
| 1024px | Stats grid 4→2 cols, two-columns→1, kanban 1 col |
| 768px | Post grid 3→1, drawers fullwidth |
| 480px | Stats grid 2→1 col |

---

## 10. Integrações

| Serviço | Uso |
|---------|-----|
| **Supabase** | Database, Storage, Auth (RPC), pg_cron |
| **Meta Graph API v25.0** | Publicação FB/IG, Insights, Media Upload |
| **Vercel** | Hosting (Hobby), 12 serverless functions |
| **Google Fonts** | Inter font family |

---

## 11. Fluxos Principais

### Fluxo de Publicação
```
Task criada → Design → Revisão → Aprovação → Agendar → Agendado → Publicado
```

### Fluxo de Cronograma Semanal
```
Gerar cronograma → PDF criado → Enviar via WhatsApp → Marcar como enviado
```

### Fluxo do Designer
```
Login → Minhas Tasks → Ver tasks "Design" → Trabalhar → Enviar para Revisão
```

### Fluxo do Executor (Dante)
```
Login → Minhas Tasks → Ver tasks "Agendar" e "Aprovação" → Agendar publicação
```
