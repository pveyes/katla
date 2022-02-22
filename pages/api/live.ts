import { authorize } from "@liveblocks/node";
import { Client } from "@notionhq/client";
import { NextApiRequest, NextApiResponse } from "next";

const secret = process.env.LIVEBLOCKS_SECRET_KEY;
const databaseId = process.env.NOTION_LIVE_DATABASE_ID;

const notion = new Client({ auth: process.env.NOTION_API_KEY });

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const room = req.body.room;
  const auth = req.body.auth;

  const db = await notion.databases.query({
    database_id: databaseId,
    filter: {
      or: [
        {
          property: "Auth",
          type: "text",
          text: {
            equals: auth,
          },
        },
        {
          property: "Invite Key",
          type: "text",
          text: {
            equals: auth,
          },
        },
      ],
    },
  });

  if (db.results.length === 0) {
    return res
      .status(403)
      .json({ error: "You don't have permission to access this room" });
  }

  const result = await authorize({ room, secret, userId: req.body.username });
  const liveblock = JSON.parse(result.body);

  return res.status(result.status).json({
    ...liveblock,
    inviteKey: (db.results[0] as any).properties["Invite Key"].rich_text[0]
      .plain_text,
  });
}
