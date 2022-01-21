import { NextApiRequest, NextApiResponse } from "next";
import { Client } from "@notionhq/client";

import { encode } from "../../utils/codec";

const databaseId = "04dc0ae3bb6c4702b5f99df302b593ec";
const notion = new Client({ auth: process.env.NOTION_API_KEY });

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const db = await notion.databases.query({
    database_id: databaseId,
    sorts: [
      {
        property: "Date",
        direction: "descending",
      },
    ],
  });

  const entry = db.results[0] as any;
  const date = entry.properties.Date.date.start;
  const word = entry.properties.Word.title[0].plain_text;
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=3600, stale-while-revalidate=86400"
  );
  res.status(200).json({ hash: encode(word), date: date });
}
