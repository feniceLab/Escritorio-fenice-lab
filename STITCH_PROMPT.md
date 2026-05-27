# Prompt para Stitch / Lovable / v0

## Copie e adapte conforme o módulo que quer gerar

---

## Prompt Base (cole primeiro)

```
Crie um SPA de gestão de conteúdo para redes sociais (agência de marketing).
Design: ClickUp/Notion style — sidebar escura fixa, conteúdo claro, tipografia Inter.

Paleta:
- Sidebar: #191b23 (sempre escura)
- Sidebar active: indigo rgba(99,102,241,0.14) com borda esquerda #6366f1
- Brand: #4f6ef7 (indigo-blue)
- Background: #f0f2f5
- Cards: #ffffff
- Text: #111827 (primary), #4b5563 (secondary), #9ca3af (muted)
- Success: #16a34a, Warning: #d97706, Danger: #dc2626
- Borders: #e5e7eb
- Radius: 6-8px (não pills arredondados)
- Font: Inter, 13px base

Funcionalidades do sistema:
- Multi-tenant: 2 agências (Starken Performance com 25 clientes, Alpha Assessoria com 10)
- Login por PIN (4 dígitos)
- 3 temas: Light (padrão), Dark, Warm/Sepia
```

---

## Prompt por Módulo

### Sidebar
```
Crie uma sidebar estilo ClickUp:
- 240px largura, fixa, sempre escura (#191b23)
- Logo "Starken OS" no topo com subtítulo "SISTEMA OPERACIONAL"
- Seções: CONTEÚDO (Dashboard, Calendário), CLIENTES (2 pastas expandíveis com clientes dentro), TOOLS (Meta Ads, Relatórios, Configuração)
- Folders expandem com chevron e mostram count de clientes
- Item ativo: fundo indigo sutil + borda esquerda indigo 3px
- Footer: avatar do usuário + nome + 3 botões de tema (sol, lua, folha)
```

### Lista de Tasks (Gestão de Conteúdo)
```
Crie uma lista de tarefas estilo ClickUp:
- Header com: select de cliente, botão "+ Novo Grupo", filtros (status, responsável)
- Grupos expandíveis (ex: "Março - 4 semana") com contagem
- Cada task row em grid: checkbox, nome, formato (badge: Feed/Reels/Carrossel), status (dropdown colorido), responsável (avatar + nome), data, coluna PUBLICAÇÃO (pills com ✅ FB Publicado 26/03 17:25), prioridade
- 14 status possíveis com cores diferentes
- Seleção múltipla com barra de ações flutuante no bottom
- Rows com hover sutil, clicáveis para abrir modal
```

### Modal de Task
```
Crie um modal fullscreen de edição de tarefa estilo ClickUp:
- Layout 3 colunas: sidebar esquerda (scroll), conteúdo central (scroll), sidebar direita (atividade)
- Header: título editável grande, botões de meta (status, responsável, data, prioridade) como chips
- Seções: Briefing (textarea), Referências Visuais (upload de imagens), Criativo Final (upload com drag & drop, preview de imagem/vídeo), Copy do Post (textarea com botão "Gerar com IA"), Música para Vídeo (URL + upload MP3 + volume + render), Publicar (seleção FB/IG + agora/agendar), Comentários, Subtarefas
- Sidebar direita: log de atividade com timestamps
```

### Planner Semanal (Calendário)
```
Crie um planner semanal estilo Meta Business Suite:
- Toggle Semana/Mês no header
- 7 colunas (Dom-Sáb) com header mostrando dia da semana + número
- Dia atual com número em círculo azul
- Cards de posts em cada coluna com: thumbnail da imagem (aspect-ratio 1:1), hora + ícone plataforma (FB/IG), nome do cliente, caption truncada 2 linhas, dot de status colorido
- Cards clicáveis abrem modal de preview com: imagem grande, caption completa, status badge, plataforma
- Filtro de cliente + navegação semanal
```

### Dashboard
```
Crie um dashboard de agência:
- KPI cards no topo: Total Clientes, Posts Este Mês, Agendados, Taxa de Sucesso
- Gráfico de posts por semana (bar chart)
- Lista dos próximos posts agendados
- Posts recentes com status (publicado/falhou)
- Design clean, cards com border sutil sem shadow pesado
```

### Login
```
Crie uma tela de login com PIN:
- Layout split: lado esquerdo com branding (gradiente azul/indigo, logo grande, tagline), lado direito com formulário
- 4 inputs de PIN (círculos individuais, focam automaticamente)
- Lista de usuários pré-definidos para selecionar (avatar + nome)
- Sem email/senha, só PIN de 4 dígitos
```

---

## Notas para o Stitch

- NÃO precisa de backend, auth real, ou API calls
- Gere com dados mock/estáticos
- Priorize o VISUAL e LAYOUT, não a lógica
- Use Tailwind CSS ou CSS modules
- Responsive é secundário — foque em desktop (1440px+)
- Eu vou extrair apenas o CSS/HTML e adaptar para meu sistema existente
