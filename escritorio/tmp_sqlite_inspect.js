const Database = require("better-sqlite3");

const db = new Database("data/deskrpg.db", { readonly: true });
const tables = db
  .prepare("select name from sqlite_master where type = 'table' order by name")
  .all()
  .map((row) => row.name);

console.log("TABLES");
for (const table of tables) console.log(table);

const needles = process.argv.slice(2).map((value) => value.toLowerCase());
if (needles.length === 0) process.exit(0);

console.log("MATCHES");
for (const table of tables) {
  const columns = db.prepare(`pragma table_info(${JSON.stringify(table)})`).all();
  const textColumns = columns
    .filter((column) => /char|clob|text|json|varchar/i.test(String(column.type || "")))
    .map((column) => column.name);
  if (textColumns.length === 0) continue;

  const where = textColumns.map((column) => `lower(${JSON.stringify(column)}) like ?`).join(" or ");
  const params = textColumns.flatMap(() => needles.map((needle) => `%${needle}%`));
  const expandedWhere = textColumns
    .map((column) => needles.map(() => `lower(${JSON.stringify(column)}) like ?`).join(" or "))
    .join(" or ");
  const rows = db.prepare(`select rowid,* from ${JSON.stringify(table)} where ${expandedWhere} limit 20`).all(...params);
  for (const row of rows) {
    console.log(JSON.stringify({ table, row }, null, 2));
  }
}
