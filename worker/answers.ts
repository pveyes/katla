// Bundled into the Worker only, so the answer list never ships to the browser.
// `.scripts/answers.csv` is updated daily by the update-word GitHub Action.
import answersCsv from "../.scripts/answers.csv?raw";

import { encodeHashed } from "../utils/codec";

const answers = answersCsv
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export function getTodayHashed() {
  return encodeHashed(
    answers.length,
    answers[answers.length - 1],
    answers[answers.length - 2]
  );
}

// number of archived days, today's word is not included
export function getArchiveCount() {
  return answers.length - 1;
}

export function getArchiveHashed(num: number) {
  // archive should only return previous days
  if (!Number.isInteger(num) || num < 1 || num > answers.length) {
    return null;
  }
  return encodeHashed(num, answers[num - 1], "");
}
