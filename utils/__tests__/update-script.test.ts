import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

// The daily refresh is a GitHub Action running .scripts/update.js. It is only
// noticed when it breaks (the game shows yesterday's word, or a repeated one),
// so run the real script against fixture lists instead of reading its source.

const repo = process.cwd();
let dir: string;

function csv(file: string) {
  return fs
    .readFileSync(path.join(dir, file), "utf8")
    .split(",")
    .map((word) => word.trim())
    .filter(Boolean);
}

function run(env: Record<string, string> = {}) {
  return spawnSync(
    process.execPath,
    // always pick the first candidate, so a used word is the first thing to go wrong
    [
      "--require",
      path.join(dir, "first-pick.cjs"),
      path.join(dir, "update.js"),
    ],
    {
      env: {
        PATH: process.env.PATH,
        NODE_PATH: path.join(repo, "node_modules"),
        ...env,
      },
      encoding: "utf8",
    }
  );
}

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "katla-update-"));
  fs.copyFileSync(
    path.join(repo, ".scripts/update.js"),
    path.join(dir, "update.js")
  );
  fs.writeFileSync(path.join(dir, "first-pick.cjs"), "Math.random = () => 0;");
  fs.writeFileSync(path.join(dir, "answers.csv"), "kuda,sapi");
  fs.writeFileSync(path.join(dir, "whitelist.csv"), "kuda,sapi,ayam,bebek");
});

afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

describe("daily word script", () => {
  test("appends a word that was never used and keeps the history", () => {
    const result = run();

    expect(result.status).toBe(0);
    const answers = csv("answers.csv");
    expect(answers.slice(0, 2)).toEqual(["kuda", "sapi"]);
    expect(answers).toHaveLength(3);
    expect(["ayam", "bebek"]).toContain(answers[2]);
  });

  test("never repeats a word across runs", () => {
    run();
    run();

    const answers = csv("answers.csv");
    expect(new Set(answers).size).toBe(answers.length);
    expect(answers).toHaveLength(4);
  });

  test("fails loudly in the action when it cannot publish the word", () => {
    const result = run({ GITHUB_ACTIONS: "true" });

    // a green run that publishes nothing would silently freeze the game
    expect(result.status).not.toBe(0);
    expect(csv("answers.csv")).toEqual(["kuda", "sapi"]);
  });
});
