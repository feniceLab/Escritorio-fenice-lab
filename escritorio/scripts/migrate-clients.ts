import Database from 'better-sqlite3';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';

const CHANNEL_IDS = [
  'af953a68-1b8d-4af5-b68a-52d8e1ca5ea1', // Suprema Pizza
  'dccc2fb4-f828-4d73-9070-bbadf6844901', // Arena Gourmet
  'c6482ba4-6be6-4346-bd10-a36bf665ff9f', // Restaurante Oca
];

const COTAFACIL_NAME = 'Cotafacil Inovar Proteção Veicular';

// Fixed UUIDs para usuários legados (substituindo IDs não-UUID do SQLite)
const STARKEN_EMBED_UUID = 'a1000000-0000-0000-0000-starken00001'.replace('starken00001', '737461726b656e31');
// Use a proper fixed UUID
const STARKEN_EMBED_ID = 'a1000000-0000-4000-8000-000000000001';
const ADMIN_USER_ID = 'a0000000-0000-4000-8000-000000000001';

const sqlite = new Database('/var/www/fenix-lab/escritorio/data/deskrpg.db');
const pg = new Pool({
  connectionString: 'postgresql://postgres:F3n1c%402030_@db.yeddlbgcgftlroczszku.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false },
});

const counts: Record<string, number> = {};

function inc(table: string, n = 1) {
  counts[table] = (counts[table] || 0) + n;
}

function parseJson(val: string | null): object | null {
  if (!val) return null;
  try {
    return typeof val === 'string' ? JSON.parse(val) : val;
  } catch {
    return null;
  }
}

function parseJsonOrDefault(val: string | null, def: object = {}): object {
  if (!val) return def;
  try {
    return typeof val === 'string' ? JSON.parse(val) : val;
  } catch {
    return def;
  }
}

// Map old SQLite non-UUID user IDs to proper UUIDs
function mapUserId(oldId: string | null): string | null {
  if (!oldId) return null;
  if (oldId === 'starken-embed-user') return STARKEN_EMBED_ID;
  // If it's already a UUID format, return as-is
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(oldId)) return oldId;
  // Unknown non-UUID: return null
  return null;
}

async function ensureUsers(client: any) {
  // Get starken-embed user from SQLite
  const seUser = sqlite.prepare("SELECT * FROM users WHERE login_id = 'starken-embed'").get() as any;
  if (seUser) {
    const res = await client.query(`
      INSERT INTO users (id, login_id, nickname, password_hash, system_role, last_active_at, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      ON CONFLICT (id) DO NOTHING
      RETURNING id
    `, [
      STARKEN_EMBED_ID, seUser.login_id, seUser.nickname, seUser.password_hash,
      seUser.system_role,
      seUser.last_active_at || null,
      seUser.created_at || new Date().toISOString(),
      seUser.updated_at || new Date().toISOString(),
    ]);
    // Also try by login_id in case it exists with different id
    const existing = await client.query("SELECT id FROM users WHERE login_id = 'starken-embed'");
    if (existing.rows.length > 0) {
      console.log(`  ✓ starken-embed user ensured (id: ${existing.rows[0].id})`);
    }
    inc('users');
  }

  // Create/ensure admin user with fixed UUID
  const existingAdmin = await client.query("SELECT id FROM users WHERE login_id = 'admin'");
  if (existingAdmin.rows.length === 0) {
    const hash = await bcrypt.hash('Fenix@2030', 12);
    await client.query(`
      INSERT INTO users (id, login_id, nickname, password_hash, system_role, created_at, updated_at)
      VALUES ($1, 'admin', 'Administrador', $2, 'system_admin', now(), now())
      ON CONFLICT (login_id) DO NOTHING
    `, [ADMIN_USER_ID, hash]);
    inc('users');
    console.log(`  ✓ admin user criado (id: ${ADMIN_USER_ID})`);
  } else {
    console.log(`  ✓ admin user já existe (id: ${existingAdmin.rows[0].id})`);
  }
}

async function getStarkenEmbedActualId(client: any): Promise<string> {
  const res = await client.query("SELECT id FROM users WHERE login_id = 'starken-embed' LIMIT 1");
  if (res.rows.length > 0) return res.rows[0].id;
  return STARKEN_EMBED_ID;
}

