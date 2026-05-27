-- ============================================================
-- SQL META CONFIG - Mapeamento de tenants Meta Ads
-- Starken & Alpha
-- Data: 2026-03-18
-- ============================================================

-- Tabela para armazenar configuração de mapeamento Meta Ads
-- Cada row guarda o mapeamento completo (tenants → recursos Meta)
CREATE TABLE IF NOT EXISTS meta_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  config JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Inserir row default vazia
INSERT INTO meta_config (id, config)
VALUES ('default', '{"tenants":{}}')
ON CONFLICT (id) DO NOTHING;

-- RLS: permitir acesso autenticado via service key
ALTER TABLE meta_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meta_config_read" ON meta_config
  FOR SELECT USING (true);

CREATE POLICY "meta_config_write" ON meta_config
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- COMO USAR:
--
-- A config é salva como JSON no campo "config":
-- {
--   "tenants": {
--     "starken": {
--       "name": "Starken Performance",
--       "pageId": "123456789",
--       "pageAccessToken": "EAA...",
--       "igUserId": "17841400...",
--       "adAccountIds": ["act_111", "act_222"]
--     },
--     "alpha": {
--       "name": "Alpha Assessoria",
--       "pageId": "987654321",
--       "pageAccessToken": "EAA...",
--       "igUserId": "17841400...",
--       "adAccountIds": ["act_333"]
--     }
--   },
--   "updated_at": "2026-03-18T..."
-- }
--
-- Execute este SQL no Supabase:
-- Dashboard → SQL Editor → New Query → Cole e execute
-- ============================================================
