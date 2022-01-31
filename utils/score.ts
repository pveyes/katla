import { GameStats } from "./types";

export function getTotalWin(stats: GameStats) {
  const { fail, ...wins } = stats.distribution;
  const totalWin = Object.values(wins).reduce((a, b) => a + b, 0);
  return totalWin;
}

export function getTotalPlay(stats: GameStats) {
  return getTotalWin(stats) + stats.distribution.fail;
}

export function verifyStreak(lastCompletedDate: string | null): boolean {
  if (lastCompletedDate === null) {
    return true;
  }

  const lastDate = new Date(lastCompletedDate);
  const now = new Date();
  now.setDate(now.getDate() - 1);
  return (
    now.getDate() === lastDate.getDate() &&
    now.getMonth() === lastDate.getMonth() &&
    now.getFullYear() === lastDate.getFullYear()
  );
}
