-- ============================================================
-- CLIENT HUB - Starken OS
-- Tabelas, indices, RLS, storage e triggers
-- Executar no Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. TABELA PRINCIPAL: client_hub
-- Armazena todos os dados do cliente (contrato, marca, copy)
-- ============================================================
CREATE TABLE IF NOT EXISTS client_hub (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_slug TEXT NOT NULL UNIQUE,
  client_name TEXT NOT NULL,
  tenant TEXT NOT NULL CHECK (tenant IN ('starken', 'alpha')),
  segment TEXT,
  responsible TEXT,
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'standby', 'encerrado')),
  client_phone TEXT,
  client_email TEXT,
  client_contact_name TEXT,
  contract_start DATE,
  contract_value TEXT,
  contract_package TEXT,
  website_url TEXT,
  drive_folder_url TEXT,
  approval_url TEXT,
  brand_colors JSONB DEFAULT '[]',
  brand_fonts JSONB DEFAULT '{}',
  brand_style_tags JSONB DEFAULT '[]',
  logo_url TEXT,
  logo_variations JSONB DEFAULT '{}',
  tone_of_voice TEXT,
  keywords JSONB DEFAULT '[]',
  forbidden_words JSONB DEFAULT '[]',
  persona_description TEXT,
  copy_examples JSONB DEFAULT '[]',
  social_links JSONB DEFAULT '{}',
  content_preferences JSONB DEFAULT '{}',
  extra_links JSONB DEFAULT '[]',
  drive_folders JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  updated_by TEXT
);

-- ============================================================
-- 2. TABELA DE MATERIAIS: client_hub_materials
-- Arquivos do cliente (logos, fotos de produto, templates)
-- ============================================================
CREATE TABLE IF NOT EXISTS client_hub_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_slug TEXT NOT NULL REFERENCES client_hub(client_slug) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  thumbnail_url TEXT,
  category TEXT CHECK (category IN ('logo', 'product_photo', 'template', 'reference', 'document', 'other')),
  description TEXT,
  tags JSONB DEFAULT '[]',
  uploaded_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 3. TABELA DE ATIVIDADE: client_hub_activity
-- Log de alteracoes feitas no cadastro do cliente
-- ============================================================
CREATE TABLE IF NOT EXISTS client_hub_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_slug TEXT NOT NULL REFERENCES client_hub(client_slug) ON DELETE CASCADE,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  field_changed TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 4. INDICES
-- Otimizam buscas por slug, tenant, status, responsavel, etc.
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_client_hub_slug ON client_hub(client_slug);
CREATE INDEX IF NOT EXISTS idx_client_hub_tenant ON client_hub(tenant);
CREATE INDEX IF NOT EXISTS idx_client_hub_status ON client_hub(status);
CREATE INDEX IF NOT EXISTS idx_client_hub_responsible ON client_hub(responsible);
CREATE INDEX IF NOT EXISTS idx_client_hub_created_at ON client_hub(created_at);

CREATE INDEX IF NOT EXISTS idx_client_hub_materials_slug ON client_hub_materials(client_slug);
CREATE INDEX IF NOT EXISTS idx_client_hub_materials_category ON client_hub_materials(category);
CREATE INDEX IF NOT EXISTS idx_client_hub_materials_created_at ON client_hub_materials(created_at);

CREATE INDEX IF NOT EXISTS idx_client_hub_activity_slug ON client_hub_activity(client_slug);
CREATE INDEX IF NOT EXISTS idx_client_hub_activity_created_at ON client_hub_activity(created_at);

-- ============================================================
-- 5. RLS (Row Level Security)
-- Habilita RLS e permite acesso total (mesmo padrao do projeto)
-- ============================================================

