import { sql } from "kysely";
import { db } from "../schema.ts";

export type DailyUsageStats = {
  totalCommands: number;
  uniqueUsers: number;
  privateChats: number;
  groupChats: number;
};

export type CommandRank = {
  command: string;
  count: number;
};

export async function logCommand(
  command: string,
  telegram_id: number,
  chat_id: number,
): Promise<void> {
  try {
    await db.insertInto("command_usage_logs")
      .values({
        command,
        telegram_id,
        chat_id,
        timestamp: new Date().toISOString(),
      })
      .execute();
  } catch (error) {
    console.error("DB: Error when trying to register command usage:", error);
  }
}

export async function getUsageStatsByDateRange(
  startIso: string,
  endIso: string,
): Promise<DailyUsageStats> {
  try {
    const result = await db.selectFrom("command_usage_logs")
      .select([
        (eb) => eb.fn.countAll<number>().as("totalCommands"),
        (eb) => eb.fn.count<number>("telegram_id").distinct().as("uniqueUsers"),
        sql<number>`COUNT(DISTINCT CASE WHEN chat_id > 0 THEN chat_id END)`.as(
          "privateChats",
        ),
        sql<number>`COUNT(DISTINCT CASE WHEN chat_id < 0 THEN chat_id END)`.as(
          "groupChats",
        ),
      ])
      .where(sql`datetime(timestamp)`, ">=", sql`datetime(${startIso})`)
      .where(sql`datetime(timestamp)`, "<=", sql`datetime(${endIso})`)
      .executeTakeFirst();

    return {
      totalCommands: Number(result?.totalCommands ?? 0),
      uniqueUsers: Number(result?.uniqueUsers ?? 0),
      privateChats: Number(result?.privateChats ?? 0),
      groupChats: Number(result?.groupChats ?? 0),
    };
  } catch (error) {
    console.error("DB: Error getting usage stats by range:", error);
    return {
      totalCommands: 0,
      uniqueUsers: 0,
      privateChats: 0,
      groupChats: 0,
    };
  }
}

export async function getCommandRankByDateRange(
  startIso: string,
  endIso: string,
): Promise<CommandRank[]> {
  try {
    const rows = await db.selectFrom("command_usage_logs")
      .select([
        "command",
        (eb) => eb.fn.countAll<number>().as("count"),
      ])
      .where(sql`datetime(timestamp)`, ">=", sql`datetime(${startIso})`)
      .where(sql`datetime(timestamp)`, "<=", sql`datetime(${endIso})`)
      .groupBy("command")
      .orderBy("count", "desc")
      .execute();

    return rows.map((row) => ({
      command: row.command,
      count: Number(row.count),
    }));
  } catch (error) {
    console.error("DB: Error getting command rank by range:", error);
    return [];
  }
}

export async function countUsagesToday(): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const stats = await getUsageStatsByDateRange(
    startOfDay.toISOString(),
    endOfDay.toISOString(),
  );
  return stats.totalCommands;
}

