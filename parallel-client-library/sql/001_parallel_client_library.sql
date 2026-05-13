-- ============================================================
-- Parallel Client Library
-- Schema isolado para biblioteca histórica e operacional
-- Não altera as tabelas atuais do app principal
-- ============================================================

-- 1. Clientes da biblioteca
CREATE TABLE IF NOT EXISTS library_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_slug TEXT NOT NULL UNIQUE,
  client_name TEXT NOT NULL,
  tenant TEXT NOT NULL CHECK (tenant IN ('starken', 'alpha')),
  segment TEXT,
  responsible TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'standby', 'archived')),
  source_client_slug TEXT,
  canonical_brand_key TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Aliases de cliente
CREATE TABLE IF NOT EXISTS library_client_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  library_client_id UUID NOT NULL REFERENCES library_clients(id) ON DELETE CASCADE,
  alias_slug TEXT NOT NULL UNIQUE,
  alias_name TEXT NOT NULL,
  alias_source TEXT NOT NULL DEFAULT 'manual',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Coleções da biblioteca por cliente
CREATE TABLE IF NOT EXISTS library_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  library_client_id UUID NOT NULL REFERENCES library_clients(id) ON DELETE CASCADE,
  collection_key TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (library_client_id, collection_key)
);

-- 4. Itens da biblioteca
CREATE TABLE IF NOT EXISTS library_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  library_client_id UUID NOT NULL REFERENCES library_clients(id) ON DELETE CASCADE,
  collection_id UUID REFERENCES library_collections(id) ON DELETE SET NULL,
  item_key TEXT NOT NULL,
  title TEXT NOT NULL,
  item_type TEXT NOT NULL CHECK (
    item_type IN (
      'document',
      'link',
      'reference',
      'story',
      'feed_post',
      'carousel',
      'video',
      'reel',
      'asset',
      'landing_page',
      'report'
    )
  ),
  status TEXT NOT NULL DEFAULT 'active' CHECK (
    status IN ('active', 'draft', 'archived', 'missing', 'reference-only')
  ),
  format TEXT,
  platform TEXT,
  caption TEXT,
  body TEXT,
  thumbnail_url TEXT,
  primary_asset_url TEXT,
  original_created_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (library_client_id, item_key)
);

-- 5. Mídias por item
CREATE TABLE IF NOT EXISTS library_item_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  library_item_id UUID NOT NULL REFERENCES library_items(id) ON DELETE CASCADE,
  media_role TEXT NOT NULL DEFAULT 'primary' CHECK (
    media_role IN ('primary', 'thumbnail', 'slide', 'attachment', 'preview', 'document')
  ),
  media_kind TEXT NOT NULL DEFAULT 'other' CHECK (
    media_kind IN ('image', 'video', 'pdf', 'document', 'audio', 'link', 'other')
  ),
  media_url TEXT,
  storage_bucket TEXT,
  storage_path TEXT,
  file_name TEXT,
  mime_type TEXT,
  file_size BIGINT,
  width INTEGER,
  height INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Fonte/origem de cada item importado
CREATE TABLE IF NOT EXISTS library_item_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  library_item_id UUID NOT NULL REFERENCES library_items(id) ON DELETE CASCADE,
  source_provider TEXT NOT NULL,
  source_ref TEXT NOT NULL,
  source_parent_ref TEXT,
  source_url TEXT,
  source_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source_provider, source_ref)
);

-- 7. Slots obrigatórios para preenchimento manual
CREATE TABLE IF NOT EXISTS library_required_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  library_client_id UUID NOT NULL REFERENCES library_clients(id) ON DELETE CASCADE,
  slot_key TEXT NOT NULL,
  title TEXT NOT NULL,
  collection_key TEXT NOT NULL,
  slot_type TEXT NOT NULL CHECK (
    slot_type IN ('logo', 'document', 'asset', 'guideline', 'landing-page')
  ),
  status TEXT NOT NULL DEFAULT 'missing' CHECK (
    status IN ('missing', 'supplied', 'skipped')
  ),
  instructions TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (library_client_id, slot_key)
);

-- 8. Corridas de sync/backfill
CREATE TABLE IF NOT EXISTS library_sync_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type TEXT NOT NULL CHECK (sync_type IN ('backfill', 'incremental')),
  source_name TEXT NOT NULL,
  client_slug TEXT,
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed', 'partial')),
  stats JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ
);

-- 9. Issues/lacunas do processo
CREATE TABLE IF NOT EXISTS library_sync_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_run_id UUID REFERENCES library_sync_runs(id) ON DELETE SET NULL,
  client_slug TEXT,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error')),
  code TEXT NOT NULL,
  message TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Cursor incremental por fonte
