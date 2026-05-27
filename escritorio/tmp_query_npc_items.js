const Database = require("better-sqlite3");

const db = new Database("data/deskrpg.db", { readonly: true });

console.log("npc_library_items schema");
console.log(db.prepare("pragma table_info(npc_library_items)").all());

const rows = db
  .prepare(`
    select rowid, *
    from npc_library_items
    where lower(name) like '%suprema%'
       or lower(content) like '%suprema%'
       or lower(metadata) like '%suprema%'
       or lower(metadata) like '%relatorio-suprema%'
    order by created_at desc
    limit 30
  `)
  .all();

console.log(JSON.stringify(rows, null, 2));
