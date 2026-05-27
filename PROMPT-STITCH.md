# Prompt para Stitch — Starken OS Design System

Cole este prompt inteiro no Stitch para gerar o design system completo.

---

Crie um design system completo e todas as telas para o produto "Starken OS" — um sistema operacional para agências de marketing digital. O produto é uma SPA web, desktop-first, com sidebar de navegação fixa à esquerda. Use o estilo visual moderno, limpo e profissional, inspirado em ClickUp, Linear e Notion.

## IDENTIDADE VISUAL

- Fonte: Inter (Google Fonts), weights 400, 500, 600, 700, 800
- Cor primária (brand Starken): #2a4dd7
- Cor secundária (brand Alpha): #10b981
- Background principal: #f7f9fc
- Cards/surfaces: #ffffff
- Texto primário: #111827
- Texto secundário: #4b5563
- Texto terciário: #9ca3af
- Borders: #e5e7eb
- Border radius padrão: 12px (cards), 8px (botões/inputs), 9999px (pills/badges)
- Sombra padrão: 0 1px 3px rgba(0,0,0,0.06)
- Sidebar SEMPRE dark: background #191b23, texto rgba(255,255,255,0.88), accent #6366f1

## DESIGN TOKENS — CORES COMPLETAS

### Semânticas
- Success: #16a34a, bg #f0fdf4, border #86efac
- Warning: #d97706, bg #fffbeb, border #fcd34d
- Danger: #dc2626, bg #fef2f2, border #fca5a5
- Info: #0284c7, bg #f0f9ff, border #bae6fd
- Purple: #7c3aed, bg #f5f3ff, border #c4b5fd

### Escala tipográfica
- 11px (xs), 12px (sm), 13px (base), 14px (md), 16px (lg), 18px (xl), 22px (2xl), 28px (3xl)

### Espaçamento
- 4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px

### Sombras
- xs: 0 1px 2px rgba(0,0,0,0.04)
- sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)
- md: 0 4px 8px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.04)
- lg: 0 10px 20px rgba(0,0,0,0.09), 0 4px 8px rgba(0,0,0,0.04)

## COMPONENTES BASE

### 1. Sidebar (240px, fixa à esquerda, sempre dark #191b23)
- Logo "Starken OS" no topo com subtítulo "SISTEMA OPERACIONAL"
- Tabs de space: "STARKEN" (azul) | "ALPHA" (verde)
- Menu items com ícone + label, hover: rgba(255,255,255,0.055), active: rgba(99,102,241,0.14) com barra lateral #6366f1
- Seção "CONTEÚDO" com sub-items
- Folders colapsáveis: "Starken Performance (27)" e "Alpha Assessoria (10)" com lista de clientes dentro, cada um com avatar circular colorido + nome
- Footer: avatar do usuário logado (circle com iniciais, cor do role) + nome + popup de troca de tema (Light/Dark/Warm) e logout

### 2. Topbar (horizontal, dentro do main content)
- Título da página atual à esquerda
- Breadcrumbs quando dentro de cliente
- Botão hambúrguer para mobile

