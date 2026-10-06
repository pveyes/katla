// Refreshes public/makna/words.json, the list of valid guesses served to the game.
import fs from "fs";
import path from "path";

const dir = path.join(process.cwd(), "public", "makna");

const words = fs
  .readdirSync(dir)
  .map((file) => file.replace(".json", ""))
  .filter((word) => word !== "words" && word.length === 5);

fs.writeFileSync(path.join(dir, "words.json"), JSON.stringify(words));
console.log(`${words.length} words written`);
