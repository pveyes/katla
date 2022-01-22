import { NextApiRequest, NextApiResponse } from "next";

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
  const kateglo: KategloResponse = await fetch(
    `https://kateglo.com/api.php?format=json&phrase=${word}`
  ).then((res) => res.json());
  const definitions = Array.from(kateglo.kateglo.definition).map(
    (d) => d.def_text
  );
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=3600, stale-while-revalidate=86400"
  );
  res.status(200).json(definitions);
}
