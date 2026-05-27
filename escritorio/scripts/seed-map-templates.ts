/**
 * Seed map_templates table with built-in templates.
 * Idempotent: skips templates that already exist by name.
 *
 * Usage: npx tsx scripts/seed-map-templates.ts
 */
import { db, mapTemplates, jsonForDb } from "../src/db";
import smallOffice from "../src/lib/builtin/small-office-template.json";
import { eq } from "drizzle-orm";

async function seed() {
  const templates = [smallOffice];

  for (const tpl of templates) {
    const existing = await db
      .select({ id: mapTemplates.id })
      .from(mapTemplates)
      .where(eq(mapTemplates.name, tpl.name))
      .limit(1);

    if (existing.length > 0) {
      console.log(`[seed] skip "${tpl.name}" — already exists`);
      continue;
    }

    await db.insert(mapTemplates).values({
      name: tpl.name,
      icon: tpl.icon,
      description: tpl.description,
      cols: tpl.cols,
      rows: tpl.rows,
      spawnCol: tpl.spawnCol,
      spawnRow: tpl.spawnRow,
      thumbnail: tpl.thumbnail,
      tiledJson: jsonForDb(tpl.tiledJson),
    });
    console.log(`[seed] inserted "${tpl.name}"`);
  }

  console.log("[seed] done");
  process.exit(0);
}

seed().catch((err) => {
  console.error("[seed] failed:", err);
  process.exit(1);
});
