import fs from "fs/promises";
import path from "path";

export function getAllAnswers() {
  return fs
    .readFile(path.join(process.cwd(), "./.scripts/answers.csv"), "utf8")
    .then((text) =>
      text
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    );
}
