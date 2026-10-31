import {
  deleteUserFromAllRankGroups,
  getAllRankUsers,
} from "@/database/services/rankGroupParticipants.ts";
import {
  resetUserZeroWeeks,
  setUserScrobbles,
} from "@/database/services/weeklyScrobblesPlaycount.ts";
import { makeRequest } from "@/services/lastfm/client.ts";

async function fetchWeeklyStats(
  lastfm_user: string,
): Promise<{ scrobbles: number; tracks: number }> {
  try {
    const data = await makeRequest({
      method: "user.getTopTracks",
      username: lastfm_user,
      period: "7day",
      limit: 1000,
    });
    const rawTracks = data.toptracks?.track;
    const tracks = Array.isArray(rawTracks)
      ? rawTracks
      : rawTracks
      ? [rawTracks]
      : [];

    const scrobbles = tracks.reduce(
      (acc: number, curr: { playcount?: string | number }) =>
        acc + (Number(curr.playcount) || 0),
      0,
    );

    return {
      scrobbles,
      tracks: tracks.length,
    };
  } catch (error) {
    console.error(
      `CRONJOB: Error fetching weekly stats for ${lastfm_user}:`,
      error,
    );
    return { scrobbles: 0, tracks: 0 };
  }
}

export default async function updateUserScrobbles(): Promise<void> {
  const rankUsers = await getAllRankUsers();

  for (const user of rankUsers) {
    const stats = await fetchWeeklyStats(user.lastfm_username);
    const consecutiveZeroWeeks = await setUserScrobbles(
      user.telegram_id,
      stats,
    );

    if (consecutiveZeroWeeks >= 2) {
      const removedCount = await deleteUserFromAllRankGroups(user.telegram_id);
      console.log(
        `CRONJOB: User ${user.telegram_id} (${user.lastfm_username}) had 2 consecutive zero-scrobble weeks and was removed from ${removedCount} rank group(s).`,
      );
      await resetUserZeroWeeks(user.telegram_id);
    }
  }
}

