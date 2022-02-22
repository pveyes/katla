import { NextApiRequest, NextApiResponse } from "next";
import cheerio from "cheerio";
import { withSentry } from "@sentry/nextjs";

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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 1000);

    const html = await fetch(`https://kbbi.kemdikbud.go.id/entri/${word}`, {
      signal: controller.signal,
    }).then((res) => {
      clearTimeout(timeoutId);
      return res.text();
    });
    const $ = cheerio.load(html);

    definitions = [];
    $("ol li, ul.adjusted-par li").each((i, el) => {
      $(el).find("font").remove();
      definitions.push($(el).text());
    });
  } catch (err) {
    console.warn(
      `Failed to fetch definitions from KBBI, using kateglo.com for word ${word}`
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
