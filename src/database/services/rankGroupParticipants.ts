import { db } from "../schema.ts";

export type RankParticipantUser = {
  telegram_id: number;
  lastfm_username: string;
};

export async function getAllRankGroups(): Promise<number[]> {
  const rows = await db.selectFrom("rank_group_participants")
    .select("chat_id")
    .groupBy("chat_id")
    .execute();

  return rows.map((row) => Number(row.chat_id));
}

export async function getAllRankUsers(): Promise<RankParticipantUser[]> {
  const rows = await db.selectFrom("rank_group_participants")
    .innerJoin("users", "users.telegram_id", "rank_group_participants.telegram_id")
    .select([
      "rank_group_participants.telegram_id as telegram_id",
      "users.lastfm_username as lastfm_username",
    ])
    .groupBy(["rank_group_participants.telegram_id", "users.lastfm_username"])
    .execute();

  return rows.map((row) => ({
    telegram_id: Number(row.telegram_id),
    lastfm_username: row.lastfm_username,
  }));
}

export async function getRecordsCountByChatId(chat_id: number): Promise<number> {
  const result = await db.selectFrom("rank_group_participants")
    .select((eb) => eb.fn.countAll<number>().as("count"))
    .where("chat_id", "=", chat_id)
    .executeTakeFirst();

  return Number(result?.count ?? 0);
}

export async function getRecord(chat_id: number, telegram_id: number) {
  const record = await db.selectFrom("rank_group_participants")
    .selectAll()
    .where("chat_id", "=", chat_id)
    .where("telegram_id", "=", telegram_id)
    .executeTakeFirst();

  return record ?? null;
}

export async function findOrCreateRecord(chat_id: number, telegram_id: number) {
  const existing = await getRecord(chat_id, telegram_id);
  if (existing) {
    throw "RANK_REGISTERED_USER";
  }

  const now = new Date().toISOString();
  await db.insertInto("rank_group_participants")
    .values({
      chat_id,
      telegram_id,
      created_at: now,
      updated_at: now,
    })
    .execute();

  return await getRecord(chat_id, telegram_id);
}

export async function getUsersByChatId(chat_id: number): Promise<number[]> {
  const rows = await db.selectFrom("rank_group_participants")
    .select("telegram_id")
    .where("chat_id", "=", chat_id)
    .execute();

  return rows.map((row) => Number(row.telegram_id));
}

export async function deleteRecord(
  chat_id: number,
  telegram_id: number,
): Promise<boolean> {
  const res = await db.deleteFrom("rank_group_participants")
    .where("chat_id", "=", chat_id)
    .where("telegram_id", "=", telegram_id)
    .executeTakeFirst();

  return Number(res.numDeletedRows ?? 0) > 0;
}

export async function deleteGroupFromRank(chat_id: number): Promise<number> {
  const res = await db.deleteFrom("rank_group_participants")
    .where("chat_id", "=", chat_id)
    .executeTakeFirst();

  return Number(res.numDeletedRows ?? 0);
}

export async function deleteUserFromAllRankGroups(
  telegram_id: number,
): Promise<number> {
  const res = await db.deleteFrom("rank_group_participants")
    .where("telegram_id", "=", telegram_id)
    .executeTakeFirst();

  return Number(res.numDeletedRows ?? 0);
}

export async function removeInvalidUsersFromGroup(
  chat_id: number,
  validUserIds: number[],
): Promise<number> {
  let query = db.deleteFrom("rank_group_participants")
    .where("chat_id", "=", chat_id);

  if (validUserIds.length > 0) {
    query = query.where("telegram_id", "not in", validUserIds);
  }

  const res = await query.executeTakeFirst();
  const deleted = Number(res.numDeletedRows ?? 0);
  if (deleted > 0) {
    console.log(`CRONJOB: Removed ${deleted} invalid users from group ${chat_id}`);
  }
  return deleted;
}

