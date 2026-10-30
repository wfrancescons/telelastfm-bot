import { getAllRankUsers } from "@/database/services/rankGroupParticipants.ts";
import { setUserScrobbles } from "@/database/services/weeklyScrobblesPlaycount.ts";
import { getWeeklyTrackChart } from "@/services/lastfm/index.ts";

async function fetchWeeklyStats(
  lastfm_user: string,
): Promise<{ scrobbles: number; tracks: number }> {
  try {
    const data = await getWeeklyTrackChart(lastfm_user);
    const rawTracks = data.weeklytrackchart?.track;
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
      `CRONJOB: Error fetching weekly track chart for ${lastfm_user}:`,
      error,
    );
    return { scrobbles: 0, tracks: 0 };
  }
}

export default async function updateUserScrobbles(): Promise<void> {
  const rankUsers = await getAllRankUsers();

  for (const user of rankUsers) {
    const stats = await fetchWeeklyStats(user.lastfm_username);
    await setUserScrobbles(user.telegram_id, stats);
  }
}

