import { describe, expect, test } from "vitest";

import { formatDuration, secondsSince } from "../duration";

describe("secondsSince", () => {
  const now = new Date(2022, 4, 6, 12, 0, 0).getTime();

  test("counts whole seconds since the first letter", () => {
    expect(secondsSince(now - 83_400, now)).toBe(83);
  });

  // new Date(null) is 1970, which would show a 52 year long game
  test.each([null, undefined, 0])(
    "a game without a start time (%s) has no duration",
    (startedAt) => {
      expect(secondsSince(startedAt, now)).toBeNull();
    }
  );

  test("a start time in the future (wrong clock) has no duration", () => {
    expect(secondsSince(now + 5_000, now)).toBeNull();
  });
});

describe("formatDuration", () => {
  test.each([
    [0, "0:00:00"],
    [59, "0:00:59"],
    [61, "0:01:01"],
    [3723, "1:02:03"],
    // left open overnight, the hours must not wrap around at 24
    [25 * 3600 + 5 * 60 + 9, "25:05:09"],
  ])("%i seconds is %s", (seconds, expected) => {
    expect(formatDuration(seconds)).toBe(expected);
  });

  test.each([null, undefined, -1])(
    "nothing is shown for %s, which is what older saved stats have",
    (seconds) => {
      expect(formatDuration(seconds)).toBeNull();
    }
  );
});
