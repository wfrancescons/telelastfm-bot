import { db, type UsersTable } from "../schema.ts";

export async function createUser(
  telegram_id: number,
  lastfm_username: string,
): Promise<UsersTable> {
  const now = new Date().toISOString();

  const user: UsersTable = {
    telegram_id,
    lastfm_username,
    created_at: now,
    updated_at: now,
  };

  await db.insertInto("users")
    .values(user)
    .execute();

  return user;
}

export async function getUser(
  telegram_id: number,
): Promise<UsersTable | null> {
  const user = await db.selectFrom("users")
    .selectAll()
    .where("telegram_id", "=", telegram_id)
    .executeTakeFirst();

  return user ?? null;
}

export async function getLastfmUser(
  telegram_id: number,
): Promise<string | null> {
  const user = await getUser(telegram_id);
  return user?.lastfm_username ?? null;
}

export async function updateUser(
  telegram_id: number,
  lastfm_username: string,
): Promise<UsersTable | null> {
  const now = new Date().toISOString();

  await db.updateTable("users")
    .set({
      lastfm_username,
      updated_at: now,
    })
    .where("telegram_id", "=", telegram_id)
    .execute();

  return await getUser(telegram_id);
}

export async function setLastfmUsername(
  telegram_id: number,
  lastfm_username: string,
): Promise<UsersTable | null> {
  const existingUser = await getUser(telegram_id);

  if (!existingUser) {
    return await createUser(telegram_id, lastfm_username);
  }

  return await updateUser(telegram_id, lastfm_username);
}

export async function deleteUser(
  telegram_id: number,
): Promise<void> {
  await db.deleteFrom("users")
    .where("telegram_id", "=", telegram_id)
    .execute();
}

export async function countUsers(): Promise<number> {
  const result = await db.selectFrom("users")
    .select((eb) => eb.fn.countAll<number>().as("count"))
    .executeTakeFirst();

  return Number(result?.count ?? 0);
}

