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
): Promise<number> {
  const now = new Date().toISOString();
  const existing = await getUserScrobblesPlaycount(telegram_id);

  const consecutive_zero_weeks = scrobbles === 0
    ? (existing?.consecutive_zero_weeks ?? 0) + 1
    : 0;

  if (existing) {
    await db.updateTable("weekly_scrobbles_playcounts")
      .set({
        scrobbles_playcount: scrobbles,
        tracks_playcount: tracks,
        consecutive_zero_weeks,
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
        consecutive_zero_weeks,
        created_at: now,
        updated_at: now,
      })
      .execute();
  }

  return consecutive_zero_weeks;
}

export async function resetUserZeroWeeks(telegram_id: number): Promise<void> {
  await db.updateTable("weekly_scrobbles_playcounts")
    .set({
      consecutive_zero_weeks: 0,
      updated_at: new Date().toISOString(),
    })
    .where("telegram_id", "=", telegram_id)
    .execute();
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

