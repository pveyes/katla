import { withSentry } from "@sentry/nextjs";
import cheerio from "cheerio";
import { NextApiRequest, NextApiResponse } from "next";

interface Definition {
  def_text: string;
}

interface KategloResponse {
  kateglo: {
    definition: ArrayLike<Definition>;
  };
}

const tokens = [
  process.env.NEXT_PUBLIC_DEFINE_TOKEN,
  process.env.THIRD_PARTY_DEFINE_TOKEN,
];

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const word = req.query.word as string;
  const auth = req.headers.authorization;

  if (!auth || !auth.startsWith("token")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const [_, token] = auth.split(" ");
  if (!tokens.includes(token)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  let definitions: String[] | null = null;
  try {
    try {
      definitions = await fetchFromMakna(word);
    } catch (err) {
      console.log(`Failed to fetch from makna, using KBBI for word ${word}`, {
        err,
      });
      definitions = await fetchFromKbbi(word);
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
      definitions = Array.from(kateglo.kateglo.definition).map(
        (d) => d.def_text
      );
    } catch (err) {
      definitions = null;
    }
  }

  if (definitions === null) {
    res.status(500).json({ error: "Failed to get definitions" });
    return;
  }

  res.setHeader(
    "Cache-Control",
    "public, s-maxage=21600, stale-while-revalidate=86400"
  );
  res.status(200).json(definitions);
}

export default withSentry(handler);

async function fetchFromMakna(word: string): Promise<string[]> {
  const json = await fetch(
    `https://makna.fatihkalifa.workers.dev/${word}.json`
  ).then((res) => res.json());
  return json.flatMap((entry) => {
    return entry.makna.map((makna) => makna.definisi);
  });
}

async function fetchFromKbbi(word: string): Promise<string[]> {
  const html = await fetch(`https://kbbi.kemdikbud.go.id/entri/${word}`).then(
    (res) => res.text()
  );
  const $ = cheerio.load(html);

  const definitions = [];
  $("ol li, ul.adjusted-par li").each((i, el) => {
    $(el).find("font").remove();
    definitions.push($(el).text());
  });

  return definitions;
}
