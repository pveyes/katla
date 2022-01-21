import { AnswerState } from "./types";

type AnswerStates = [
  AnswerState,
  AnswerState,
  AnswerState,
  AnswerState,
  AnswerState
];

export function getAnswerStates(
  userAnswer: string,
  answer: string
): AnswerStates {
  const states: AnswerStates = Array(5).fill(null) as any;

  const answerChars = answer.split("");
  const userAnswerChars = userAnswer.split("");
  for (let i = 0; i < answerChars.length; i++) {
    if (userAnswer[i] === answerChars[i]) {
      states[i] = "correct";
      answerChars[i] = null;
      userAnswerChars[i] = null;
    }
  }

  for (let i = 0; i < userAnswerChars.length; i++) {
    if (userAnswerChars[i] === null) {
      continue;
    }

    const answerIndex = answerChars.indexOf(userAnswer[i]);
    if (answerIndex !== -1) {
      states[i] = "exist";
      answerChars[answerIndex] = null;
      userAnswerChars[i] = null;
    }
  }

  return states.map((s) => (s === null ? "wrong" : s)) as any;
}
