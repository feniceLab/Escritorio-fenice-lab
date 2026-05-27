# PRD - Sistema de Gestao de Projetos Starken & Alpha

**Versao:** 2.0
**Data:** 2026-03-17
**Autor:** Claude Code + Juan (Gestor de Trafego)
**Sistema Base:** checklist-relatorios.html (SPA existente)

---

## 1. VISAO GERAL

### 1.1 Objetivo
Expandir o sistema web existente (checklist-relatorios.html) para incluir um **gerenciador de projetos e tarefas completo**, eliminando a dependencia do Asana e centralizando toda a operacao da agencia em uma unica plataforma customizada.

### 1.2 Problema Atual
- Equipe usa Trello (legado) + Asana (novo) + sistema proprio (relatorios)
- Informacoes espalhadas em multiplas plataformas
- Designer (Henrique) nao tem visibilidade clara das demandas
- Sem controle de status e responsaveis integrado
- Sem metricas de produtividade da equipe

### 1.3 Solucao
Um sistema unico que gerencia **Spaces > Projetos > Secoes > Tarefas** com:
- Controle de usuarios e responsaveis
- Workflow de status customizado por area
- Kanban visual para criacao de conteudo
- Dashboard de metricas e produtividade
- Integrado com Supabase (backend) e sistema de relatorios existente

---

## 2. ARQUITETURA DE SPACES

### 2.1 Hierarquia

```
SISTEMA
|
|-- Space: STARKEN (25 clientes)
|   |-- Conteudo & Design
|   |   |-- Kanban Board (status workflow)
|   |   |-- Filtros: cliente, responsavel, tipo, semana
|   |   |-- Tarefas de criacao de conteudo + design
|   |
|   |-- Cronogramas
|   |   |-- Vista calendario por cliente
|   |   |-- Planejamento semanal/mensal
|   |   |-- Aprovacao de cronograma
|   |
|   |-- Relatorios
|   |   |-- Checklist de envio (sistema existente)
|   |   |-- Status: Pendente > Gerado > Enviado
|   |   |-- Historico de relatorios por cliente
|   |
|   |-- Informacoes dos Clientes (Hub)
|       |-- Secao por cliente (25 secoes)
|       |-- Acessos, Drive, Logo, Contrato, Andamento
|       |-- Dados importados do Trello
|
|-- Space: ALPHA (10 clientes)
|   |-- (mesma estrutura acima)
|
|-- Area: CONFIGURACOES
    |-- Usuarios e permissoes
    |-- Preferencias do sistema
    |-- Backup/Restore
```

### 2.2 Navegacao (Sidebar)

```
[Logo Starken Performance]

-- Dashboard (visao geral)

-- STARKEN
   |-- Conteudo & Design
   |-- Cronogramas
   |-- Relatorios
   |-- Hub dos Clientes

-- ALPHA
   |-- Conteudo & Design
   |-- Cronogramas
   |-- Relatorios
   |-- Hub dos Clientes

-- Configuracoes
   |-- Equipe
   |-- Preferencias
```

---

## 3. USUARIOS E PERMISSOES

### 3.1 Usuarios do Sistema

| ID | Nome | Cargo | Permissoes | Clientes Atribuidos |
|----|------|-------|------------|---------------------|
| 1 | Juan | Gestor de Trafego / Admin | FULL ACCESS | Todos |
| 2 | Henrique | Designer | Conteudo & Design (ver e executar tarefas de design) | Todos |
| 3 | Bruna | Criadora de Conteudo | Conteudo & Design + Cronogramas | Fratelli's, Mestre do Frango, Pizzaria do Nei, Saporito, Super Duper, World Burger, New Service, The Garrison |
| 4 | Emilly | Criadora de Conteudo | Conteudo & Design + Cronogramas | Academia Sao Pedro, D' Britos, Patricia Salgados, Salfest, Where2Go |
| 5 | Marina | Criadora de Conteudo | Conteudo & Design + Cronogramas | Melhor Visao |

### 3.2 Niveis de Permissao

