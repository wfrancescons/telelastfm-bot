import { db, type UserStreaksTable } from "../schema.ts";

export async function createUserStreaks(
  telegram_id: number,
): Promise<UserStreaksTable> {
  const now = new Date().toISOString();
  const row: UserStreaksTable = {
    telegram_id,
    streaks_count: 0,
    streaks_peak: 0,
    last_streak_timestamp: now,
    created_at: now,
  };

  await db.insertInto("user_streaks")
    .values(row)
    .execute();

  return row;
}

export async function findStreaksByPkOrCreate(
  telegram_id: number,
): Promise<UserStreaksTable> {
  const existing = await db.selectFrom("user_streaks")
    .selectAll()
    .where("telegram_id", "=", telegram_id)
    .executeTakeFirst();

  if (existing) {
    return existing;
  }

  return await createUserStreaks(telegram_id);
}

function getStartOfDayMs(dateInput: string | Date): number {
  const d = new Date(dateInput);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export async function updateStreaks(
  telegram_id: number,
): Promise<UserStreaksTable> {
  const userStreaks = await findStreaksByPkOrCreate(telegram_id);

  const todayMs = getStartOfDayMs(new Date());
  const lastStreakMs = getStartOfDayMs(userStreaks.last_streak_timestamp);
  const diffDays = Math.round((todayMs - lastStreakMs) / (1000 * 60 * 60 * 24));

  const nowIso = new Date().toISOString();

  if (diffDays === 1) {
    const nextCount = userStreaks.streaks_count + 1;
    const nextPeak = Math.max(nextCount, userStreaks.streaks_peak);

    await db.updateTable("user_streaks")
      .set({
        streaks_count: nextCount,
        streaks_peak: nextPeak,
        last_streak_timestamp: nowIso,
      })
      .where("telegram_id", "=", telegram_id)
      .execute();

    return {
      ...userStreaks,
      streaks_count: nextCount,
      streaks_peak: nextPeak,
      last_streak_timestamp: nowIso,
    };
  }

  if (diffDays >= 2) {
    await db.updateTable("user_streaks")
      .set({
        streaks_count: 0,
        last_streak_timestamp: nowIso,
      })
      .where("telegram_id", "=", telegram_id)
      .execute();

    return {
      ...userStreaks,
      streaks_count: 0,
      last_streak_timestamp: nowIso,
    };
  }

  return userStreaks;
}