async function migrateChannels(client: any, starkenEmbedId: string) {
  const channels = sqlite.prepare(
    `SELECT * FROM channels WHERE id IN (${CHANNEL_IDS.map(() => '?').join(',')})`
  ).all(...CHANNEL_IDS) as any[];

  for (const ch of channels) {
    await client.query(`
      INSERT INTO channels (id, name, description, owner_id, group_id, map_data, map_config,
        is_public, invite_code, max_players, password, gateway_config, channel_type,
        client_name, client_logo, parent_channel_id, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
      ON CONFLICT (id) DO NOTHING
    `, [
      ch.id, ch.name, ch.description || null, starkenEmbedId,
      null, // group_id
      parseJson(ch.map_data), parseJson(ch.map_config),
      ch.is_public === 1 || ch.is_public === true, ch.invite_code || null,
      ch.max_players || 50, ch.password || null,
      parseJson(ch.gateway_config), ch.channel_type || 'client',
      ch.client_name || null, ch.client_logo || null,
      ch.parent_channel_id || null,
      ch.created_at || new Date().toISOString(),
      ch.updated_at || new Date().toISOString(),
    ]);
    inc('channels');
    console.log(`  ✓ channel: ${ch.name}`);
  }
}

async function migrateNPCs(client: any) {
  const npcs = sqlite.prepare(
    `SELECT * FROM npcs WHERE channel_id IN (${CHANNEL_IDS.map(() => '?').join(',')})`
  ).all(...CHANNEL_IDS) as any[];

  for (const npc of npcs) {
    await client.query(`
      INSERT INTO npcs (id, channel_id, name, position_x, position_y, direction, appearance,
        openclaw_config, created_at, updated_at, total_tokens, reports_to_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      ON CONFLICT (id) DO NOTHING
    `, [
      npc.id, npc.channel_id, npc.name, npc.position_x, npc.position_y,
      npc.direction || 'down',
      parseJsonOrDefault(npc.appearance, {}),
      parseJsonOrDefault(npc.openclaw_config, {}),
      npc.created_at || new Date().toISOString(),
      npc.updated_at || new Date().toISOString(),
      npc.total_tokens || 0, npc.reports_to_id || null,
    ]);
    inc('npcs');
  }
  console.log(`  ✓ ${npcs.length} NPCs migrados`);

  const npcIds = npcs.map((n: any) => n.id);
  if (npcIds.length > 0) {
    const libItems = sqlite.prepare(
      `SELECT * FROM npc_library_items WHERE npc_id IN (${npcIds.map(() => '?').join(',')})`
    ).all(...npcIds) as any[];

    for (const item of libItems) {
      await client.query(`
        INSERT INTO npc_library_items (id, npc_id, layer, category, name, content, metadata, sort_order, created_at, updated_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        ON CONFLICT (id) DO NOTHING
      `, [
        item.id, item.npc_id, item.layer, item.category, item.name,
        item.content || null, parseJson(item.metadata), item.sort_order || 0,
        item.created_at, item.updated_at,
      ]);
      inc('npc_library_items');
    }
    console.log(`  ✓ ${libItems.length} npc_library_items migrados`);

    const memItems = sqlite.prepare(
      `SELECT * FROM npc_memory_items WHERE npc_id IN (${npcIds.map(() => '?').join(',')})`
    ).all(...npcIds) as any[];

    for (const item of memItems) {
      await client.query(`
        INSERT INTO npc_memory_items (id, npc_id, memory_type, title, content, metadata, pinned, sort_order, created_at, updated_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        ON CONFLICT (id) DO NOTHING
      `, [
        item.id, item.npc_id, item.memory_type || 'fact', item.title, item.content,
        parseJson(item.metadata), item.pinned === 1, item.sort_order || 0,
        item.created_at, item.updated_at,
      ]);
      inc('npc_memory_items');
    }
    console.log(`  ✓ ${memItems.length} npc_memory_items migrados`);
  } else {
    console.log(`  ✓ 0 npc_library_items migrados`);
    console.log(`  ✓ 0 npc_memory_items migrados`);
  }
}

