# Prompt Otimizado para Google Stitch
## Starken OS V2.0 — Redesign Completo

---

## INSTRUCAO: Cole o PROMPT COMPLETO abaixo no Stitch (modo Web). Anexe os prints indicados em cada secao.

---

## PROMPT COMPLETO (copie tudo abaixo)

```
Design a complete web application called "Starken OS" — a social media management platform for marketing agencies.

DESIGN REFERENCE: ClickUp + Notion style. Dark fixed sidebar, clean light content, Inter font, rectangular badges (NOT rounded pills), minimal shadows, strong typography hierarchy.

I'm attaching screenshots of:
1. My CURRENT system (Starken OS) — what exists today
2. ClickUp reference — the style I want to achieve

## COLOR SYSTEM

Sidebar (ALWAYS dark, independent of theme):
- Background: #191b23
- Hover: rgba(255,255,255,0.055)
- Active item: rgba(99,102,241,0.14) fill + 3px left border #6366f1
- Section labels: rgba(255,255,255,0.38)
- Nav text: rgba(255,255,255,0.62)
- Active text: rgba(255,255,255,0.88)

Content area:
- App background: #f0f2f5
- Cards/surfaces: #ffffff
- Elevated/hover: #f8f9fb
- Brand primary: #4f6ef7 (indigo-blue)
- Text: #111827 (primary), #4b5563 (secondary), #9ca3af (muted)
- Borders: #e5e7eb
- Success: #16a34a | Warning: #d97706 | Danger: #dc2626

Typography:
- Font: Inter
- Body: 13px, line-height 1.5
- Labels: 11px uppercase, letter-spacing 0.8px
- Headings: 16-22px, weight 700

Radius: 4px for badges, 6px for inputs, 8px for cards/modals, 12px for panels
Shadows: Very subtle — 0 1px 3px rgba(0,0,0,0.06) for cards

## PAGE 1: FULL APP LAYOUT (Sidebar + Content Management)

### Sidebar (240px fixed, left)
- Logo area: "Starken OS" bold white + "SISTEMA OPERACIONAL" subtitle in caps, tiny, dim
- Workspace toggle: Two buttons "STARKEN" (blue) | "ALPHA" (green)
- Sections with uppercase dim labels:
  - CONTEUDO: "Dashboard" icon, "Calendario de Postagens" icon
  - CLIENTES:
    - Expandable folder "Starken Performance" with chevron + count badge "25"
      - Indented client names: "New Service", "Sr Salsicha", "Melhor Visao", "The Garrison", "Arena Gourmet", "Estilo Tulipa", "Suprema Pizza", "Super X - Garuva", "Super X - Itapoa", "Dilokas Pizzaria" (highlighted active), "Dommus Smart Home", etc.
    - Expandable folder "Alpha Assessoria" with count badge "10"
  - TOOLS: "Meta Ads Config", "Saldo Contas", "BI Campanhas", "Agendamento"
  - RELATORIOS: "Semanal", "Mensal"
  - GERAL: "Clientes", "Historico"
- Footer: User avatar circle "JU" + name "Juan" + settings icon + 3 theme dots

### Topbar (52px)
- Clean white, only bottom border (no shadow)
- Left: breadcrumb or page title "Calendario de Posts"
- Right: client navigation tabs "Conteudo" | "Calendario" (active, blue) | "Infos"

### Content: Task List (Gestao de Conteudo)
- Client name "Dilokas Pizzaria" with nav bar
- Toolbar: client select dropdown, "+ Novo Grupo" blue button, status filter, assignee filter
- Column headers (uppercase, tiny, gray): NOME | FORMATO | STATUS | RESPONSAVEL | DATA | PUBLICACAO | PRIORIDADE
- Expandable group row: "Marco - 4 semana (3)" with folder icon and count
- Task rows (42px height, subtle bottom border):
  - Checkbox + drag handle (6 dots)
  - Task name: "Post - Sorteio" (font-weight 500)
  - Format badge: rectangular colored badge "Feed" or "Reels" (4px radius, small)
  - Status: rectangular colored badge "Publicado" (green bg, dark green text, 4px radius)
  - Assignee: small avatar circle "JU" + "Juan"
  - Date: "24/03"
  - Publication: stacked rectangular pills "FB Publicado 24/03 17:40" + "IG Publicado 24/03 17:40" (green, with checkmark icon)
  - Priority: colored circle dot
- Bottom floating action bar (appears on selection): dark bar with buttons "Status", "Responsavel", "Prioridade", "Agendar" (blue), "Duplicar", "Excluir" (red)

## PAGE 2: POST PLANNER (Weekly Calendar)

### Same sidebar + topbar

### Content: Week Planner (like Meta Business Suite Planner)
- Toolbar: "Planner" title + "Semana | Mes" toggle (Semana active blue) + client filter + "Hoje" button + week navigation arrows + "mar 22 - 28, 2026" label
- 7 day columns: Dom 22 | Seg 23 | Ter 24 | Qua 25 | Qui 26 (today, number in blue circle) | Sex 27 | Sab 28
- Each column is a vertical scrollable area with post cards:
  - Post card (white, 1px border, 10px radius, subtle shadow on hover):
    - Thumbnail image at top (square, full width, object-fit cover)
    - Below image: time "17:05" + platform icon (FB blue or IG gradient) + status dot (green/red/yellow)
    - Client name bold: "Dilokas Pizzaria"
    - Caption preview (2 lines, gray, truncated): "Hoje e o dia! Vamos abrir as portas..."
    - If failed: red "Falhou" label
  - Video card variant: dark background with play button icon instead of image
  - No-image card variant: colored top border (3px) instead of image

## PAGE 3: TASK MODAL (Post Editor)

### Full-screen modal (3 column layout)
- Left sidebar (220px): tree navigation of tasks in current group
- Center (flexible):
  - Title large: "Post - Sorteio" (22px, bold)
  - Meta chips row: Status badge "Agendar" | Avatar "JU Juan" | Date "26/3/2026" | Priority "Normal"
  - Green "Salvar" button top-right
  - Sections (each with uppercase label):
    - "BRIEFING / DIRECIONAMENTO": textarea
    - "REFERENCIAS VISUAIS": image upload grid with "+ Adicionar" button
    - "FORMATOS DO POST": toggle buttons Feed | Reels | Carrossel | Story
    - "CRIATIVO": upload area with image/video thumbnails, "Escolher thumbnail" button
    - "MUSICA PARA VIDEO": URL input + Upload MP3 tabs, volume slider, fade out, "Renderizar" purple button
    - "COPY": textarea with the post caption, "Gerar Copy - Estrategia" green button + "Gerar Copy - Briefing" dark button
    - "PUBLICAR": platform selection Facebook | Instagram, mode "Publicar Agora" dropdown, blue "Publicar" button, publication history list
    - "DESCRICAO / NOTAS": textarea
    - "SUBTAREFAS": inline add with "+"
    - "AGENDA DA SEMANA": mini calendar strip (7 days, dots for posts)
    - "COMENTARIOS": comment input + list
- Right sidebar (280px): Activity log with timestamps

## PAGE 4: DASHBOARD

- 4 KPI cards in a row:
  - "Total de clientes" → 26 (blue accent)
  - "Clientes ativos" → 10 (green accent)
  - "Posts agendados" → 36 (orange accent)
  - "Posts publicados" → 0/36 (red accent)
- "Progresso Semanal" section: two rows (Starken Performance, Alpha Assessoria) with progress bars
- "Progresso Mensal" section: same layout
- "Ultimos Envios" section: recent activity list

## IMPORTANT NOTES

- Use Inter font from Google Fonts
- Desktop only (1440px+ viewport)
- Generate with static/mock data
- Focus on VISUAL DESIGN and LAYOUT, not functionality
- All text in Portuguese (Brazilian)
- Rectangular badges (4px radius), NOT rounded pills (20px radius)
- Minimal shadows — prefer borders over shadows
- Status colors: green for published/approved, blue for scheduled/in-progress, yellow for warning/pending, red for failed/danger, purple for creative/design
```

---

## PRINTS PARA ANEXAR

### Sistema Atual (anexe estes):
1. `123.png` — Dashboard atual
2. `FireShot Capture 011` — Lista de tasks atual
3. `FireShot Capture 012` — Modal de task atual
4. `FireShot Capture 010` — Planner semanal atual

### Referencia ClickUp (anexe estes):
5. `FireShot Capture 004` — ClickUp List view (referencia sidebar + lista)
6. `clickup.webp` — ClickUp Board view (referencia cards e layout)

---

## DICA: Se o Stitch gerar algo generico, refine com:
- "Make the sidebar darker, use #191b23 background"
- "Change all rounded pill badges to rectangular with 4px border-radius"
- "Add more breathing room between task rows, use 42px row height"
- "Make the planner look exactly like Meta Business Suite weekly planner"
- "Use uppercase tiny labels for section headers like ClickUp does"
