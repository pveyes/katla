const { Client } = require("@notionhq/client");
const path = require("path");
const fs = require("fs/promises");

const databaseId = "04dc0ae3bb6c4702b5f99df302b593ec";
const notion = new Client({ auth: process.env.NOTION_API_KEY });

async function getUsedWords(cursor) {
  const db = await notion.databases.query({
    database_id: databaseId,
    start_cursor: cursor,
  });

  const words = db.results
    .filter((result) => {
      return result.properties.Word.title.length > 0;
    })
    .map((result) => {
      return result.properties.Word.title[0].plain_text;
    });

  if (db.has_more) {
    const nextWords = await getUsedWords(db.next_cursor);
    return words.concat(nextWords);
  }

  return words;
}

async function insertWord(word) {
  const now = getMidnightDate();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const date = now.getDate().toString().padStart(2, "0");

  await notion.pages.create({
    parent: {
      database_id: databaseId,
    },
    properties: {
      Date: {
        type: "date",
        date: {
          start: `${year}-${month}-${date}`,
        },
      },
      Word: {
        title: [
          {
            type: "text",
            text: {
              content: word,
              link: null,
            },
            annotations: {},
            plain_text: word,
            href: null,
          },
        ],
      },
    },
  });
}

// because this actions runs on UTC and previous date (23:58)
// we have to adjust few things
function getMidnightDate() {
  const now = new Date();
  now.setHours(now.getHours() + 7);
  const deltaToMidnightMinutes = 60 - now.getMinutes();
  now.setMinutes(now.getMinutes() + deltaToMidnightMinutes);
  return now;
}

async function main() {
  const [usedWords, allWords] = await Promise.all([
    getUsedWords(),
    fs
      .readFile(path.join(__dirname, "whitelist.csv"), "utf-8")
      .then((text) => text.split(",").filter(Boolean)),
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

  await insertWord(word);
  console.log("New word inserted");
}

main().catch((error) => {
  console.error("Failed", error);
  process.exit(1);
});
