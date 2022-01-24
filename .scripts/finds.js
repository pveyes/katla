const fetch = require("node-fetch");

const vocal = ["a", "i", "u", "e", "o"];

fetch("https://katla.vercel.app/api/words")
  .then((res) => res.json())
  .then((words) => {
    words
      .filter((word) => {
        const vocals = word.split("").filter((char) => vocal.includes(char));
        return vocals.length === 1;
      })
      .forEach((word) => {
        console.log(word);
      });
  });
