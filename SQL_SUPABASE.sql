-- ============================================================================
-- FASE 2: Starken Performance — Tabelas SQL para Supabase
-- ============================================================================
-- Copie e cole CADA bloco abaixo no SQL Editor do Supabase
-- URL: https://app.supabase.com → Seu Projeto → SQL Editor
-- ============================================================================

-- ============================================================================
-- TABELA 1: clients
-- Armazena informações de clientes provisionados
-- ============================================================================

CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  asana_workspace_gid TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at DESC);

-- ============================================================================
-- TABELA 2: asana_config
-- Armazena configuração de Asana (MANTER COMPATIBILIDADE COM FASE 1)
-- ============================================================================

CREATE TABLE IF NOT EXISTS asana_config (
  id TEXT PRIMARY KEY,
  workspace_gid TEXT,
  default_assignee_gid TEXT,
  default_project_gid TEXT,
  client_project_map JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================================================
-- TABELA 3: asana_projects
-- Rastreia projetos criados para cada cliente
-- ============================================================================

CREATE TABLE IF NOT EXISTS asana_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  project_gid TEXT NOT NULL,
  project_name TEXT NOT NULL,
  project_type TEXT CHECK (project_type IN ('conteudo', 'trafego', 'criativos')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_asana_projects_client ON asana_projects(client_id);
CREATE INDEX IF NOT EXISTS idx_asana_projects_gid ON asana_projects(project_gid);
CREATE INDEX IF NOT EXISTS idx_asana_projects_type ON asana_projects(project_type);

-- ============================================================================
-- TABELA 4: asana_custom_fields
-- Armazena custom fields por projeto
-- ============================================================================

CREATE TABLE IF NOT EXISTS asana_custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_gid TEXT NOT NULL,
  field_gid TEXT NOT NULL,
  field_name TEXT NOT NULL,
  field_type TEXT CHECK (field_type IN ('text', 'number', 'enum', 'date')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_asana_custom_fields_project ON asana_custom_fields(project_gid);
CREATE INDEX IF NOT EXISTS idx_asana_custom_fields_gid ON asana_custom_fields(field_gid);

-- ============================================================================
-- TABELA 5: asana_sections
-- Armazena seções padrão para cada tipo de projeto
-- ============================================================================

CREATE TABLE IF NOT EXISTS asana_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_gid TEXT NOT NULL,
  section_gid TEXT NOT NULL,
  section_name TEXT NOT NULL,
  project_type TEXT CHECK (project_type IN ('conteudo', 'trafego', 'criativos')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_asana_sections_project ON asana_sections(project_gid);

-- ============================================================================
-- FIM DOS SQLS
-- ============================================================================
--
-- INSTRUÇÕES DE EXECUÇÃO:
-- 1. Vá para: https://app.supabase.com → Seu Projeto
-- 2. Clique em: SQL Editor (menu esquerdo)
-- 3. Clique em: + New Query
-- 4. Copie TUDO acima (a partir de CREATE TABLE até FIM)
-- 5. Clique em: Run (botão azul direita)
-- 6. Verifique: "Executing query..." → sucesso
-- 7. Volte para: Database → Tables (verificar 5 tabelas novas)
--
-- Se der erro: copie só um CREATE TABLE de cada vez
-- ============================================================================
