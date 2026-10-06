import * as cheerio from "cheerio";

interface Definition {
  def_text: string;
}

interface KategloResponse {
  kateglo: {
    definition: ArrayLike<Definition>;
  };
}

export async function getDefinitions(
  assets: Fetcher,
  word: string
): Promise<string[] | null> {
  try {
    try {
      return await fetchFromMakna(assets, word);
    } catch (err) {
      console.log(`Failed to fetch from makna, using KBBI for word ${word}`, {
        err,
      });
      return await fetchFromKbbi(word);
    }
  } catch (err) {
    console.warn(
      `Failed to fetch definitions from KBBI, using kateglo.com for word ${word}`,
      { err }
    );
    try {
      const kateglo: KategloResponse = await fetch(
        `https://kateglo.com/api.php?format=json&phrase=${word}`
      ).then((res) => res.json());
      return Array.from(kateglo.kateglo.definition).map((d) => d.def_text);
    } catch (err) {
      return null;
    }
  }
}

// definitions are static assets built by .scripts/makna.mjs
async function fetchFromMakna(
  assets: Fetcher,
  word: string
): Promise<string[]> {
  const res = await assets.fetch(`https://assets.local/makna/${word}.json`);
  // unknown words fall back to the SPA shell, which is html
  if (!res.ok || !res.headers.get("Content-Type")?.includes("json")) {
    throw new Error(`no stored definition for ${word}`);
  }
  const json: { makna: { definisi: string }[] }[] = await res.json();
  return json.flatMap((entry) => entry.makna.map((makna) => makna.definisi));
}

async function fetchFromKbbi(word: string): Promise<string[]> {
  const html = await fetch(
    `https://kbbi.kemendikdasmen.go.id/entri/${word}`
  ).then((res) => res.text());
  const $ = cheerio.load(html);

  const definitions: string[] = [];
  $("ol li, ul.adjusted-par li").each((i, el) => {
    $(el).find("font").remove();
    definitions.push($(el).text());
  });

  return definitions;
}
