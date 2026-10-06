import { renderHook } from "@testing-library/react";
import { afterEach, beforeAll, expect, test, vi } from "vitest";

import { useGame } from "../game";
import { GAME_STATE_KEY, INVALID_WORDS_KEY, LAST_HASH_KEY } from "../constants";
import { decode, encode, encodeHashed } from "../codec";
import LocalStorage from "../browser";

vi.useFakeTimers();

class LocalStorageMock {
  constructor() {
    this.store = {};
  }

  clear() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] || null;
  }

  setItem(key, value) {
    this.store[key] = String(value);
  }

  removeItem(key) {
    delete this.store[key];
  }
}

beforeAll(() => {
  vi.stubGlobal("localStorage", new LocalStorageMock());
});

afterEach(() => {
  localStorage.clear();
});

const num = 20;
const hashed = encodeHashed(num, "latest", "previous");

test("first time playing, ready for new game", () => {
  vi.setSystemTime(new Date(2022, 1, 9, 0, 0, 0).getTime());

  const { result } = renderHook(() => useGame(hashed));
  expect(decode(result.current.hash)).toBe("latest");
  expect(result.current.num).toBe(num);
  expect(LocalStorage.getItem(LAST_HASH_KEY)).toBe(result.current.hash);
});

test("first time, not ready for new game", () => {
  vi.setSystemTime(new Date(2022, 1, 8, 22, 0, 0).getTime());

  const { result } = renderHook(() => useGame(hashed));
  expect(decode(result.current.hash)).toBe("previous");
  expect(result.current.num).toBe(num - 1);
  expect(LocalStorage.getItem(LAST_HASH_KEY)).toBe(result.current.hash);
});

test("already played, ready for new game", () => {
  const answers = ["ganar", "pakar", "syair"];
  const attempt = 3;
  const lastCompletedDate = Date.now();
  const enableHardMode = true;
  const enableHighContrast = true;

  vi.setSystemTime(new Date(2022, 1, 9, 0, 0, 0).getTime());
  localStorage.setItem(LAST_HASH_KEY, encode("previous"));
  localStorage.setItem(INVALID_WORDS_KEY, JSON.stringify(["fucek"]));
  localStorage.setItem(
    GAME_STATE_KEY,
    JSON.stringify({
      answers,
      attempt,
      lastCompletedDate,
      enableHardMode,
      enableHighContrast,
    })
  );

  const { result } = renderHook(() => useGame(hashed));
  expect(decode(result.current.hash)).toBe("latest");
  expect(result.current.num).toBe(20);
  expect(result.current.state.answers).toEqual(Array(6).fill(""));
  expect(result.current.state.attempt).toBe(0);

  // keep other state
  expect(result.current.state.lastCompletedDate).toBe(lastCompletedDate);
  expect(result.current.state.enableHardMode).toBe(enableHardMode);
  expect(result.current.state.enableHighContrast).toBe(enableHighContrast);

  // reset invalid word list
  expect(localStorage.getItem(INVALID_WORDS_KEY)).toBe("[]");
});

// yesterday's start time would make today's solve duration absurdly long
test.each([
  ["a new day has started", new Date(2022, 1, 9, 0, 0, 0), "previous"],
  [
    "the stored game is older than the previous day",
    new Date(2022, 1, 8, 22, 0, 0),
    "older",
  ],
])("the solve clock starts over when %s", (_, now, lastHash) => {
  vi.setSystemTime(now.getTime());
  localStorage.setItem(LAST_HASH_KEY, encode(lastHash));
  localStorage.setItem(
    GAME_STATE_KEY,
    JSON.stringify({
      answers: ["ganar", "pakar", "syair"],
      attempt: 3,
      startedAt: Date.now() - 60_000,
    })
  );

  const { result } = renderHook(() => useGame(hashed));

  expect(result.current.state.attempt).toBe(0);
  expect(result.current.state.startedAt).toBeNull();
});

test("already played, not ready for new game", () => {
  vi.setSystemTime(new Date(2022, 1, 8, 22, 0, 0).getTime());
  localStorage.setItem(LAST_HASH_KEY, encode("previous"));

  const { result } = renderHook(() => useGame(hashed));
  expect(decode(result.current.hash)).toBe("previous");
  expect(result.current.num).toBe(num - 1);
});

test("already played, but new hash already generated", () => {
  const answers = ["ganar", "pakar", "syair"];
  const attempt = 3;
  const lastCompletedDate = Date.now();
  const enableHardMode = true;
  const enableHighContrast = true;

  vi.setSystemTime(new Date(2022, 1, 8, 22, 0, 0).getTime());
  localStorage.setItem(
    GAME_STATE_KEY,
    JSON.stringify({
      answers,
      attempt,
      lastCompletedDate,
      enableHardMode,
      enableHighContrast,
    })
  );

  // played on date X, now on date Y
  // but hashed already on date Y and Z
  localStorage.setItem(LAST_HASH_KEY, encode("before"));

  const { result } = renderHook(() => useGame(hashed));
  expect(decode(result.current.hash)).toBe("previous");
  expect(result.current.num).toBe(19);
  expect(result.current.state.answers).toEqual(Array(6).fill(""));

  expect(localStorage.getItem(LAST_HASH_KEY)).toBe(encode("previous"));
});

test("currently playing, should not reset state", async () => {
  const answers = ["ganar", "pakar", "syair"];
  const attempt = 3;

  vi.setSystemTime(new Date(2022, 1, 9, 0, 0, 0).getTime());
  localStorage.setItem(LAST_HASH_KEY, encode("latest"));
  localStorage.setItem(
    GAME_STATE_KEY,
    JSON.stringify({
      answers,
      attempt,
    })
  );

  const { result } = renderHook(() => useGame(hashed));
  expect(result.current.ready).toBe(true);
  expect(decode(result.current.hash)).toBe("latest");
  expect(result.current.num).toBe(20);
  expect(result.current.state.answers).toEqual(answers);
  expect(result.current.state.attempt).toBe(attempt);
});

test("already played, refresh event", async () => {
  const answers = ["ganar", "pakar", "syair"];
  const attempt = 3;

  vi.setSystemTime(new Date(2022, 1, 9, 0, 0, 0).getTime());
  localStorage.setItem(LAST_HASH_KEY, encode("latest"));
  localStorage.setItem(
    GAME_STATE_KEY,
    JSON.stringify({
      answers,
      attempt,
    })
  );

  let currentHashed = hashed;
  const { result, rerender } = renderHook(() => useGame(currentHashed));
  expect(decode(result.current.hash)).toBe("latest");
  expect(result.current.num).toBe(20);

  // refresh
  const newNum = 21;
  vi.setSystemTime(new Date(2022, 1, 10, 0, 0, 0).getTime());
  currentHashed = encodeHashed(newNum, "refresh", "latest");
  rerender();
  expect(decode(result.current.hash)).toBe("refresh");
  expect(result.current.num).toBe(newNum);
});