| Nivel | Descricao | Acoes |
|-------|-----------|-------|
| **Admin** | Acesso total | CRUD tudo, gerenciar usuarios, configuracoes |
| **Editor** | Acesso operacional | Criar/editar tarefas, mover status, ver todos os clientes |
| **Executor** | Acesso limitado | Ver tarefas atribuidas, atualizar status, adicionar comentarios |

### 3.3 Autenticacao

Login simples por PIN/senha (sem necessidade de OAuth):

```
Tela de Login:
- Select: Escolha seu nome [dropdown com usuarios]
- Input: Senha/PIN [4-6 digitos]
- Button: Entrar
```

- Senha armazenada como hash no Supabase
- Sessao via localStorage (token simples)
- Timeout de sessao: 7 dias

---

## 4. MODULO: CONTEUDO & DESIGN

### 4.1 Descricao
Area principal de trabalho onde toda a criacao de conteudo e design e gerenciada. Funciona como um **Kanban Board** com colunas de status.

### 4.2 Workflow de Status

```
BRIEFING          EM CRIACAO        DESIGN           APROVACAO         AGENDAR          PUBLICADO
(Linha Editorial)  (Copy/Roteiro)    (Arte/Video)     (Cliente aprova)  (Programar post)  (Concluido)
    |                  |                |                 |                |                |
    v                  v                v                 v                v                v
 [cinza]           [azul]           [roxo]            [amarelo]        [verde]          [verde escuro]
```

**Status detalhados:**

| Status | Cor | Descricao | Responsavel |
|--------|-----|-----------|-------------|
| BRIEFING | #94a3b8 (cinza) | Definir tema, formato, objetivo | Juan / Bruna / Emilly |
| EM CRIACAO | #3b82f6 (azul) | Escrevendo copy/roteiro/legenda | Bruna / Emilly / Marina |
| DESIGN | #8b5cf6 (roxo) | Henrique criando arte/editando video | Henrique |
| REVISAO | #f59e0b (amarelo) | Ajustes solicitados no design/copy | Henrique / Criador |
| APROVACAO | #eab308 (dourado) | Enviado para cliente aprovar | Juan |
| APROVADO | #22c55e (verde) | Cliente aprovou, agendar publicacao | Juan / Bruna / Emilly |
| AGENDADO | #06b6d4 (cyan) | Programado na plataforma (Instagram/FB) | Bruna / Emilly |
| PUBLICADO | #15803d (verde escuro) | Post no ar | - |
| ARQUIVO | #6b7280 (cinza escuro) | Semanas anteriores arquivadas | - |

### 4.3 Campos de uma Tarefa de Conteudo

| Campo | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| titulo | text | Sim | Nome da tarefa (ex: "Feed 1 - Mortadella - Marco S3") |
| cliente | select | Sim | Dropdown com todos os clientes do Space |
| tipo_conteudo | select | Sim | Feed, Story, Reels, Carrossel, Video, Trafego, Outro |
| responsavel | select | Sim | Quem esta executando a tarefa |
| designer | select | Nao | Henrique (ou outro designer futuro) |
| status | select | Sim | Status do workflow (ver 4.2) |
| data_publicacao | date | Nao | Data prevista de publicacao |
| semana | text | Auto | Calculado automaticamente (ex: "S3 Marco") |
| legenda | textarea | Nao | Copy/texto do post |
| imagem | file/url | Nao | Imagem ou link do Drive/Canva |
| notas_cliente | textarea | Nao | Feedback/observacoes do cliente |
| prioridade | select | Nao | Baixa, Normal, Alta, Urgente |
| recorrente | boolean | Nao | Se eh conteudo recorrente (stories diarios, etc) |
| labels | multi-select | Nao | Tags customizaveis |

### 4.4 Vistas (Views)

#### 4.4.1 Kanban Board (Principal)
- Colunas = Status do workflow
- Cards = Tarefas
- Drag-and-drop entre colunas
- Filtros: Cliente, Responsavel, Tipo, Semana, Prioridade
- Agrupamento: Por Cliente ou Por Responsavel

#### 4.4.2 Lista por Cliente
- Agrupa tarefas por cliente
- Mostra status, responsavel, data
- Expandir/colapsar cada cliente

#### 4.4.3 Calendario
- Vista mensal/semanal
- Cards posicionados na data de publicacao
- Cores por tipo de conteudo