-- client_hub
ALTER TABLE client_hub ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'client_hub' AND policyname = 'client_hub_select_all'
  ) THEN
    CREATE POLICY client_hub_select_all ON client_hub FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'client_hub' AND policyname = 'client_hub_insert_all'
  ) THEN
    CREATE POLICY client_hub_insert_all ON client_hub FOR INSERT WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'client_hub' AND policyname = 'client_hub_update_all'
  ) THEN
    CREATE POLICY client_hub_update_all ON client_hub FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'client_hub' AND policyname = 'client_hub_delete_all'
  ) THEN
    CREATE POLICY client_hub_delete_all ON client_hub FOR DELETE USING (true);
  END IF;
END $$;

-- client_hub_materials
ALTER TABLE client_hub_materials ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'client_hub_materials' AND policyname = 'client_hub_materials_select_all'
  ) THEN
    CREATE POLICY client_hub_materials_select_all ON client_hub_materials FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'client_hub_materials' AND policyname = 'client_hub_materials_insert_all'
  ) THEN
    CREATE POLICY client_hub_materials_insert_all ON client_hub_materials FOR INSERT WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'client_hub_materials' AND policyname = 'client_hub_materials_update_all'
  ) THEN
    CREATE POLICY client_hub_materials_update_all ON client_hub_materials FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'client_hub_materials' AND policyname = 'client_hub_materials_delete_all'
  ) THEN
    CREATE POLICY client_hub_materials_delete_all ON client_hub_materials FOR DELETE USING (true);
  END IF;
END $$;

-- client_hub_activity
ALTER TABLE client_hub_activity ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'client_hub_activity' AND policyname = 'client_hub_activity_select_all'
  ) THEN
    CREATE POLICY client_hub_activity_select_all ON client_hub_activity FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'client_hub_activity' AND policyname = 'client_hub_activity_insert_all'
  ) THEN
    CREATE POLICY client_hub_activity_insert_all ON client_hub_activity FOR INSERT WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'client_hub_activity' AND policyname = 'client_hub_activity_update_all'
  ) THEN
    CREATE POLICY client_hub_activity_update_all ON client_hub_activity FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'client_hub_activity' AND policyname = 'client_hub_activity_delete_all'
  ) THEN
    CREATE POLICY client_hub_activity_delete_all ON client_hub_activity FOR DELETE USING (true);
  END IF;
END $$;

-- ============================================================
-- 6. STORAGE BUCKET
-- Bucket para arquivos de materiais dos clientes
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-hub-materials', 'client-hub-materials', true)
ON CONFLICT (id) DO NOTHING;

-- Politicas de storage (acesso publico, mesmo padrao do projeto)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'client_hub_materials_storage_select'
  ) THEN
    CREATE POLICY client_hub_materials_storage_select
      ON storage.objects FOR SELECT
      USING (bucket_id = 'client-hub-materials');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'client_hub_materials_storage_insert'
  ) THEN
    CREATE POLICY client_hub_materials_storage_insert
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'client-hub-materials');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'client_hub_materials_storage_update'
  ) THEN
    CREATE POLICY client_hub_materials_storage_update
      ON storage.objects FOR UPDATE
      USING (bucket_id = 'client-hub-materials')
      WITH CHECK (bucket_id = 'client-hub-materials');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'client_hub_materials_storage_delete'
  ) THEN
    CREATE POLICY client_hub_materials_storage_delete
      ON storage.objects FOR DELETE
      USING (bucket_id = 'client-hub-materials');
  END IF;
END $$;

-- ============================================================
-- 7. TRIGGER: updated_at automatico
-- Atualiza o campo updated_at sempre que um registro muda
-- ============================================================
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_client_hub_updated_at'
  ) THEN
    CREATE TRIGGER set_client_hub_updated_at
      BEFORE UPDATE ON client_hub
      FOR EACH ROW
      EXECUTE FUNCTION handle_updated_at();
  END IF;
END $$;

-- ============================================================
-- FIM DO SCRIPT
-- Todas as tabelas, indices, RLS, storage e triggers criados
-- ============================================================
