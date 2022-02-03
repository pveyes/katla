/**
 * @jest-environment jsdom
 */
import { renderHook } from "@testing-library/react-hooks";
import MockDate from "mockdate";

import { useGame } from "../game";
import { LAST_HASH_KEY } from "../constants";

afterEach(() => {
  MockDate.reset();
  localStorage.clear();
});

test("should update hash when ready", () => {
  MockDate.set(new Date(2022, 0, 1, 0, 0, 1));
  localStorage.setItem(LAST_HASH_KEY, "xxx");
  const { result } = renderHook(() =>
    useGame({ hash: "yyy", date: "2022-01-01" })
  );

  expect(result.current.hash).toEqual("yyy");
  expect(localStorage.getItem(LAST_HASH_KEY)).toEqual("yyy");
});

test("should not update hash when not ready", () => {
  MockDate.set(new Date(2022, 0, 1, 23, 59, 59));
  localStorage.setItem(LAST_HASH_KEY, "xxx");
  const { result } = renderHook(() =>
    useGame({ hash: "yyy", date: "2022-01-02" })
  );
  expect(result.current.hash).toEqual("xxx");
});

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

global.localStorage = new LocalStorageMock();
