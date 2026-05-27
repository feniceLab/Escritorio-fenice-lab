-- ============================================================
-- SQL GESTAO DE PROJETOS - Starken & Alpha (VERSAO 2)
-- Apenas 3 usuarios: Juan, Henrique, Emilly
-- Data: 2026-03-17
-- ============================================================

-- ============================================================
-- 1. DROP TABLES (ordem reversa de dependencias)
-- ============================================================

DROP TABLE IF EXISTS activity_log;
DROP TABLE IF EXISTS schedule_items;
DROP TABLE IF EXISTS schedules;
DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS sections;
DROP TABLE IF EXISTS clients_v2;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS spaces;
DROP TABLE IF EXISTS users;

-- ============================================================
-- 2. CREATE TABLES
-- ============================================================

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

-- ============================================================
-- 3. INDEXES
-- ============================================================

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

-- ============================================================
-- 4. SEED DATA
-- ============================================================

-- 4.1 Users (3 usuarios)
INSERT INTO users (name, email, role, pin_hash, avatar_color) VALUES
  ('Juan',     NULL, 'admin',    '1234', '#3b82f6'),
  ('Henrique', NULL, 'executor', '5678', '#8b5cf6'),
  ('Emilly',   NULL, 'editor',   '2222', '#f59e0b');

-- 4.2 Spaces (2 spaces)
INSERT INTO spaces (name, color, sort_order) VALUES
  ('Starken', '#3b82f6', 0),
  ('Alpha',   '#10b981', 1);

-- 4.3 Projects (8 projetos - 4 por space)
INSERT INTO projects (space_id, name, type, color, sort_order) VALUES
  ((SELECT id FROM spaces WHERE name = 'Starken'), 'Starken | Conteudo & Design', 'conteudo',     '#3b82f6', 0),
  ((SELECT id FROM spaces WHERE name = 'Starken'), 'Starken | Cronogramas',       'cronogramas',  '#3b82f6', 1),
  ((SELECT id FROM spaces WHERE name = 'Starken'), 'Starken | Relatorios',        'relatorios',   '#3b82f6', 2),
  ((SELECT id FROM spaces WHERE name = 'Starken'), 'Starken | Hub dos Clientes',  'hub',          '#3b82f6', 3),
  ((SELECT id FROM spaces WHERE name = 'Alpha'),   'Alpha | Conteudo & Design',   'conteudo',     '#10b981', 0),
  ((SELECT id FROM spaces WHERE name = 'Alpha'),   'Alpha | Cronogramas',          'cronogramas',  '#10b981', 1),
  ((SELECT id FROM spaces WHERE name = 'Alpha'),   'Alpha | Relatorios',           'relatorios',   '#10b981', 2),
  ((SELECT id FROM spaces WHERE name = 'Alpha'),   'Alpha | Hub dos Clientes',     'hub',          '#10b981', 3);

-- 4.4 Sections (9 secoes por projeto Conteudo & Design = 18 total)

-- Starken | Conteudo & Design
INSERT INTO sections (project_id, name, color, sort_order) VALUES
  ((SELECT id FROM projects WHERE name = 'Starken | Conteudo & Design'), 'BRIEFING',    '#94a3b8', 0),
  ((SELECT id FROM projects WHERE name = 'Starken | Conteudo & Design'), 'EM CRIACAO',  '#3b82f6', 1),
  ((SELECT id FROM projects WHERE name = 'Starken | Conteudo & Design'), 'DESIGN',      '#8b5cf6', 2),
  ((SELECT id FROM projects WHERE name = 'Starken | Conteudo & Design'), 'REVISAO',     '#f59e0b', 3),
  ((SELECT id FROM projects WHERE name = 'Starken | Conteudo & Design'), 'APROVACAO',   '#eab308', 4),
  ((SELECT id FROM projects WHERE name = 'Starken | Conteudo & Design'), 'APROVADO',    '#22c55e', 5),
  ((SELECT id FROM projects WHERE name = 'Starken | Conteudo & Design'), 'AGENDADO',    '#06b6d4', 6),
  ((SELECT id FROM projects WHERE name = 'Starken | Conteudo & Design'), 'PUBLICADO',   '#15803d', 7),
  ((SELECT id FROM projects WHERE name = 'Starken | Conteudo & Design'), 'ARQUIVO',     '#6b7280', 8);

