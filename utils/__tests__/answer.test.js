import { getAnswerStates } from "../game";

test("should mark `c` characters", () => {
  expect(getAnswerStates("SEMUA", "BENUA")).toEqual(["w", "c", "w", "c", "c"]);
});

test("should prioritize `c` before `e` and `w` characters", () => {
  expect(getAnswerStates("BABAT", "BENUA")).toEqual(["c", "e", "w", "w", "w"]);

  expect(getAnswerStates("GAGAP", "GANAR")).toEqual(["c", "c", "w", "c", "w"]);

  expect(getAnswerStates("NANAR", "GANAR")).toEqual(["w", "c", "c", "c", "c"]);
});