#### 4.4.4 Vista do Designer (Henrique)
- Filtra automaticamente: status = DESIGN ou REVISAO
- Mostra apenas tarefas que precisam de arte/video
- Ordenado por prioridade e data
- Atalho rapido para mover para "APROVACAO"

### 4.5 Acoes Rapidas

| Acao | Descricao |
|------|-----------|
| + Nova Tarefa | Modal com formulario completo |
| Duplicar | Copia tarefa (util para conteudo recorrente) |
| Mover Status | Drag-drop ou botao de avancar |
| Atribuir | Mudar responsavel rapidamente |
| Comentar | Adicionar nota/feedback |
| Arquivar | Mover para ARQUIVO |

---

## 5. MODULO: CRONOGRAMAS

### 5.1 Descricao
Planejamento e visualizacao de cronogramas semanais/mensais por cliente. Permite criar, aprovar e acompanhar o calendario de publicacoes.

### 5.2 Funcionalidades

| Feature | Descricao |
|---------|-----------|
| Calendario Visual | Grade mensal com posts por dia |
| Cronograma Semanal | Template de 7 dias com slots de publicacao |
| Link de Aprovacao | Gerar link publico para cliente aprovar |
| Status do Cronograma | Rascunho > Enviado > Aprovado > Em Execucao |
| Historico | Cronogramas anteriores por cliente |
| Template | Reutilizar cronograma de uma semana para outra |

### 5.3 Estrutura de um Cronograma

```
Cronograma Semanal: Mortadella - S3 Marco 2026
Status: Aprovado

| Dia     | Tipo     | Conteudo           | Status    |
|---------|----------|--------------------|-----------|
| Segunda | Story    | Promo almoco       | Publicado |
| Terca   | Feed     | Carrossel fotos    | Agendado  |
| Quarta  | Story    | Bastidores         | Design    |
| Quinta  | Feed     | Video promocional  | Criacao   |
| Sexta   | Story    | Agenda musical     | Briefing  |
| Sabado  | Story    | Horario especial   | Briefing  |
| Domingo | Reels    | Montagem do dia    | Briefing  |
```

---

## 6. MODULO: RELATORIOS

### 6.1 Descricao
**Sistema ja existente** (checklist de relatorios). Sera integrado como aba/modulo dentro da nova estrutura de Spaces.

### 6.2 Melhorias

| Melhoria | Descricao |
|----------|-----------|
| Filtro por Space | Ver apenas Starken ou Alpha |
| Vinculo com tarefas | Relatorio pode referenciar tarefas concluidas no periodo |
| Metricas automaticas | Contar posts publicados, stories, etc. do periodo |
| Historico visual | Timeline de relatorios enviados |

---

## 7. MODULO: INFORMACOES DOS CLIENTES (HUB)

### 7.1 Descricao
Repositorio centralizado de informacoes de cada cliente. Substitui os dados que estavam no Trello.

### 7.2 Campos por Cliente

| Campo | Tipo | Descricao |
|-------|------|-----------|
| nome | text | Nome do cliente |
| segmento | select | Gastronomia, Eventos, Academia, etc. |
| empresa | select | Starken ou Alpha |
| responsavel | select | Quem gerencia o cliente |
| acessos | richtext | Instagram, Facebook, Google Ads, Meta Business, iFood |
| link_drive | url | Pasta Google Drive com materiais |
| logo_assets | file/url | Logo PNG, vetorizada, paleta de cores |
| link_aprovacao | url | Link do cronograma para aprovacao |
| contrato | richtext | Pacote, valor, data inicio, renovacao, servicos |
| andamento | richtext | Status atual, pendencias, observacoes |
| telefone | text | WhatsApp do cliente |
| email | text | Email do cliente |
| notas | richtext | Observacoes gerais |
| data_inicio | date | Quando comecou o contrato |
| status_cliente | select | Ativo, Standby, Encerrado |

### 7.3 Vista
- Lista de clientes com cards expansiveis
- Busca/filtro por nome, segmento, status
- Botao rapido: WhatsApp, Drive, Instagram

---

## 8. DASHBOARD (VISAO GERAL)

### 8.1 Metricas Principais

