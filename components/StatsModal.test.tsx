import { cleanup, render, screen } from "@testing-library/react";
import { SWRConfig } from "swr";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { encode } from "../utils/codec";
import { initialState } from "../utils/game";
import { Game, GameStats } from "../utils/types";
import StatsModal from "./StatsModal";

const finishedGame: Game = {
  hash: encode("godok"),
  num: 1714,
  migrate: () => {},
  state: {
    ...initialState,
    answers: ["makan", "godok", "", "", "", ""],
    attempt: 2,
  },
  setState: () => {},
  ready: true,
  readyState: "ready",
  trackInvalidWord: () => {},
};

const stats = {
  distribution: { 1: 0, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, fail: 0 },
  currentStreak: 1,
  maxStreak: 1,
} as GameStats;

function renderStats(saved: Partial<GameStats>, remainingTime = true) {
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <StatsModal
        isOpen
        onClose={() => {}}
        game={finishedGame}
        stats={{ ...stats, ...saved }}
        remainingTime={
          remainingTime ? { hours: 4, minutes: 5, seconds: 6 } : undefined
        }
      />
    </SWRConfig>
  );
}

beforeEach(() => {
  vi.stubGlobal("fetch", async () => new Response(JSON.stringify([])));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("how long the game took", () => {
  test("is shown next to the time until the next word", () => {
    renderStats({ duration: 3723 });

    expect(screen.getByText("Durasi")).toBeTruthy();
    expect(screen.getByText("1:02:03")).toBeTruthy();
    expect(screen.getByText("4:05:06")).toBeTruthy();
  });

  // archive games have no next word, but still have a duration
  test("is shown on its own when there is no next word", () => {
    renderStats({ duration: 3723 }, false);

    expect(screen.getByText("1:02:03")).toBeTruthy();
    expect(screen.queryByText("Katla berikutnya")).toBeNull();
  });

  // stats saved before this feature have no duration at all
  test.each([null, undefined])(
    "is left out, not a crash, when the saved stats have %s",
    (duration) => {
      renderStats({ duration });

      expect(screen.queryByText("Durasi")).toBeNull();
      expect(screen.getByText("Katla berikutnya")).toBeTruthy();
      expect(screen.getByText("4:05:06")).toBeTruthy();
    }
  );
});
