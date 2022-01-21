import { getAnswerStates } from "../answer";

test("should mark correct characters", () => {
  expect(getAnswerStates("SEMUA", "BENUA")).toEqual([
    "wrong",
    "correct",
    "wrong",
    "correct",
    "correct",
  ]);
});

test("should prioritize correct, then exist", () => {
  expect(getAnswerStates("BABAT", "BENUA")).toEqual([
    "correct",
    "exist",
    "wrong",
    "wrong",
    "wrong",
  ]);
});
