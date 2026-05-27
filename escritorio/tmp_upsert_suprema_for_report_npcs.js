const crypto = require("node:crypto");
const Database = require("better-sqlite3");

const db = new Database("data/deskrpg.db");
const reportUrl = "https://escritorio.starkentecnologia.com.br/starken-os/relatorio-suprema-pizza-2026.html";
const reportTitle = "Relatorio de Performance - Suprema Pizza";
const now = new Date().toISOString();

const npcs = db.prepare(`
  select id, name
  from npcs
  where lower(name) like '%jo%'
     or lower(name) like '%relat%'
`).all();

const metadata = {
  fileType: "site",
  url: reportUrl,
  description: "Relatorio HTML publico de performance criado para Suprema Pizza.",
  clientName: "Suprema Pizza",
  tags: ["relatorio", "performance", "suprema-pizza"],
  savedByNpc: false,
  savedAt: now,
  source: "vps-static-report",
};

const result = [];
for (const npc of npcs) {
  const existing = db
    .prepare("select id from npc_library_items where npc_id = ? and layer = 'outputs' and name = ?")
    .get(npc.id, reportTitle);

  if (existing) {
    db.prepare("update npc_library_items set category = ?, content = ?, metadata = ?, updated_at = ? where id = ?")
      .run("site", reportUrl, JSON.stringify(metadata), now, existing.id);
    result.push({ action: "updated", npc, id: existing.id });
  } else {
    const id = crypto.randomUUID();
    db.prepare(`
      insert into npc_library_items (id, npc_id, layer, category, name, content, metadata, sort_order, created_at, updated_at)
      values (?, ?, 'outputs', 'site', ?, ?, ?, 0, ?, ?)
    `).run(id, npc.id, reportTitle, reportUrl, JSON.stringify(metadata), now, now);
    result.push({ action: "inserted", npc, id });
  }
}

console.log(JSON.stringify({ url: reportUrl, result }, null, 2));
