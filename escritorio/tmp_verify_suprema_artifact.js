const Database = require("better-sqlite3");
const db = new Database("data/deskrpg.db", { readonly: true });
const rows = db
  .prepare(`
    select n.name as npc_name, i.id, i.name, i.layer, i.category, i.metadata
    from npc_library_items i
    join npcs n on n.id = i.npc_id
    where i.name = ?
    order by n.name
  `)
  .all("Relatorio de Performance - Suprema Pizza");

console.log(JSON.stringify(rows.map((row) => {
  const metadata = JSON.parse(row.metadata || "{}");
  return {
    npc: row.npc_name,
    id: row.id,
    name: row.name,
    layer: row.layer,
    category: row.category,
    fileType: metadata.fileType,
    url: metadata.url,
  };
}), null, 2));
