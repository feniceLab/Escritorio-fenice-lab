const Database = require("better-sqlite3");

const db = new Database("data/deskrpg.db", { readonly: true });
const tables = ["channel_library_items", "npc_library_items"];

for (const table of tables) {
  const rows = db
    .prepare(`
      select rowid, id, layer, category, name, content, metadata, created_at, updated_at
      from ${table}
      where lower(coalesce(category, '')) in ('site', 'url', 'link', 'html', 'other')
         or lower(coalesce(metadata, '')) like '%"filetype":"site"%'
         or lower(coalesce(metadata, '')) like '%"filetype":"html"%'
         or lower(coalesce(metadata, '')) like '%"url"%'
      order by rowid desc
      limit 120
    `)
    .all();

  console.log(`\n${table}`);
  for (const row of rows) {
    console.log(JSON.stringify(row, null, 2));
  }
}