-- Alpha | Conteudo & Design
INSERT INTO sections (project_id, name, color, sort_order) VALUES
  ((SELECT id FROM projects WHERE name = 'Alpha | Conteudo & Design'), 'BRIEFING',    '#94a3b8', 0),
  ((SELECT id FROM projects WHERE name = 'Alpha | Conteudo & Design'), 'EM CRIACAO',  '#3b82f6', 1),
  ((SELECT id FROM projects WHERE name = 'Alpha | Conteudo & Design'), 'DESIGN',      '#8b5cf6', 2),
  ((SELECT id FROM projects WHERE name = 'Alpha | Conteudo & Design'), 'REVISAO',     '#f59e0b', 3),
  ((SELECT id FROM projects WHERE name = 'Alpha | Conteudo & Design'), 'APROVACAO',   '#eab308', 4),
  ((SELECT id FROM projects WHERE name = 'Alpha | Conteudo & Design'), 'APROVADO',    '#22c55e', 5),
  ((SELECT id FROM projects WHERE name = 'Alpha | Conteudo & Design'), 'AGENDADO',    '#06b6d4', 6),
  ((SELECT id FROM projects WHERE name = 'Alpha | Conteudo & Design'), 'PUBLICADO',   '#15803d', 7),
  ((SELECT id FROM projects WHERE name = 'Alpha | Conteudo & Design'), 'ARQUIVO',     '#6b7280', 8);

-- 4.5 Clients - STARKEN (25 clientes)
INSERT INTO clients_v2 (space_id, name, segment, responsible_id) VALUES
  -- Juan (admin) - responsavel pela maioria
  ((SELECT id FROM spaces WHERE name = 'Starken'), 'Mortadella Blumenau',     'Gastronomia',            (SELECT id FROM users WHERE name = 'Juan')),
  ((SELECT id FROM spaces WHERE name = 'Starken'), 'Hamburgueria Feio',       'Gastronomia',            (SELECT id FROM users WHERE name = 'Juan')),
  ((SELECT id FROM spaces WHERE name = 'Starken'), 'Rosa Mexicano Blumenau',  'Gastronomia',            (SELECT id FROM users WHERE name = 'Juan')),
  ((SELECT id FROM spaces WHERE name = 'Starken'), 'Rosa Mexicano Brusque',   'Gastronomia',            (SELECT id FROM users WHERE name = 'Juan')),
  ((SELECT id FROM spaces WHERE name = 'Starken'), 'Suprema Pizza',           'Gastronomia',            (SELECT id FROM users WHERE name = 'Juan')),
  ((SELECT id FROM spaces WHERE name = 'Starken'), 'Arena Gourmet',           'Gastronomia',            (SELECT id FROM users WHERE name = 'Juan')),
  ((SELECT id FROM spaces WHERE name = 'Starken'), 'Super X - Garuva',        'Gastronomia',            (SELECT id FROM users WHERE name = 'Juan')),
  ((SELECT id FROM spaces WHERE name = 'Starken'), 'Super X - Guaratuba',     'Gastronomia',            (SELECT id FROM users WHERE name = 'Juan')),
  ((SELECT id FROM spaces WHERE name = 'Starken'), 'Super X - Itapoa',        'Gastronomia',            (SELECT id FROM users WHERE name = 'Juan')),
  ((SELECT id FROM spaces WHERE name = 'Starken'), 'Madrugao - Centro',       'Gastronomia',            (SELECT id FROM users WHERE name = 'Juan')),
  ((SELECT id FROM spaces WHERE name = 'Starken'), 'Madrugao - Garcia',       'Gastronomia',            (SELECT id FROM users WHERE name = 'Juan')),
  ((SELECT id FROM spaces WHERE name = 'Starken'), 'Madrugao - Fortaleza',    'Gastronomia',            (SELECT id FROM users WHERE name = 'Juan')),
  ((SELECT id FROM spaces WHERE name = 'Starken'), 'Restaurante Oca',         'Gastronomia',            (SELECT id FROM users WHERE name = 'Juan')),
  ((SELECT id FROM spaces WHERE name = 'Starken'), 'Aseyori Restaurante',     'Gastronomia',            (SELECT id FROM users WHERE name = 'Juan')),
  ((SELECT id FROM spaces WHERE name = 'Starken'), 'Oklahoma Burger',         'Gastronomia',            (SELECT id FROM users WHERE name = 'Juan')),
  ((SELECT id FROM spaces WHERE name = 'Starken'), 'Pizzaria Super X',        'Gastronomia',            (SELECT id FROM users WHERE name = 'Juan')),
  ((SELECT id FROM spaces WHERE name = 'Starken'), 'Sr Salsicha',             'Gastronomia',            (SELECT id FROM users WHERE name = 'Juan')),
  ((SELECT id FROM spaces WHERE name = 'Starken'), 'JPR Moveis Rusticos',     'Mesas p/ Area de Festas',(SELECT id FROM users WHERE name = 'Juan')),
  ((SELECT id FROM spaces WHERE name = 'Starken'), 'Estilo Tulipa',           'Artigos de Tenis',       (SELECT id FROM users WHERE name = 'Juan')),
  ((SELECT id FROM spaces WHERE name = 'Starken'), 'Dommus Smart Home',       'Automacao Residencial',  (SELECT id FROM users WHERE name = 'Juan')),
  ((SELECT id FROM spaces WHERE name = 'Starken'), 'Bengers',                 'Eventos',                (SELECT id FROM users WHERE name = 'Juan')),
  ((SELECT id FROM spaces WHERE name = 'Starken'), 'The Garrison',            'Eventos',                (SELECT id FROM users WHERE name = 'Juan')),
  ((SELECT id FROM spaces WHERE name = 'Starken'), 'New Service',             'Industria',              (SELECT id FROM users WHERE name = 'Juan')),
  ((SELECT id FROM spaces WHERE name = 'Starken'), 'Academia Sao Pedro',      'Academia',               (SELECT id FROM users WHERE name = 'Emilly')),
  ((SELECT id FROM spaces WHERE name = 'Starken'), 'Melhor Visao',            'Clinica Otica',          (SELECT id FROM users WHERE name = 'Juan'));

