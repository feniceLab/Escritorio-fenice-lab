import { db, channelLibraryItems, isPostgres, jsonForDb } from "@/db";
import type { LibrarySeedItem } from "@/lib/fenix-library-defaults";

export async function seedChannelLibrary(channelId: string, items: LibrarySeedItem[]) {
  if (!items.length) return { attempted: 0, created: 0 };

  const now = isPostgres ? new Date() : new Date().toISOString();

  const values = items.map((item, index) => ({
    channelId,
    layer: item.layer,
    category: item.category,
    name: item.name,
    content: item.content ?? null,
    metadata: item.metadata ? jsonForDb(item.metadata) : null,
    sortOrder: index,
    createdAt: now as unknown as Date,
    updatedAt: now as unknown as Date,
  }));

  const inserted = await db
    .insert(channelLibraryItems)
    .values(values)
    .onConflictDoNothing()
    .returning({ id: channelLibraryItems.id });

  return {
    attempted: items.length,
    created: inserted.length,
  };
}