```
+------------------+------------------+------------------+------------------+
| TAREFAS PENDENTES| EM DESIGN        | AGUARD. APROVACAO| PUBLICADOS SEMANA|
|       12         |        5         |        3         |       18         |
+------------------+------------------+------------------+------------------+

+------------------+------------------+------------------+------------------+
| RELAT. PENDENTES | CLIENTES ATIVOS  | CRONOGR. SEMANA  | POSTS MES        |
|        4         |       35         |     28/35        |       142        |
+------------------+------------------+------------------+------------------+
```

### 8.2 Widgets

| Widget | Descricao |
|--------|-----------|
| Tarefas por Status | Grafico de barras horizontais |
| Carga por Responsavel | Quantas tarefas cada pessoa tem |
| Timeline de Entregas | Proximas tarefas com deadline |
| Alertas | Tarefas atrasadas, cronogramas pendentes |
| Atividade Recente | Ultimas acoes (quem fez o que) |

### 8.3 Vista por Responsavel

Para cada membro da equipe, mostra:
- Tarefas atribuidas (por status)
- Carga de trabalho (esta semana / mes)
- Clientes sob responsabilidade
- Performance (tarefas concluidas no prazo)

---

## 9. BANCO DE DADOS (SUPABASE)

### 9.1 Novas Tabelas

```sql
-- Usuarios do sistema
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  role TEXT CHECK (role IN ('admin', 'editor', 'executor')),
  pin_hash TEXT,
  avatar_color TEXT DEFAULT '#3b82f6',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Spaces (Starken, Alpha)
CREATE TABLE spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3b82f6',
  icon TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Projetos dentro de um Space
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID REFERENCES spaces(id),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('conteudo', 'cronogramas', 'relatorios', 'hub')),
  color TEXT,
  icon TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Secoes dentro de um projeto (colunas do kanban, categorias)
CREATE TABLE sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  name TEXT NOT NULL,
  color TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Clientes
CREATE TABLE clients_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID REFERENCES spaces(id),
  name TEXT NOT NULL,
  segment TEXT,
  responsible_id UUID REFERENCES users(id),
  phone TEXT,
  email TEXT,
  status TEXT CHECK (status IN ('ativo', 'standby', 'encerrado')) DEFAULT 'ativo',
  contract_start DATE,
  contract_value TEXT,
  contract_package TEXT,
  drive_link TEXT,
  approval_link TEXT,
  logo_url TEXT,
  access_info JSONB DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tarefas (core do sistema)
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  section_id UUID REFERENCES sections(id),
  client_id UUID REFERENCES clients_v2(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'briefing',
  content_type TEXT CHECK (content_type IN (
    'feed', 'story', 'reels', 'carrossel', 'video', 'trafego', 'design', 'outro'
  )),
  assignee_id UUID REFERENCES users(id),
  designer_id UUID REFERENCES users(id),
  priority TEXT CHECK (priority IN ('baixa', 'normal', 'alta', 'urgente')) DEFAULT 'normal',
  due_date DATE,
  publish_date DATE,
  week_label TEXT,
  caption TEXT,
  image_url TEXT,
  client_notes TEXT,
  is_recurring BOOLEAN DEFAULT false,
  labels JSONB DEFAULT '[]',
  sort_order INT DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Cronogramas semanais
CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients_v2(id),
  space_id UUID REFERENCES spaces(id),
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  week_label TEXT,
  status TEXT CHECK (status IN (
    'rascunho', 'enviado', 'aprovado', 'em_execucao', 'concluido'
  )) DEFAULT 'rascunho',
  approval_link TEXT,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Itens do cronograma (dias da semana)
CREATE TABLE schedule_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES schedules(id),
  task_id UUID REFERENCES tasks(id),
  day_of_week INT CHECK (day_of_week BETWEEN 0 AND 6),
  time_slot TEXT,
  content_type TEXT,
  description TEXT,
  status TEXT DEFAULT 'pendente',
  sort_order INT DEFAULT 0
);

-- Relatorios (migra do localStorage)
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients_v2(id),
  space_id UUID REFERENCES spaces(id),
  type TEXT CHECK (type IN ('weekly', 'monthly')),
  period TEXT NOT NULL,
  period_start DATE,
  period_end DATE,
  status INT CHECK (status IN (0, 1, 2)) DEFAULT 0,
  sent_date TIMESTAMPTZ,
  pdf_filename TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Log de atividades
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_client ON tasks(client_id);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_designer ON tasks(designer_id);
CREATE INDEX idx_clients_space ON clients_v2(space_id);
CREATE INDEX idx_clients_status ON clients_v2(status);
CREATE INDEX idx_schedules_client ON schedules(client_id);
CREATE INDEX idx_schedules_week ON schedules(week_start);
CREATE INDEX idx_reports_client ON reports(client_id);
CREATE INDEX idx_reports_period ON reports(period);
CREATE INDEX idx_activity_user ON activity_log(user_id);
CREATE INDEX idx_activity_entity ON activity_log(entity_type, entity_id);
```