-- 4.6 Clients - ALPHA (10 clientes)
INSERT INTO clients_v2 (space_id, name, segment, responsible_id) VALUES
  ((SELECT id FROM spaces WHERE name = 'Alpha'), 'Mestre do Frango',    'Gastronomia', (SELECT id FROM users WHERE name = 'Juan')),
  ((SELECT id FROM spaces WHERE name = 'Alpha'), 'Pizzaria do Nei',     'Gastronomia', (SELECT id FROM users WHERE name = 'Juan')),
  ((SELECT id FROM spaces WHERE name = 'Alpha'), 'Super Duper',         'Gastronomia', (SELECT id FROM users WHERE name = 'Juan')),
  ((SELECT id FROM spaces WHERE name = 'Alpha'), 'WorldBurguer',        'Gastronomia', (SELECT id FROM users WHERE name = 'Juan')),
  ((SELECT id FROM spaces WHERE name = 'Alpha'), 'Saporito Pizzaria',   'Gastronomia', (SELECT id FROM users WHERE name = 'Juan')),
  ((SELECT id FROM spaces WHERE name = 'Alpha'), 'Fratellis Pizzaria',  'Gastronomia', (SELECT id FROM users WHERE name = 'Juan')),
  ((SELECT id FROM spaces WHERE name = 'Alpha'), 'D'' Britos',          'Gastronomia', (SELECT id FROM users WHERE name = 'Emilly')),
  ((SELECT id FROM spaces WHERE name = 'Alpha'), 'Patricia Salgados',   'Gastronomia', (SELECT id FROM users WHERE name = 'Emilly')),
  ((SELECT id FROM spaces WHERE name = 'Alpha'), 'Salfest',             'Gastronomia', (SELECT id FROM users WHERE name = 'Emilly')),
  ((SELECT id FROM spaces WHERE name = 'Alpha'), 'Sorveteria Maciel',   'Gastronomia', (SELECT id FROM users WHERE name = 'Juan'));

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
