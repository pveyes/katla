import { authorize } from "@liveblocks/node";
import { createClient } from "@supabase/supabase-js";
import { NextApiRequest, NextApiResponse } from "next";

const supabase = createClient(
  "https://wwaoyidihlwhhlzykzup.supabase.co",
  process.env.SUPABASE_SECRET
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const room = req.body.room;
  const auth = req.body.auth;

  const { data, error } = await supabase
    .from("rooms")
    .select()
    .or(`auth.eq.${auth},invite.eq.${auth}`);

  if (error || data.length === 0) {
    return res
      .status(403)
      .json({ error: "You don't have permission to access this room" });
  }

  const result = await authorize({
    room,
    secret: process.env.LIVEBLOCKS_SECRET_KEY,
    userId: req.body.username,
  });

  return res.status(result.status).json({
    ...JSON.parse(result.body),
    inviteKey: data[0].invite,
  });
}
