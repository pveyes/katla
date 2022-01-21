import { getAnswerStates } from "../answer";

test("should mark `correct` characters", () => {
  expect(getAnswerStates("SEMUA", "BENUA")).toEqual([
    "wrong",
    "correct",
    "wrong",
    "correct",
    "correct",
  ]);
});

test("should prioritize `correct` before `exist` and `wrong` characters", () => {
  expect(getAnswerStates("BABAT", "BENUA")).toEqual([
    "correct",
    "exist",
    "wrong",
    "wrong",
    "wrong",
  ]);

  expect(getAnswerStates("GAGAP", "GANAR")).toEqual([
    "correct",
    "correct",
    "wrong",
    "correct",
    "wrong",
  ]);

  expect(getAnswerStates("NANAR", "GANAR")).toEqual([
    "wrong",
    "correct",
    "correct",
    "correct",
    "correct",
  ]);
});