async function migrateTasks(client: any) {
  const tasks = sqlite.prepare(
    `SELECT * FROM tasks WHERE channel_id IN (${CHANNEL_IDS.map(() => '?').join(',')})`
  ).all(...CHANNEL_IDS) as any[];

  for (const task of tasks) {
    const assignerId = mapUserId(task.assigner_id);
    await client.query(`
      INSERT INTO tasks (id, channel_id, npc_id, assigner_id, npc_task_id, title, summary,
        status, auto_nudge_count, auto_nudge_max, last_nudged_at, last_reported_at,
        stalled_at, stalled_reason, created_at, updated_at, completed_at,
        assigner_npc_id, recurrence, scheduled_time, scheduled_day,
        requires_approval, approved_at, approved_by, due_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)
      ON CONFLICT (id) DO NOTHING
    `, [
      task.id, task.channel_id, task.npc_id, assignerId,
      task.npc_task_id, task.title, task.summary || null,
      task.status || 'pending', task.auto_nudge_count || 0, task.auto_nudge_max || 5,
      task.last_nudged_at || null, task.last_reported_at || null,
      task.stalled_at || null, task.stalled_reason || null,
      task.created_at || new Date().toISOString(),
      task.updated_at || new Date().toISOString(),
      task.completed_at || null, task.assigner_npc_id || null,
      task.recurrence || 'once', task.scheduled_time || null,
      task.scheduled_day || null,
      task.requires_approval === 1,
      task.approved_at || null, task.approved_by || null, task.due_at || null,
    ]);
    inc('tasks');
  }
  console.log(`  ✓ ${tasks.length} tasks migradas`);
}

async function migrateChannelLibraryItems(client: any) {
  const items = sqlite.prepare(
    `SELECT * FROM channel_library_items WHERE channel_id IN (${CHANNEL_IDS.map(() => '?').join(',')})`
  ).all(...CHANNEL_IDS) as any[];

  for (const item of items) {
    await client.query(`
      INSERT INTO channel_library_items (id, channel_id, layer, category, name, content, metadata, sort_order, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      ON CONFLICT (id) DO NOTHING
    `, [
      item.id, item.channel_id, item.layer, item.category, item.name,
      item.content || null, parseJson(item.metadata), item.sort_order || 0,
      item.created_at, item.updated_at,
    ]);
    inc('channel_library_items');
  }
  console.log(`  ✓ ${items.length} channel_library_items migrados`);
}

async function migrateChannelMembers(client: any, starkenEmbedId: string) {
  const members = sqlite.prepare(
    `SELECT * FROM channel_members WHERE channel_id IN (${CHANNEL_IDS.map(() => '?').join(',')})`
  ).all(...CHANNEL_IDS) as any[];

  for (const m of members) {
    const userId = mapUserId(m.user_id) || starkenEmbedId;
    await client.query(`
      INSERT INTO channel_members (id, channel_id, user_id, role, last_x, last_y, joined_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      ON CONFLICT (id) DO NOTHING
    `, [
      m.id, m.channel_id, userId, m.role || 'owner',
      m.last_x || null, m.last_y || null,
      m.joined_at || new Date().toISOString(),
    ]);
    inc('channel_members');
  }
  console.log(`  ✓ ${members.length} channel_members migrados`);
}

async function migrateOfficeClients(client: any, starkenEmbedId: string) {
  const clients = sqlite.prepare(
    `SELECT * FROM office_clients WHERE channel_id IN (${CHANNEL_IDS.map(() => '?').join(',')})`
  ).all(...CHANNEL_IDS) as any[];

  for (const oc of clients) {
    const ownerUserId = mapUserId(oc.owner_user_id) || starkenEmbedId;
    const profileJson = parseJsonOrDefault(oc.profile_json, {});

    await client.query(`
      INSERT INTO office_clients (id, channel_id, name, status, owner_user_id, summary, profile_json, branding_config, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      ON CONFLICT (id) DO NOTHING
    `, [
      oc.id, oc.channel_id, oc.name, oc.status || 'active',
      ownerUserId, oc.summary || null,
      profileJson, {},
      oc.created_at || new Date().toISOString(),
      oc.updated_at || new Date().toISOString(),
    ]);
    inc('office_clients');
    console.log(`  ✓ office_client: ${oc.name}`);
  }
}

