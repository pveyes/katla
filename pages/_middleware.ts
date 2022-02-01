import { NextRequest, NextResponse } from "next/server";
import { isBot } from "next/dist/server/utils";

export default async function handler(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/akuisisi") {
    const userAgent = req.headers.get("user-agent");
    if (!isBot(userAgent)) {
      return NextResponse.redirect(
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
      );
    }
  }
}
