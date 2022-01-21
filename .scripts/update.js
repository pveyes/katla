const { Client } = require("@notionhq/client");
const fetch = require("node-fetch");

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
      console.log("result", result.properties.Word.title[0]);
      return result.properties.Word.title[0].plain_text;
    });

  if (db.has_more) {
    const nextWords = await getUsedWords(db.next_cursor);
    return words.concat(nextWords);
  }

  return words;
}

async function insertWord(word) {
  const now = new Date();
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

async function main() {
  const [usedWords, allWords] = await Promise.all([
    getUsedWords(),
    fetch("https://katla.vercel.app/api/words").then((res) => res.json()),
  ]);

  let word = allWords[Math.floor(Math.random() * allWords.length)];
  while (usedWords.includes(word)) {
    word = allWords[Math.floor(Math.random() * allWords.length)];
  }

  await insertWord(word);
  console.log("New word inserted");
}

main().catch((error) => {
  console.error("Failed", error);
  process.exit(1);
});