async function migrateOfficeMemories(client: any) {
  const memories = sqlite.prepare(
    `SELECT * FROM office_memories WHERE channel_id IN (${CHANNEL_IDS.map(() => '?').join(',')})`
  ).all(...CHANNEL_IDS) as any[];

  for (const m of memories) {
    await client.query(`
      INSERT INTO office_memories (id, scope, client_id, channel_id, npc_id, memory_type, title, content, importance, source_type, source_id, expires_at, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      ON CONFLICT (id) DO NOTHING
    `, [
      m.id, m.scope || 'client', m.client_id || null, m.channel_id || null,
      m.npc_id || null, m.memory_type || 'fact', m.title, m.content,
      m.importance || 3, m.source_type || null, m.source_id || null,
      m.expires_at || null,
      m.created_at || new Date().toISOString(),
      m.updated_at || new Date().toISOString(),
    ]);
    inc('office_memories');
  }
  console.log(`  ✓ ${memories.length} office_memories migrados`);
}

async function createCotafacilChannel(client: any, starkenEmbedId: string) {
  const existing = await client.query(
    `SELECT id FROM channels WHERE client_name = $1 AND channel_type = 'client'`,
    [COTAFACIL_NAME]
  );
  if (existing.rows.length > 0) {
    console.log(`  ✓ Cotafacil channel já existe (id: ${existing.rows[0].id})`);
    return existing.rows[0].id;
  }

  const res = await client.query(`
    INSERT INTO channels (name, description, owner_id, channel_type, client_name, is_public, created_at, updated_at)
    VALUES ($1, $2, $3, 'client', $4, false, now(), now())
    RETURNING id
  `, [COTAFACIL_NAME, 'Canal de gestão - Cotafacil Inovar Proteção Veicular', starkenEmbedId, COTAFACIL_NAME]);

  const channelId = res.rows[0].id;
  inc('channels');
  console.log(`  ✓ Cotafacil channel criado (id: ${channelId})`);

  await client.query(`
    INSERT INTO office_clients (channel_id, name, status, owner_user_id, profile_json, branding_config, created_at, updated_at)
    VALUES ($1, $2, 'active', $3, '{}', '{}', now(), now())
    ON CONFLICT (channel_id) DO NOTHING
  `, [channelId, COTAFACIL_NAME, starkenEmbedId]);
  inc('office_clients');
  console.log(`  ✓ Cotafacil office_client criado`);

  await client.query(`
    INSERT INTO channel_members (channel_id, user_id, role, joined_at)
    VALUES ($1, $2, 'owner', now())
    ON CONFLICT DO NOTHING
  `, [channelId, starkenEmbedId]);
  inc('channel_members');
  console.log(`  ✓ Cotafacil channel_member (owner) criado`);

  return channelId;
}

async function main() {
  console.log('\n=== MIGRAÇÃO SQLite → PostgreSQL ===\n');

  const pgClient = await pg.connect();
  try {
    console.log('--- 1. Usuários ---');
    await ensureUsers(pgClient);

    const starkenEmbedId = await getStarkenEmbedActualId(pgClient);
    console.log(`  → starken-embed ID no PG: ${starkenEmbedId}`);

    console.log('\n--- 2. Channels (legados) ---');
    await migrateChannels(pgClient, starkenEmbedId);

    console.log('\n--- 3. NPCs ---');
    await migrateNPCs(pgClient);

    console.log('\n--- 4. Tasks ---');
    await migrateTasks(pgClient);

    console.log('\n--- 5. Channel Library Items ---');
    await migrateChannelLibraryItems(pgClient);

    console.log('\n--- 6. Channel Members ---');
    await migrateChannelMembers(pgClient, starkenEmbedId);

    console.log('\n--- 7. Office Clients ---');
    await migrateOfficeClients(pgClient, starkenEmbedId);

    console.log('\n--- 8. Office Memories ---');
    await migrateOfficeMemories(pgClient);

    console.log('\n--- 9. Cotafacil (novo cliente) ---');
    await createCotafacilChannel(pgClient, starkenEmbedId);

    console.log('\n=== RESULTADO FINAL ===');
    let total = 0;
    for (const [table, count] of Object.entries(counts).sort()) {
      console.log(`  ${table.padEnd(30)} ${count} registros`);
      total += count;
    }
    console.log(`  ${''.padEnd(30, '-')}`);
    console.log(`  ${'TOTAL'.padEnd(30)} ${total} registros`);
    console.log('\n✓ Migração concluída com sucesso!\n');

  } catch (err) {
    console.error('\n✗ ERRO na migração:', err);
    process.exit(1);
  } finally {
    pgClient.release();
    await pg.end();
    sqlite.close();
  }
}

main();
