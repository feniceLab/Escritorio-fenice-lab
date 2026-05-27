-- =============================================
-- GESTAO DE TRAFEGO - Database Schema
-- Starken OS - Meta Ads Campaign Management
-- =============================================

-- 1. TRAFFIC GROUPS
CREATE TABLE traffic_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id TEXT NOT NULL,
  name TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  archived BOOLEAN DEFAULT false,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_traffic_groups_client ON traffic_groups(client_id);

-- 2. TRAFFIC TASKS
CREATE TABLE traffic_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES traffic_groups(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES traffic_tasks(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,

  -- Traffic-specific fields
  campaign_objective TEXT,
  budget_type TEXT DEFAULT 'daily',
  budget_amount NUMERIC(12,2),
  target_audience TEXT,
  platform TEXT DEFAULT 'both',
  ad_account_ref TEXT,
  campaign_id TEXT,
  adset_id TEXT,
  creative_refs JSONB,
  notes TEXT,

  -- Cached performance metrics
  metrics JSONB,
  metrics_updated_at TIMESTAMPTZ,

  -- Standard task fields
  status TEXT DEFAULT 'planejamento',
  assignee TEXT,
  priority TEXT DEFAULT 'normal',
  due_date DATE,
  position INTEGER DEFAULT 0,

  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_traffic_tasks_group ON traffic_tasks(group_id);
CREATE INDEX idx_traffic_tasks_client ON traffic_tasks(client_id);
CREATE INDEX idx_traffic_tasks_parent ON traffic_tasks(parent_id);
CREATE INDEX idx_traffic_tasks_status ON traffic_tasks(status);
CREATE INDEX idx_traffic_tasks_campaign ON traffic_tasks(campaign_id);

-- 3. TRAFFIC COMMENTS
CREATE TABLE traffic_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES traffic_tasks(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_traffic_comments_task ON traffic_comments(task_id);

-- 4. TRAFFIC ATTACHMENTS
CREATE TABLE traffic_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES traffic_tasks(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  category TEXT,
  uploaded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_traffic_attachments_task ON traffic_attachments(task_id);

-- 5. TRAFFIC ACTIVITY
CREATE TABLE traffic_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES traffic_tasks(id) ON DELETE CASCADE,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_traffic_activity_task ON traffic_activity(task_id);

-- RLS
ALTER TABLE traffic_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE traffic_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE traffic_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE traffic_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE traffic_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON traffic_groups FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON traffic_tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON traffic_comments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON traffic_attachments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON traffic_activity FOR ALL USING (true) WITH CHECK (true);
