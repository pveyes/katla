import { pad0 } from "./formatter";

// whole seconds between the first letter of a game and now, null when the game
// has no start time (it was started before the clock existed, or the clock is wrong)
export function secondsSince(
  startedAt: number | null | undefined,
  now: number = Date.now()
): number | null {
  if (!startedAt || startedAt > now) {
    return null;
  }

  return Math.round((now - startedAt) / 1000);
}

// h:mm:ss, hours are not capped at 24 so a game left open overnight stays accurate
export function formatDuration(
  seconds: number | null | undefined
): string | null {
  if (seconds === null || seconds === undefined || seconds < 0) {
    return null;
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}:${pad0(minutes)}:${pad0(seconds % 60)}`;
}