---

## 10. API ENDPOINTS (VERCEL)

### 10.1 Autenticacao

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| POST | /api/auth/login | Login com nome + PIN |
| GET | /api/auth/me | Dados do usuario logado |

### 10.2 Spaces & Projetos

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | /api/spaces | Listar spaces |
| GET | /api/projects?space_id={id} | Projetos de um space |
| GET | /api/sections?project_id={id} | Secoes de um projeto |

### 10.3 Tarefas

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | /api/tasks?project_id={id}&status={s}&assignee={id} | Listar tarefas com filtros |
| POST | /api/tasks | Criar tarefa |
| PUT | /api/tasks/{id} | Atualizar tarefa (status, campos) |
| PUT | /api/tasks/{id}/move | Mover tarefa (section, status, sort_order) |
| DELETE | /api/tasks/{id} | Deletar tarefa |

### 10.4 Clientes

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | /api/clients?space_id={id} | Listar clientes |
| GET | /api/clients/{id} | Detalhes do cliente |
| PUT | /api/clients/{id} | Atualizar cliente |

### 10.5 Cronogramas

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | /api/schedules?client_id={id}&week={date} | Cronogramas |
| POST | /api/schedules | Criar cronograma |
| PUT | /api/schedules/{id} | Atualizar status |

### 10.6 Relatorios

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | /api/reports?space_id={id}&period={p} | Listar relatorios |
| POST | /api/reports | Criar/atualizar relatorio |

### 10.7 Dashboard

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | /api/dashboard/stats?space_id={id} | Metricas gerais |
| GET | /api/dashboard/activity | Atividade recente |

---

## 11. INTERFACE (UI/UX)

### 11.1 Layout Principal

```
+--------+--------------------------------------------------+
|        |  [Space: Starken v]  [Busca]  [+ Nova Tarefa]  [Avatar] |
| SIDE   |--------------------------------------------------|
| BAR    |                                                  |
|        |  [Tab: Kanban] [Tab: Lista] [Tab: Calendario]    |
| Starken|                                                  |
|  Cont. |  +---------+ +---------+ +---------+ +--------+ |
|  Cron. |  |BRIEFING | |CRIACAO  | |DESIGN   | |APROVADO| |
|  Relat.|  |         | |         | |         | |        | |
|  Hub   |  | [Card]  | | [Card]  | | [Card]  | | [Card] | |
|        |  | [Card]  | | [Card]  | | [Card]  | |        | |
| Alpha  |  | [Card]  | |         | | [Card]  | |        | |
|  Cont. |  |         | |         | |         | |        | |
|  Cron. |  +---------+ +---------+ +---------+ +--------+ |
|  Relat.|                                                  |
|  Hub   |  [Filtros: Cliente | Responsavel | Tipo | Semana]|
|        |                                                  |
| Config |                                                  |
+--------+--------------------------------------------------+
```

### 11.2 Card de Tarefa (Kanban)

```
+----------------------------------+
| [Urgente]  [Feed]                |
|                                  |
| Feed 1 - Mortadella - Marco S3  |
|                                  |
| [Avatar: Bruna]  [Avatar: Henr.] |
| Mar 18         Mortadella        |
+----------------------------------+
```

