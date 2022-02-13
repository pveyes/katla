const path = require("path");
const fs = require("fs/promises");
const { Octokit } = require("@octokit/rest");

const answerPath = path.join(__dirname, "answers.csv");
const wordsPath = path.join(__dirname, "whitelist.csv");

// sync with update.yml
const TIMEZONE_OFFSET = 9;

const readCsv = (filePath) =>
  fs.readFile(filePath, "utf-8").then((text) =>
    text
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );

async function insertWord(answers, answer) {
  if (process.env.GITHUB_ACTIONS) {
    // GH actions
    await writeCommit(answers.concat(answer).join(",") + "\n");
  } else {
    // dev testing
    await fs.writeFile(answerPath, answers.concat(answer).join(","), "utf-8");
  }
}

async function writeCommit(data) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("Missing GitHub token env in `GITHUB_TOKEN`");
  }

  const FileInfo = {
    owner: "pveyes",
    repo: "katla",
    path: ".scripts/answers.csv",
    sha: "main",
  };

  const octokit = new Octokit({
    baseUrl: "https://api.github.com",
    auth: `token ${token}`,
  });

  const response = await octokit.repos.getContent(FileInfo);
  const { sha } = response.data;

  octokit.repos.createOrUpdateFileContents({
    ...FileInfo,
    message: "Insert new answer",
    content: Buffer.from(data).toString("base64"),
    sha,
    branch: "main",
  });
}

function getMidnightDate() {
  const now = new Date();
  now.setHours(now.getHours() + TIMEZONE_OFFSET);
  const deltaToMidnightMinutes = 60 - now.getMinutes();
  now.setMinutes(now.getMinutes() + deltaToMidnightMinutes);
  return now;
}

async function main() {
  const [usedWords, allWords] = await Promise.all([
    readCsv(answerPath),
    readCsv(wordsPath),
  ]);

  const validWords = allWords.filter((word) => !usedWords.includes(word));

  // use let to allow secret words
  let word = validWords[Math.floor(Math.random() * validWords.length)];
  const secretDate = process.env.SECRET_DATE;
  const secretWord = process.env.SECRET_WORD;
  if (secretDate && secretWord) {
    const date = getMidnightDate();
    const [mm, dd] = secretDate.split("-").map(Number);
    if (date.getDate() == dd && date.getMonth() + 1 === mm) {
      word = secretWord;
    }
  }

  await insertWord(usedWords, word);
  console.log("New word inserted", word);
}

main().catch((error) => {
  console.error("Failed", error);
  process.exit(1);
});
