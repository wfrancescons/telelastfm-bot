import { db, type WeeklyScrobblesPlaycountsTable } from "../schema.ts";

export async function getUserScrobblesPlaycount(
  telegram_id: number,
): Promise<WeeklyScrobblesPlaycountsTable | null> {
  const row = await db.selectFrom("weekly_scrobbles_playcounts")
    .selectAll()
    .where("telegram_id", "=", telegram_id)
    .executeTakeFirst();

  return row ?? null;
}

export async function setUserScrobbles(
  telegram_id: number,
  { scrobbles, tracks }: { scrobbles: number; tracks: number },
): Promise<void> {
  const now = new Date().toISOString();
  const existing = await getUserScrobblesPlaycount(telegram_id);

  if (existing) {
    await db.updateTable("weekly_scrobbles_playcounts")
      .set({
        scrobbles_playcount: scrobbles,
        tracks_playcount: tracks,
        updated_at: now,
      })
      .where("telegram_id", "=", telegram_id)
      .execute();
  } else {
    await db.insertInto("weekly_scrobbles_playcounts")
      .values({
        telegram_id,
        scrobbles_playcount: scrobbles,
        tracks_playcount: tracks,
        created_at: now,
        updated_at: now,
      })
      .execute();
  }
}

export async function getSpecificUsers(
  telegram_ids: number[],
): Promise<WeeklyScrobblesPlaycountsTable[]> {
  if (telegram_ids.length === 0) return [];
  return await db.selectFrom("weekly_scrobbles_playcounts")
    .selectAll()
    .where("telegram_id", "in", telegram_ids)
    .execute();
}