Mostra:
- Badge de prioridade (se alta/urgente)
- Badge de tipo de conteudo
- Titulo da tarefa
- Avatars dos responsaveis (criador + designer)
- Data de publicacao
- Nome do cliente

### 11.3 Modal de Tarefa (Detalhes)

```
+--------------------------------------------------+
| [x]                                              |
|                                                  |
| Feed 1 - Mortadella - Marco S3                   |
|                                                  |
| Status:  [DESIGN v]        Prioridade: [Normal v]|
| Cliente: [Mortadella v]    Tipo: [Feed v]        |
| Responsavel: [Bruna v]    Designer: [Henrique v] |
| Data Pub.: [18/03/2026]   Semana: S3 Marco       |
|                                                  |
| --- Legenda/Copy ---                             |
| [textarea com texto do post]                     |
|                                                  |
| --- Imagem ---                                   |
| [upload ou link]  [preview]                      |
|                                                  |
| --- Notas do Cliente ---                         |
| [textarea]                                       |
|                                                  |
| --- Historico ---                                |
| 17/03 - Bruna criou a tarefa                     |
| 17/03 - Bruna moveu para EM CRIACAO              |
| 17/03 - Henrique moveu para DESIGN               |
|                                                  |
| [Salvar]  [Duplicar]  [Arquivar]  [Deletar]      |
+--------------------------------------------------+
```

### 11.4 Vista do Designer (Henrique)

Quando Henrique faz login, ve automaticamente:

```
+--------------------------------------------------+
| MINHAS DEMANDAS DE DESIGN          [15 pendentes] |
|--------------------------------------------------|
|                                                  |
| FAZER ARTE (8)         REVISAO (3)    PRONTO (4) |
| +------------+        +----------+   +--------+  |
| | Mortadella | drag>  | Rosa Mex.|   | Arena  |  |
| | Feed S3    |        | Story    |   | Feed 2 |  |
| | Bruna      |        | Emilly   |   |        |  |
| +------------+        +----------+   +--------+  |
| | Super Duper|        | JPR      |   | OCA    |  |
| | Carrossel  |        | Video    |   | Story  |  |
| | Bruna      |        | Bruna    |   |        |  |
| +------------+        +----------+   +--------+  |
|                                                  |
+--------------------------------------------------+
```

### 11.5 Hub do Cliente (Detalhes)

```
+--------------------------------------------------+
| MORTADELLA BLUMENAU              [Ativo]          |
| Segmento: Gastronomia                            |
| Responsavel: Bruna                               |
|--------------------------------------------------|
|                                                  |
| [Tab: Info] [Tab: Acessos] [Tab: Tarefas]        |
|                                                  |
| Contrato:                                        |
|   Pacote: 2 Feed + 7 Stories / semana            |
|   Valor: R$ X.XXX/mes                            |
|   Inicio: 01/01/2026                             |
|                                                  |
| Links Rapidos:                                   |
|   [Drive] [Instagram] [WhatsApp] [Cronograma]    |
|                                                  |
| Logo / Assets:                                   |
|   [logo.png] [paleta.pdf]                        |
|                                                  |
| Andamento Atual:                                 |
|   Semana 3 Marco - 2 feeds prontos, 5 stories    |
|   pendentes. Cronograma aprovado.                |
|                                                  |
+--------------------------------------------------+
```

---

## 12. STACK TECNICA

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| Frontend | HTML/CSS/JS puro (SPA) | Consistente com sistema existente, sem framework |
| Backend | Vercel Serverless Functions | Ja em uso, zero infra |
| Database | Supabase (PostgreSQL) | Ja em uso, REST API, real-time |
| Storage | Supabase Storage | Para uploads de imagens/logos |
| Auth | Supabase + PIN simples | Leve, sem OAuth complexo |
| CSS | Custom (vars + grid + flex) | Consistente com design existente |

---

## 13. FASES DE IMPLEMENTACAO

### Fase 1: Fundacao (Semana 1)
- [ ] Criar tabelas no Supabase (schema completo)
- [ ] Seed de usuarios (Juan, Henrique, Bruna, Emilly, Marina)
- [ ] Seed de spaces (Starken, Alpha)
- [ ] Seed de projetos (4 por space)
- [ ] Seed de clientes (35 clientes com dados do Trello)
- [ ] API de autenticacao (login por PIN)
- [ ] Tela de login