### 3. Cards
- Background branco, border-radius 12px, shadow-sm, padding 20px
- Card title: font-weight 700, font-size 14px, margin-bottom 14px
- Stat card: ícone colorido 36x36px (rounded 8px) + label (12px, cinza) + valor grande (24px, bold)
- Variantes: starken (azul #2a4dd7), alpha (verde #10b981), warning (amarelo #d97706), success (verde #16a34a)

### 4. Botões
- Primary: bg #2a4dd7, text white, border-radius 8px, font-weight 600, padding 8px 16px
- Success: bg #10b981, text white
- Danger: bg transparent, border #dc2626, text #dc2626
- Outline: bg transparent, border #e5e7eb, text #4b5563
- Ghost: bg transparent, text #4b5563, hover bg #f3f4f6
- Small: padding 4px 9px, font-size 11px
- WhatsApp: bg #25d366, text white

### 5. Status Badges (pills arredondados)
- font-size 11px, font-weight 700, padding 3px 8px, border-radius 9999px
- A Fazer: text #374151, bg #f3f4f6
- Em Andamento: text #1d4ed8, bg #dbeafe
- Design: text #1d4ed8, bg #dbeafe
- Em Revisão: text #c2410c, bg #fff7ed
- Aprovação Design: text #dc2626, bg #fef2f2
- Aprovação: text #059669, bg #ecfdf5
- Aprovado: text #065f46, bg #d1fae5
- Agendar: text #92400e, bg #fffbeb
- Agendado: text #1e40af, bg #dbeafe
- Publicado: text #166534, bg #dcfce7

### 6. Priority Badges
- Urgente: icon 🚩, text #dc2626, bg #fef2f2, border #fecaca
- Alta: icon 🟠, text #b45309, bg #fffbeb, border #fde68a
- Normal: icon 🔵, text #1d4ed8, bg #eff6ff, border #bfdbfe
- Baixa: icon ⬇️, text #6b7280, bg #f9fafb, border #e5e7eb

### 7. Format Badges (tipo de post)
- Feed: 📷, text #4338ca, bg #eef2ff
- Reels: 🎬, text #6d28d9, bg #f5f3ff
- Carrossel: 🖼️, text #b45309, bg #fffbeb
- Story: 📱, text #be185d, bg #fdf2f8

### 8. Avatars
- Client avatar: 40x40px, rounded 50%, gradient fill (azul para Starken, verde para Alpha), iniciais brancas bold
- User avatar: 24x24px, circular, cor do role do usuário, iniciais
- Small avatar: 22x22px, usado em listas compactas

### 9. Tabelas/Listas
- Header: uppercase, font-size 11px, font-weight 600, color #9ca3af, padding 8px 12px, border-bottom #e5e7eb
- Rows: padding 10px 14px, border-bottom #f3f4f6, hover bg #f9fafb, cursor pointer
- Sem zebra — hover é o diferenciador

### 10. Inputs/Forms
- Input: border 1px solid #e5e7eb, border-radius 8px, padding 8px 12px, font Inter 13px
- Focus: border-color #6366f1, box-shadow 0 0 0 3px rgba(99,102,241,0.15)
- Select: mesmo estilo do input
- Textarea: auto-resize, min-height 80px
- Label: font-weight 600, font-size 12px, color #374151, margin-bottom 4px

### 11. Modals
- Overlay: fixed, bg rgba(15,23,42,0.55), backdrop-filter blur(4px)
- Card: bg white, border-radius 16px, shadow-xl, max-width variável
- Header: título bold + botão X
- Footer: botões Cancel + Save

### 12. Progress Bars
- Container: height 6px, bg #f2f4f7, border-radius 9999px
- Fill: border-radius 9999px, cor por empresa (azul Starken, verde Alpha)
- Label acima: empresa à esquerda, contagem à direita

### 13. Toast Notifications
- Position: fixed bottom-right, z-index alto
- Tipos: success (verde), error (vermelho), info (azul), warning (amarelo)
- border-radius 10px, shadow-lg, padding 12px 16px, auto-dismiss 4s

## TELAS PARA CRIAR

### TELA 1: Login
- Centralizado na tela, fundo gradiente sutil
- Logo "Starken OS" grande
- Campo "Selecione seu nome" (dropdown com: Juan, Henrique, Emilly, Leonardo, Dante)
- Campo "Sua senha" (password)
- Botão "Entrar" (primary, full-width)
- Mensagem de erro inline quando credenciais incorretas

### TELA 2: Dashboard
- Layout: sidebar esquerda (240px) + main content
- Main content:
  - **Row 1 — Stats (4 colunas):**
    - Card "Clientes Starken" — ícone azul "S", valor "26"
    - Card "Clientes Alpha" — ícone verde "A", valor "10"
    - Card "Pendentes Semana" — ícone amarelo "!", valor "24"
    - Card "Enviados Semana" — ícone verde "✓", valor "18/27"
  - **Row 2 — 2 colunas:**
    - Card "Progresso Semanal": barra Starken (70% azul, "15 pub · 3 agend · 26 total") + barra Alpha (60% verde, "4 pub · 2 agend · 10 total")
    - Card "Progresso Mensal": mesma estrutura, dados do mês inteiro
  - **Row 3 — 2 colunas:**
    - Card "Cronogramas da Semana": badges resumo (Pendentes: 8, Gerados: 5, Enviados: 14), lista de clientes com avatar + nome + status colorido (Pendente/Gerado/Enviado), link "Ver completo →"
    - Card "Agendamentos & Publicações da Semana": badges resumo (Agendados: 45, Publicados: 31, Total: 127). Conteúdo agrupado por DIA: header "SEG 14/04" (com badge "HOJE" se for hoje, destaque azul). Dentro de cada dia: clientes com avatar + nome + badges "3 agend" "2 pub". Abaixo de cada cliente: tasks individuais com ícone (✅📅⏳) + nome + formato (📷🎬🖼️📱). Link "Ver calendário →"
  - **Row 4:**
    - Card "Últimos Envios": lista com avatar + nome + tipo + data + status

### TELA 3: Minhas Tasks
- Header: título "🎯 Minhas Tasks" à esquerda
- Controles à direita: toggle "POR CLIENTE | LISTA ÚNICA" (pill buttons), dropdown "Todos os status", contagem "17 tasks"
- Pipeline pills abaixo do header: botões coloridos com contagem por status (ex: "✏️ Alteração 2", "🎨 Design 5", "👁️ Em Revisão 3")
- Tabela lista única com colunas: CLIENTE | NOME | FORMATO | STATUS | 📐 ENTREGA | 📅 POST | PUBLICAÇÃO | PRIO
- Cada row: nome do cliente (12px, cinza), nome da task (14px, bold), badge de formato (Feed/Reels/Story/Carrossel com ícone e cor), badge de status, data entrega, data post, publicação (—), badge de prioridade (URGENTE vermelho / ALTA amarelo / NORMAL azul)
- Tasks com status "alteracao-design" têm borda esquerda vermelha 3px e fundo levemente rosa

### TELA 4: Gestão de Conteúdo
- Toolbar: seletor de cliente, botão "+ Nova Task", busca, filtros
- Lista hierárquica estilo ClickUp:
  - Grupo (cabeçalho expandível): nome do grupo + contagem + botão add
  - Tasks dentro: checkbox + drag handle + nome + badges (formato, status, responsável avatar, data, prioridade)
  - Subtasks indentadas abaixo das tasks
- Bulk selection: barra flutuante no bottom com: "3 selecionadas" + botões Status, Responsável, Prioridade, Agendar, Deletar

### TELA 5: Modal de Task (Fullscreen, 3 painéis)
- Overlay escuro com blur
- Modal ocupa ~95% da tela, border-radius 16px
- **Painel esquerdo (240px):** mini sidebar com navegação de subtasks, hierarquia visual
- **Painel central (flex):** 
  - Header: nome da task (editável, bold 18px) + badge status + badge prioridade
  - Seções empilhadas: Briefing (textarea), Referências visuais (upload + grid de thumbs), Criativo Final (upload + imagem grande), Copy (textarea), Descrição (textarea rich)
  - Seção "Publicar/Agendar": seletor de plataforma (FB/IG), formato, modo (agora/agendar), datetime picker, botão publicar
- **Painel direito (320px):** 
  - Tabs: Comentários | Atividade
  - Comentários: avatar + nome + texto + data, input no bottom
  - Atividade: timeline com ícone + descrição + data

### TELA 6: Calendário de Posts
- Header: botões ← mês → , botão "Hoje", filtro por cliente
- Grid 7 colunas (SEG TER QUA QUI SEX SÁB DOM)
- Cada célula do dia: número do dia + mini cards coloridos dos posts
  - Verde (#dcfce7): publicado
  - Azul (#dbeafe): agendado
  - Vermelho (#fef2f2): falhou
  - Amarelo (#fffbeb): na fila
- Cada mini card: nome curto do post + ícone formato

### TELA 7: Publicar/Agendar
- Layout 2 colunas: formulário (esquerda) + preview (direita)
- **Formulário:**
  - Dropdown cliente
  - Multi-select plataforma: Facebook | Instagram (checkboxes visuais com ícones)
  - Tipo de conteúdo: Feed | Reels | Story | Carrossel (botões radio visuais)
  - Modo: "⚡ Publicar Agora" | "📅 Agendar" (toggle)
  - Campo datetime (quando agendar)
  - Textarea caption (com contador de caracteres)
  - Upload zone: drag & drop + botão browse, grid de thumbnails com reorder (setas + drag)
  - Botão submit: "🚀 Publicar" ou "📅 Agendar" (gradient azul, bold)
- **Preview:**
  - Mock de post do Instagram/Facebook
  - Carousel swipeable: slides com snap, dots indicadores, setas < >
  - Caption abaixo da imagem

### TELA 8: Hub do Cliente
- Header: avatar grande do cliente + nome + tenant badge (Starken/Alpha)
- 6 tabs horizontais: Visão Geral | Marca | Materiais | Links | Atividade | Contexto Copy
- **Visão Geral:** KPIs cards + resumo de tasks + últimos posts
- **Marca:** Logo + paleta de cores + tipografia + guidelines
- **Materiais:** Grid de imagens/arquivos com upload
- **Links:** Lista de URLs importantes (site, redes sociais, drive)
- **Atividade:** Timeline de ações recentes
- **Contexto Copy:** Briefing de tom de voz, público-alvo, referências

### TELA 9: Cronograma Semanal
- Seletor de mês + semana
- Barra de período: "Semana 2: 07/04 a 13/04"
- Lista de clientes com: avatar + nome + status (Pendente/Gerado/Enviado) + botão "Gerar Cronograma"
- Quando gerado: preview do PDF + botão "Enviar via WhatsApp"

### TELA 10: Config Meta
- Header: "Configuração Meta API"
- Token input: campo para access token + botão "Discover Assets"
- Lista de contas configuradas: card por conta com nome + página FB + conta IG + status
- Botões: editar, remover

## 3 TEMAS

Gere cada tela em 3 variações de tema:

### Light (padrão)
- App bg: #f7f9fc, Cards: #ffffff, Text: #111827, Borders: #e5e7eb

### Dark
- App bg: #0d1117, Cards: #161b22, Text: #e6edf3, Borders: #30363d
- Sidebar permanece #191b23 (mesma cor)
- Sombras mais fortes: rgba(0,0,0,0.3+)

### Warm
- App bg: #f2ede4, Cards: #fdf8f0, Text: #2d2a22, Borders: #ddd4c0
- Tons de bege/creme, sombras suaves com rgba(80,60,20,0.08)

## REGRAS GERAIS

- Estilo visual: minimalista, profissional, moderno, sem bordas pesadas
- Ícones: emojis nativos (não usar icon library)
- Idioma: Português Brasileiro em toda a UI
- Desktop-first (1440px reference), responsivo até 480px
- Sidebar SEMPRE dark (#191b23), independente do tema
- Hover states em tudo que é clicável
- Animações suaves (150ms ease)
- Sem decoração excessiva — dados e funcionalidade em primeiro lugar
