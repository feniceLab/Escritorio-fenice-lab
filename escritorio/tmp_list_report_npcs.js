const Database = require("better-sqlite3");
const db = new Database("data/deskrpg.db", { readonly: true });
console.log(db.prepare("pragma table_info(npcs)").all());
const rows = db.prepare(`
  select *
  from npcs
  where lower(name) like '%jo%'
     or lower(name) like '%relat%'
  order by name
`).all();
console.log(JSON.stringify(rows, null, 2));
