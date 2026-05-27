import Database from "better-sqlite3";
import crypto from "node:crypto";

const db = new Database(new URL("../data/deskrpg.db", import.meta.url).pathname);
const now = () => new Date().toISOString();
const uuid = () => crypto.randomUUID();

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function readProfile(row) {
  try { return JSON.parse(row.profile_json || "{}"); } catch { return {}; }
}

function ensureSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS telegram_client_groups (
      id TEXT PRIMARY KEY NOT NULL,
      client_id TEXT,
      channel_id TEXT,
      client_slug TEXT,
      client_name TEXT NOT NULL,
      telegram_chat_id TEXT NOT NULL UNIQUE,
      telegram_web_url TEXT,
      group_type TEXT NOT NULL DEFAULT 'client',
      allowed_npcs TEXT NOT NULL DEFAULT '[]',
      notification_rules TEXT NOT NULL DEFAULT '{}',
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_telegram_client_groups_client ON telegram_client_groups(client_id);
    CREATE INDEX IF NOT EXISTS idx_telegram_client_groups_channel ON telegram_client_groups(channel_id);
    CREATE INDEX IF NOT EXISTS idx_telegram_client_groups_slug ON telegram_client_groups(client_slug);
    CREATE INDEX IF NOT EXISTS idx_telegram_client_groups_active ON telegram_client_groups(active);

    CREATE TABLE IF NOT EXISTS telegram_agent_routines (
      id TEXT PRIMARY KEY NOT NULL,
      routine_slug TEXT NOT NULL UNIQUE,
      npc_id TEXT,
      label TEXT NOT NULL,
      schedule_local TEXT NOT NULL,
      timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
      target_scope TEXT NOT NULL DEFAULT 'operational_group',
      action_type TEXT NOT NULL DEFAULT 'telegram_digest',
      payload_json TEXT NOT NULL DEFAULT '{}',
      active INTEGER NOT NULL DEFAULT 1,
      last_run_key TEXT,
      last_run_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_telegram_agent_routines_active_schedule ON telegram_agent_routines(active, schedule_local);
    CREATE INDEX IF NOT EXISTS idx_telegram_agent_routines_npc ON telegram_agent_routines(npc_id);
  `);
}

ensureSchema();

const clients = db.prepare("SELECT id, channel_id, name, profile_json FROM office_clients").all();
const clientsByKey = new Map();
for (const client of clients) {
  const profile = readProfile(client);
  const keys = new Set([
    normalize(client.name),
    normalize(profile.clientSlug),
    normalize(profile.slug),
    normalize(profile.clientName),
  ].filter(Boolean));
  for (const key of keys) clientsByKey.set(key, { ...client, profile });
}

const groupRows = [
  { name: "Restaurante Oca", key: "restaurante-oca", chat: "-5230253545", url: "https://web.telegram.org/k/#-5230253545" },
  { name: "Academia São Pedro", key: "academia-sao-pedro", chat: "-5277163335", url: "https://web.telegram.org/k/#-5277163335" },
  { name: "Arena Gourmet", key: "arena-gourmet", chat: "-5260098332", url: "https://web.telegram.org/k/#-5260098332" },
  { name: "Hamburgueria Feio", key: "hamburgueria-feio", chat: "-5106159402", url: "https://web.telegram.org/k/#-5106159402" },
  { name: "Madrugão - Centro", key: "madrugao-centro", chat: "-5289822297", url: "https://web.telegram.org/k/#-5289822297" },
  { name: "Madrugão - Fortaleza", key: "madrugao-fortaleza", chat: "-5044192212", url: "https://web.telegram.org/k/#-5044192212" },
  { name: "Madrugão - Garcia", key: "madrugao-garcia", chat: "-5267593990", url: "https://web.telegram.org/k/#-5267593990" },
  { name: "Cota Fácil S.F", key: "cota-facil-s-f", chat: "-5070819698", url: "https://web.telegram.org/k/#-5070819698" },
  { name: "Super X - Garuva", key: "super-x-garuva", chat: "-5285438735", url: "https://web.telegram.org/k/#-5285438735" },
  { name: "Super X - Guaratuba", key: "super-x-guaratuba", chat: "-5262319336", url: "https://web.telegram.org/k/#-5262319336" },
  { name: "Suprema Pizza", key: "suprema-pizza", chat: "-5118825071", url: "https://web.telegram.org/k/#-5118825071" },
  { name: "Dilokas Pizzaria", key: "dilokas-pizzaria", chat: "-5025292662", url: "https://web.telegram.org/k/#-5025292662" },
  { name: "Super X - Itapoá", key: "super-x-itapoa", chat: "-5249165843", url: "https://web.telegram.org/k/#-5249165843" },
  { name: "Starken Tecnologia", key: "starken-tecnologia", chat: "-5125029324", url: "https://web.telegram.org/k/#-5125029324", groupType: "operation" },
];

const upsertGroup = db.prepare(`
  INSERT INTO telegram_client_groups (
    id, client_id, channel_id, client_slug, client_name, telegram_chat_id, telegram_web_url,
    group_type, allowed_npcs, notification_rules, active, created_at, updated_at
  ) VALUES (@id, @client_id, @channel_id, @client_slug, @client_name, @telegram_chat_id, @telegram_web_url,
    @group_type, @allowed_npcs, @notification_rules, 1, @created_at, @updated_at)
  ON CONFLICT(telegram_chat_id) DO UPDATE SET
    client_id=excluded.client_id,
    channel_id=excluded.channel_id,
    client_slug=excluded.client_slug,
    client_name=excluded.client_name,
    telegram_web_url=excluded.telegram_web_url,
    group_type=excluded.group_type,
    allowed_npcs=excluded.allowed_npcs,
    notification_rules=excluded.notification_rules,
    active=1,
    updated_at=excluded.updated_at
`);

const allowedDefault = ["gerente-operacional", "joao-relatorios-analise", "sneider-design", "maria-onboarding-clientes"];
let linked = 0;
let pending = 0;
for (const item of groupRows) {
  const client = clientsByKey.get(normalize(item.key))
    || clientsByKey.get(normalize(item.name))
    || (normalize(item.key) === "starken-tecnologia" ? clientsByKey.get("starken-hq") : null);
  if (client) linked += 1; else pending += 1;
  upsertGroup.run({
    id: uuid(),
    client_id: client?.id || null,
    channel_id: client?.channel_id || null,
    client_slug: normalize(item.key),
    client_name: client?.name || item.name,
    telegram_chat_id: item.chat,
    telegram_web_url: item.url,
    group_type: item.groupType || "client",
    allowed_npcs: JSON.stringify(allowedDefault),
    notification_rules: JSON.stringify({
      cronograma: true,
      aprovacoes: true,
      atrasos: true,
      resumoSemanal: true,
      relatorios: true,
    }),
    created_at: now(),
    updated_at: now(),
  });
}

const npcs = db.prepare("SELECT id, name, openclaw_config FROM npcs").all();
function npcIdByNeedle(needle) {
  const n = normalize(needle);
  return npcs.find((npc) => normalize(npc.name).includes(n))?.id || null;
}
const lurdinhaId = npcIdByNeedle("lurdinha");
const joaoId = npcIdByNeedle("joao") || npcIdByNeedle("relatorios");
const sneiderId = npcIdByNeedle("sneider");
const zezinId = npcIdByNeedle("zezin");
const mariaId = npcIdByNeedle("maria");

const routines = [
  {
    slug: "lurdinha-0800-check-operacional",
    npcId: lurdinhaId,
    label: "Lurdinha · check operacional 08h",
    time: "08:00",
    message: "Bom dia. Rodar check inicial da operação: cronogramas pendentes, clientes sem dono, aprovações abertas e tarefas atrasadas. Priorize o que precisa destravar ainda hoje.",
    checklist: ["Listar clientes em risco", "Apontar donos ausentes", "Separar 3 prioridades do dia"],
  },
  {
    slug: "lurdinha-1000-cobranca-atrasos",
    npcId: lurdinhaId,
    label: "Lurdinha · cobrança de atrasos 10h",
    time: "10:00",
    message: "Verificar tarefas vencidas, responsáveis sem retorno e cronogramas que ainda não foram enviados. Acionar o responsável com pedido objetivo de próximo passo.",
    checklist: ["Atrasos por cliente", "Responsável", "Próxima cobrança"],
  },
  {
    slug: "lurdinha-1500-aprovacoes",
    npcId: lurdinhaId,
    label: "Lurdinha · aprovações 15h",
    time: "15:00",
    message: "Checar aprovações paradas em grupos de clientes. Se houver cronograma, arte ou copy pendente, pedir retorno no grupo correto e registrar memória do que foi combinado.",
    checklist: ["Aprovações por cliente", "Mensagem no grupo", "Memória registrada"],
  },
  {
    slug: "lurdinha-1800-resumo-operacional",
    npcId: lurdinhaId,
    label: "Lurdinha · resumo operacional 18h",
    time: "18:00",
    message: "Enviar resumo operacional do dia para a liderança: o que avançou, o que travou, clientes em risco e ações recomendadas para amanhã.",
    checklist: ["Avanços", "Riscos", "Pedidos para Juan/Will/Dante"],
  },
  {
    slug: "joao-0900-metricas-e-relatorios",
    npcId: joaoId,
    label: "João · métricas e relatórios 09h",
    time: "09:00",
    message: "Checar métricas de Meta, Google e publicações. Identificar anomalias, falta de dados e clientes que precisam de relatório ou ajuste de leitura.",
    checklist: ["Clientes sem dados", "Anomalias", "Sugestões de melhoria"],
  },
  {
    slug: "sneider-1130-design-criativos",
    npcId: sneiderId,
    label: "Sneider · criativos 11h30",
    time: "11:30",
    message: "Revisar fila de design, criativos pendentes e identidade visual dos clientes. Sinalizar gargalos e pedir referência quando faltar material.",
    checklist: ["Criativos atrasados", "Referências faltando", "Ajustes visuais"],
  },
  {
    slug: "zezin-1430-alertas-proativos",
    npcId: zezinId,
    label: "Zezin · alertas proativos 14h30",
    time: "14:30",
    message: "Monitorar filas, publicações, webhooks, saldo e falhas operacionais. Avisar antes de virar problema para cliente.",
    checklist: ["Falhas", "Saldos", "Filas/API"],
  },
  {
    slug: "maria-0900-onboarding-acessos",
    npcId: mariaId,
    label: "Maria · onboarding e acessos 09h",
    time: "09:00",
    message: "Checar clientes novos ou incompletos: briefing, acessos, grupo Telegram, Meta, Instagram, Google e dados de contato.",
    checklist: ["Acessos pendentes", "Briefing", "Grupo vinculado"],
  },
];

const upsertRoutine = db.prepare(`
  INSERT INTO telegram_agent_routines (
    id, routine_slug, npc_id, label, schedule_local, timezone, target_scope, action_type,
    payload_json, active, created_at, updated_at
  ) VALUES (@id, @routine_slug, @npc_id, @label, @schedule_local, @timezone, @target_scope, @action_type,
    @payload_json, 1, @created_at, @updated_at)
  ON CONFLICT(routine_slug) DO UPDATE SET
    npc_id=excluded.npc_id,
    label=excluded.label,
    schedule_local=excluded.schedule_local,
    timezone=excluded.timezone,
    target_scope=excluded.target_scope,
    action_type=excluded.action_type,
    payload_json=excluded.payload_json,
    active=1,
    updated_at=excluded.updated_at
`);

for (const routine of routines) {
  upsertRoutine.run({
    id: uuid(),
    routine_slug: routine.slug,
    npc_id: routine.npcId,
    label: routine.label,
    schedule_local: routine.time,
    timezone: "America/Sao_Paulo",
    target_scope: "operational_group",
    action_type: "telegram_digest",
    payload_json: JSON.stringify({ message: routine.message, checklist: routine.checklist }),
    created_at: now(),
    updated_at: now(),
  });
}

console.log(JSON.stringify({
  telegramClientGroups: db.prepare("SELECT count(*) AS total FROM telegram_client_groups").get().total,
  linked,
  pending,
  telegramAgentRoutines: db.prepare("SELECT count(*) AS total FROM telegram_agent_routines").get().total,
}, null, 2));
