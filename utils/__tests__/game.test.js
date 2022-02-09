/**
 * @jest-environment jsdom
 */
import { renderHook } from "@testing-library/react-hooks";
import MockDate from "mockdate";

import { useGame } from "../game";
import { GAME_STATE_KEY, INVALID_WORDS_KEY, LAST_HASH_KEY } from "../constants";
import { decode, encode, encodeHashed } from "../codec";
import LocalStorage from "../browser";

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
  global.localStorage = new LocalStorageMock();
});

afterEach(() => {
  MockDate.reset();
  localStorage.clear();
});

const hashed = encodeHashed("latest", "2022-02-09", "previous", "2022-02-08");

test("first time playing, ready for new game", () => {
  MockDate.set(new Date(2022, 1, 9, 0, 0, 0));

  const { result } = renderHook(() => useGame(hashed));
  expect(decode(result.current.hash)).toBe("latest");
  expect(result.current.num).toBe(20);
  expect(LocalStorage.getItem(LAST_HASH_KEY)).toBe(result.current.hash);
});

test("first time, not ready for new game", () => {
  MockDate.set(new Date(2022, 1, 8, 22, 0, 0));

  const { result } = renderHook(() => useGame(hashed));
  expect(decode(result.current.hash)).toBe("previous");
  expect(result.current.num).toBe(19);
  expect(LocalStorage.getItem(LAST_HASH_KEY)).toBe(result.current.hash);
});

test("already played, ready for new game", () => {
  const answers = ["ganar", "pakar", "syair"];
  const attempt = 3;
  const lastCompletedDate = Date.now();
  const enableHardMode = true;
  const enableHighContrast = true;

  MockDate.set(new Date(2022, 1, 9, 0, 0, 0));
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

test("already played, not ready for new game", () => {
  MockDate.set(new Date(2022, 1, 8, 22, 0, 0));
  localStorage.setItem(LAST_HASH_KEY, encode("previous"));

  const { result } = renderHook(() => useGame(hashed));
  expect(decode(result.current.hash)).toBe("previous");
  expect(result.current.num).toBe(19);
});

test("already played, but new hash already generated", () => {
  const answers = ["ganar", "pakar", "syair"];
  const attempt = 3;
  const lastCompletedDate = Date.now();
  const enableHardMode = true;
  const enableHighContrast = true;
  MockDate.set(new Date(2022, 1, 8, 22, 0, 0));
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

  MockDate.set(new Date(2022, 1, 9, 0, 0, 0));
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

  MockDate.set(new Date(2022, 1, 9, 0, 0, 0));
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
  MockDate.set(new Date(2022, 1, 10, 0, 0, 0));
  currentHashed = encodeHashed("refresh", "2022-02-10", "latest", "2022-02-09");
  rerender();
  expect(decode(result.current.hash)).toBe("refresh");
  expect(result.current.num).toBe(21);
});
