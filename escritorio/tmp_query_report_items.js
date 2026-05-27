const Database = require("better-sqlite3");

const db = new Database("data/deskrpg.db", { readonly: true });

for (const table of ["channel_library_items", "npc_library_items", "office_memories", "office_clients"]) {
  console.log(`\n${table}`);
  console.log(db.prepare(`pragma table_info(${table})`).all());
  const rows = db
    .prepare(`
      select rowid, *
      from ${table}
      where lower(coalesce(name, '')) like '%relatorio%'
         or lower(coalesce(name, '')) like '%relatório%'
         or lower(coalesce(content, '')) like '%relatorio-suprema%'
         or lower(coalesce(content, '')) like '%suprema-pizza-2026%'
         or lower(coalesce(metadata, '')) like '%relatorio-suprema%'
         or lower(coalesce(metadata, '')) like '%suprema-pizza-2026%'
      order by rowid desc
      limit 50
    `)
    .all();
  console.log(JSON.stringify(rows, null, 2));
}
