import { NextApiRequest, NextApiResponse } from "next";
import cheerio from "cheerio";

interface Definition {
  def_text: string;
}

interface KategloResponse {
  kateglo: {
    definition: ArrayLike<Definition>;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const word = req.query.word as string;

  let definitions: String[] | null = null;
  try {
    const kateglo: KategloResponse = await fetch(
      `https://kateglo.com/api.php?format=json&phrase=${word}`
    ).then((res) => res.json());
    definitions = Array.from(kateglo.kateglo.definition).map((d) => d.def_text);
  } catch (err) {
    console.warn(
      `Failed to fetch definitions from kateglo.com, using KBBI online for word ${word}`
    );
    try {
      definitions = [];
      const html = await fetch(
        `https://kbbi.kemdikbud.go.id/entri/${word}`
      ).then((res) => res.text());
      const $ = cheerio.load(html);
      $("ol li, ul.adjusted-par li").each((i, el) => {
        $(el).find("font").remove();
        definitions.push($(el).text());
      });
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
