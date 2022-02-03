import { NextApiRequest, NextApiResponse } from "next";
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const kbbi = await fetch("https://kbbi.vercel.app").then((res) => res.json());
  const words = kbbi.entries
    .map((entry) => {
      const [word] = entry.split("/").reverse();
      return word;
    })
    .filter((word) => /^[a-z]+$/.test(word) && word.length === 5);

  res.setHeader(
    "Cache-Control",
    "public, s-maxage=3600, stale-while-revalidate=86400"
  );
  res.status(200).json(words);
}
