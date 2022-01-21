import { GameStats } from "./types";

export function getTotalWin(stats: GameStats) {
  const { fail, ...wins } = stats.distribution;
  const totalWin = Object.values(wins).reduce((a, b) => a + b, 0);
  return totalWin;
}

export function getTotalPlay(stats: GameStats) {
  return getTotalWin(stats) + stats.distribution.fail;
}
