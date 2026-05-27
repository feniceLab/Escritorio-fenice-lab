const Database = require("better-sqlite3");

const db = new Database("data/deskrpg.db");
const keepIds = new Set([
  "ce91b0aa-1ab8-4251-a9b9-b215310d396f",
  "34ca62f3-de93-4dba-aa85-7442001d1eeb",
]);
const candidateIds = [
  "9434a231-235e-44c0-b1ec-78510194883f",
  "85d3d783-8653-44d7-ba5d-3502544aab7f",
  "dd35f745-28de-40a5-b161-c42dc7a5c399",
];

const removed = [];
for (const id of candidateIds) {
  const row = db.prepare("select id, name from npc_library_items where id = ?").get(id);
  if (row && !keepIds.has(id)) {
    db.prepare("delete from npc_library_items where id = ?").run(id);
    removed.push(row);
  }
}

console.log(JSON.stringify({ removed }, null, 2));