### Fase 2: Conteudo & Design (Semana 2)
- [ ] Kanban Board com drag-and-drop
- [ ] CRUD de tarefas (criar, editar, mover, deletar)
- [ ] Filtros (cliente, responsavel, tipo, semana)
- [ ] Vista do Designer (filtro automatico)
- [ ] Modal de detalhes da tarefa
- [ ] Status workflow completo

### Fase 3: Hub dos Clientes (Semana 3)
- [ ] Lista de clientes com cards expansiveis
- [ ] Formulario de edicao de cliente
- [ ] Importacao de dados do Trello (acessos, drive, logo)
- [ ] Busca e filtros
- [ ] Links rapidos (WhatsApp, Drive, Instagram)

### Fase 4: Cronogramas (Semana 3-4)
- [ ] Calendario visual por cliente
- [ ] CRUD de cronograma semanal
- [ ] Vinculo cronograma <> tarefas
- [ ] Status de aprovacao
- [ ] Template de cronograma

### Fase 5: Relatorios + Dashboard (Semana 4)
- [ ] Migrar sistema existente para novo layout
- [ ] Dashboard com metricas
- [ ] Widget de carga por responsavel
- [ ] Alertas de tarefas atrasadas
- [ ] Log de atividades

### Fase 6: Polish & Deploy (Semana 5)
- [ ] Responsividade mobile
- [ ] Performance tuning
- [ ] Migrar dados do localStorage para Supabase
- [ ] Testes completos
- [ ] Go-live

---

## 14. DADOS A MIGRAR DO TRELLO

### 14.1 Cards por Tipo (347 total)

| Tipo | Qtd | Destino |
|------|-----|---------|
| Feed posts | 79 | Tarefas em Conteudo & Design |
| Stories | 56 | Tarefas em Conteudo & Design |
| Videos | 40 | Tarefas em Conteudo & Design |
| Criativos | 47 | Tarefas em Conteudo & Design |
| Carrosseis | 6 | Tarefas em Conteudo & Design |
| Setup (Acessos, Drive, Logo) | 85 | Hub dos Clientes |
| Planejamento semanal | 20 | Cronogramas |
| Recorrentes | 21 | Templates de conteudo |

### 14.2 Labels do Trello > Status do Sistema

| Label Trello | Status Novo |
|--------------|-------------|
| FAZER ARTE | design |
| EDITAR VIDEO | design |
| FALTA ENVIAR PARA APROVACAO | aprovacao |
| ENVIADO PARA APROVACAO | aprovacao |
| LIBERADO PARA POSTAR | aprovado |
| AGENDADO | agendado |
| POSTADO | publicado |
| PRONTO | publicado |

---

## 15. METRICAS DE SUCESSO

| Metrica | Meta |
|---------|------|
| Tempo medio de criacao de conteudo (briefing > publicado) | < 5 dias |
| Tarefas concluidas no prazo | > 85% |
| Cronogramas aprovados antes da semana | > 90% |
| Relatorios enviados no prazo | > 95% |
| Satisfacao da equipe (feedback mensal) | > 4/5 |
| Reducao de ferramentas externas | Eliminar Trello, reduzir uso do Asana |

---

## 16. RISCOS E MITIGACOES

| Risco | Impacto | Mitigacao |
|-------|---------|-----------|
| Perda de dados na migracao | Alto | Backup completo antes, migracao incremental |
| Resistencia da equipe | Medio | Envolver Henrique/Bruna no design da interface |
| Performance com muitas tarefas | Medio | Paginacao, lazy loading, archiving automatico |
| Complexidade do drag-and-drop | Baixo | Usar biblioteca leve (SortableJS) |
| Limites do Supabase free tier | Medio | Monitorar uso, upgrade se necessario |

---

## APROVACAO

- [ ] Juan (Product Owner / Admin)
- [ ] Equipe (Henrique, Bruna, Emilly, Marina)

---

*PRD gerado com analise completa do Trello (347 cards, 31 listas, 30 labels), sistema existente (checklist-relatorios.html), e estrutura Asana (8 projetos, 35 clientes).*
