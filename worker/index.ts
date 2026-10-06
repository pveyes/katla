import * as Sentry from "@sentry/cloudflare";

import { getArchiveCount, getArchiveHashed, getTodayHashed } from "./answers";
import { getDefinitions } from "./define";

interface Env {
  ASSETS: Fetcher;
  DEFINE_TOKEN: string;
  THIRD_PARTY_DEFINE_TOKEN?: string;
  SENTRY_DSN?: string;
}

function json(data: unknown, status = 200, cacheControl?: string) {
  const headers = new Headers({ "Content-Type": "application/json" });
  if (cacheControl) {
    headers.set("Cache-Control", cacheControl);
  }
  return new Response(JSON.stringify(data), { status, headers });
}

// the Worker runs before the CDN cache, so honor `s-maxage` through the Cache API
async function cached(
  request: Request,
  ctx: ExecutionContext,
  produce: () => Promise<Response>
) {
  const cache = caches.default;
  const hit = await cache.match(request);
  if (hit) {
    return hit;
  }
  const response = await produce();
  if (response.ok) {
    ctx.waitUntil(cache.put(request, response.clone()));
  }
  return response;
}

async function handleApi(request: Request, env: Env, ctx: ExecutionContext) {
  const { pathname } = new URL(request.url);

  if (request.method !== "GET") {
    return json({ error: "Method not allowed" }, 405);
  }

  if (pathname === "/api/today") {
    return json({ hashed: getTodayHashed() }, 200, "public, max-age=30");
  }

  if (pathname === "/api/archive") {
    return json({ nums: getArchiveCount() }, 200, "public, max-age=60");
  }

  const archive = pathname.match(/^\/api\/archive\/(\d+)$/);
  if (archive) {
    const hashed = getArchiveHashed(Number(archive[1]));
    if (hashed === null) {
      return json({ error: "Not found" }, 404, "public, max-age=60");
    }
    return json({ hashed }, 200, "public, max-age=3600");
  }

  const define = pathname.match(/^\/api\/define\/([a-z]+)$/);
  if (define) {
    const auth = request.headers.get("Authorization");
    const token = auth?.startsWith("token ") ? auth.slice(6) : null;
    const tokens = [env.DEFINE_TOKEN, env.THIRD_PARTY_DEFINE_TOKEN].filter(
      Boolean
    );
    if (!token || !tokens.includes(token)) {
      return json({ error: "Unauthorized" }, 401);
    }

    return cached(request, ctx, async () => {
      const definitions = await getDefinitions(env.ASSETS, define[1]);
      if (definitions === null) {
        return json({ error: "Failed to get definitions" }, 500);
      }
      return json(
        definitions,
        200,
        "public, s-maxage=21600, stale-while-revalidate=86400"
      );
    });
  }

  return json({ error: "Not found" }, 404);
}

const handler: ExportedHandler<Env> = {
  async fetch(request, env, ctx) {
    if (new URL(request.url).pathname.startsWith("/api/")) {
      return handleApi(request, env, ctx);
    }
    return env.ASSETS.fetch(request);
  },
};

export default Sentry.withSentry(
  (env: Env) => ({ dsn: env.SENTRY_DSN, tracesSampleRate: 0.2 }),
  handler
);
