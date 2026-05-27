const Database = require("better-sqlite3");

const db = new Database("data/deskrpg.db", { readonly: true });

for (const table of ["npc_library_items", "channel_library_items"]) {
  const rows = db
    .prepare(`
      select rowid, id, layer, category, name, metadata, created_at, updated_at
      from ${table}
      order by rowid desc
      limit 300
    `)
    .all();

  console.log(`\n${table}`);
  for (const row of rows) {
    let meta = {};
    try {
      meta = row.metadata ? JSON.parse(row.metadata) : {};
    } catch {}
    const haystack = `${row.name || ""} ${row.category || ""} ${meta.fileType || ""} ${meta.url || ""} ${meta.description || ""} ${meta.clientName || ""}`.toLowerCase();
    if (
      haystack.includes("suprema") ||
      haystack.includes("relatorio") ||
      haystack.includes("relatório") ||
      haystack.includes("site") ||
      haystack.includes("html")
    ) {
      console.log(JSON.stringify({
        table,
        rowid: row.rowid,
        id: row.id,
        layer: row.layer,
        category: row.category,
        name: row.name,
        fileType: meta.fileType ?? null,
        url: meta.url ?? null,
        clientName: meta.clientName ?? null,
        description: meta.description ?? null,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }, null, 2));
    }
  }
}