CREATE TABLE IF NOT EXISTS library_sync_state (
  sync_key TEXT PRIMARY KEY,
  last_cursor TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_library_clients_tenant ON library_clients(tenant);
CREATE INDEX IF NOT EXISTS idx_library_clients_brand_key ON library_clients(canonical_brand_key);
CREATE INDEX IF NOT EXISTS idx_library_aliases_client ON library_client_aliases(library_client_id);
CREATE INDEX IF NOT EXISTS idx_library_collections_client ON library_collections(library_client_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_library_items_client ON library_items(library_client_id);
CREATE INDEX IF NOT EXISTS idx_library_items_collection ON library_items(collection_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_library_items_type ON library_items(item_type, status);
CREATE INDEX IF NOT EXISTS idx_library_items_created ON library_items(original_created_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_library_item_media_item ON library_item_media(library_item_id, sort_order);
CREATE UNIQUE INDEX IF NOT EXISTS uq_library_item_media_dedupe
ON library_item_media (
  library_item_id,
  media_role,
  COALESCE(media_url, ''),
  COALESCE(storage_path, '')
);
CREATE INDEX IF NOT EXISTS idx_library_item_sources_item ON library_item_sources(library_item_id);
CREATE INDEX IF NOT EXISTS idx_library_required_slots_client ON library_required_slots(library_client_id, status);
CREATE INDEX IF NOT EXISTS idx_library_sync_runs_started ON library_sync_runs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_library_sync_issues_client ON library_sync_issues(client_slug, severity);

-- Trigger de updated_at
CREATE OR REPLACE FUNCTION set_library_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_library_clients_updated_at ON library_clients;
CREATE TRIGGER trg_library_clients_updated_at
BEFORE UPDATE ON library_clients
FOR EACH ROW EXECUTE FUNCTION set_library_updated_at();

DROP TRIGGER IF EXISTS trg_library_collections_updated_at ON library_collections;
CREATE TRIGGER trg_library_collections_updated_at
BEFORE UPDATE ON library_collections
FOR EACH ROW EXECUTE FUNCTION set_library_updated_at();

DROP TRIGGER IF EXISTS trg_library_items_updated_at ON library_items;
CREATE TRIGGER trg_library_items_updated_at
BEFORE UPDATE ON library_items
FOR EACH ROW EXECUTE FUNCTION set_library_updated_at();

DROP TRIGGER IF EXISTS trg_library_required_slots_updated_at ON library_required_slots;
CREATE TRIGGER trg_library_required_slots_updated_at
BEFORE UPDATE ON library_required_slots
FOR EACH ROW EXECUTE FUNCTION set_library_updated_at();

DROP TRIGGER IF EXISTS trg_library_sync_state_updated_at ON library_sync_state;
CREATE TRIGGER trg_library_sync_state_updated_at
BEFORE UPDATE ON library_sync_state
FOR EACH ROW EXECUTE FUNCTION set_library_updated_at();

-- RLS aberta, seguindo padrão do projeto atual
ALTER TABLE library_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_client_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_item_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_item_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_required_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_sync_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_sync_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_sync_state ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'library_clients' AND policyname = 'library_clients_all') THEN
    CREATE POLICY library_clients_all ON library_clients FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'library_client_aliases' AND policyname = 'library_client_aliases_all') THEN
    CREATE POLICY library_client_aliases_all ON library_client_aliases FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'library_collections' AND policyname = 'library_collections_all') THEN
    CREATE POLICY library_collections_all ON library_collections FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'library_items' AND policyname = 'library_items_all') THEN
    CREATE POLICY library_items_all ON library_items FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'library_item_media' AND policyname = 'library_item_media_all') THEN
    CREATE POLICY library_item_media_all ON library_item_media FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'library_item_sources' AND policyname = 'library_item_sources_all') THEN
    CREATE POLICY library_item_sources_all ON library_item_sources FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'library_required_slots' AND policyname = 'library_required_slots_all') THEN
    CREATE POLICY library_required_slots_all ON library_required_slots FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'library_sync_runs' AND policyname = 'library_sync_runs_all') THEN
    CREATE POLICY library_sync_runs_all ON library_sync_runs FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'library_sync_issues' AND policyname = 'library_sync_issues_all') THEN
    CREATE POLICY library_sync_issues_all ON library_sync_issues FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'library_sync_state' AND policyname = 'library_sync_state_all') THEN
    CREATE POLICY library_sync_state_all ON library_sync_state FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Bucket novo para assets da biblioteca paralela
INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-library-assets', 'brand-library-assets', true)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'brand_library_assets_select'
  ) THEN
    CREATE POLICY brand_library_assets_select
      ON storage.objects FOR SELECT
      USING (bucket_id = 'brand-library-assets');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'brand_library_assets_insert'
  ) THEN
    CREATE POLICY brand_library_assets_insert
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'brand-library-assets');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'brand_library_assets_update'
  ) THEN
    CREATE POLICY brand_library_assets_update
      ON storage.objects FOR UPDATE
      USING (bucket_id = 'brand-library-assets')
      WITH CHECK (bucket_id = 'brand-library-assets');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'brand_library_assets_delete'
  ) THEN
    CREATE POLICY brand_library_assets_delete
      ON storage.objects FOR DELETE
      USING (bucket_id = 'brand-library-assets');
  END IF;
END $$;
