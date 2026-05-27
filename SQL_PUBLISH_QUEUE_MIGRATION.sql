-- ============================================================
-- MIGRAÇÃO: Melhorias no sistema de publicação agendada
-- Data: 2026-04-01
-- Execute no Supabase: Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Adiciona coluna error_message na publish_history
--    (armazena o motivo de falha para exibir no painel)
ALTER TABLE publish_history
  ADD COLUMN IF NOT EXISTS error_message TEXT;

-- 2. Adiciona coluna published_at na publish_history
--    (armazena o horário real de publicação para comparar com scheduled_for)
ALTER TABLE publish_history
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- 3. Adiciona coluna updated_at na publish_queue
--    (necessário para detectar itens presos em PROCESSING)
ALTER TABLE publish_queue
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Atualiza updated_at nos registros existentes
UPDATE publish_queue SET updated_at = created_at WHERE updated_at IS NULL;

-- 3. (Opcional) Reseta itens que ficaram presos em PROCESSING
--    Execute manualmente se necessário:
-- UPDATE publish_queue
--   SET status = 'QUEUED', updated_at = now()
--   WHERE status = 'PROCESSING'
--   AND updated_at < now() - interval '5 minutes';

-- ============================================================
