import { beforeEach, describe, expect, test, vi } from "vitest";

import { decodeHashed, decode } from "../utils/codec";
import worker from "./index";

const ORIGIN = "https://katla.id";
const TOKEN = "secret-token";

const assets = {
  fetch: async () =>
    new Response(JSON.stringify([{ makna: [{ definisi: "arti kata" }] }]), {
      headers: { "Content-Type": "application/json" },
    }),
};

const env = { ASSETS: assets, DEFINE_TOKEN: TOKEN } as never;
const ctx = { waitUntil: () => {}, passThroughOnException: () => {} } as never;

function call(path: string, init?: RequestInit) {
  const request = new Request(ORIGIN + path, init) as never;
  return worker.fetch(request, env, ctx);
}

async function json(res: Response | Promise<Response>): Promise<any> {
  return (await res).json();
}

beforeEach(() => {
  // the Worker caches definitions in the colo cache, which does not exist in node
  vi.stubGlobal("caches", {
    default: { match: async () => undefined, put: async () => {} },
  });
});

describe("daily word", () => {
  test("today and the archive describe the same latest day", async () => {
    const today = await json(call("/api/today"));
    const { nums } = await json(call("/api/archive"));

    const [num] = decodeHashed(today.hashed);
    // the archive lists past days, so it ends one day before today
    expect(Number(num)).toBe(nums + 1);
  });

  test("an archived day carries its own answer and no other", async () => {
    // day 2 has a previous day, which must not be handed out with it
    const { hashed } = await json(call("/api/archive/2"));

    const [num, answer, previous] = decodeHashed(hashed);
    expect(num).toBe("2");
    expect(decode(answer)).toMatch(/^[a-z]{5}$/);
    expect(decode(previous)).toBe("");
  });

  test("the archive stops at today", async () => {
    const today = await json(call("/api/today"));
    const [latest] = decodeHashed(today.hashed);

    expect((await call(`/api/archive/${latest}`)).status).toBe(200);
    expect((await call(`/api/archive/${Number(latest) + 1}`)).status).toBe(404);
  });

  test.each(["0", "abc", "-1"])(
    "archive day %s does not exist",
    async (num) => {
      expect((await call(`/api/archive/${num}`)).status).toBe(404);
    }
  );
});

describe("definitions", () => {
  const auth = (token: string) => ({
    headers: { Authorization: `token ${token}` },
  });

  test.each([
    ["no token", undefined],
    ["a wrong token", auth("nope")],
    ["a token without the scheme", { headers: { Authorization: TOKEN } }],
  ])("are refused with %s", async (_, init) => {
    expect((await call("/api/define/makan", init)).status).toBe(401);
  });

  test("are returned with the right token", async () => {
    const res = await call("/api/define/makan", auth(TOKEN));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(["arti kata"]);
  });

  test("only accept plain lowercase words", async () => {
    const res = await call("/api/define/Makan..%2f", auth(TOKEN));
    expect(res.status).toBe(404);
  });
});

describe("routing", () => {
  test("writes are refused", async () => {
    expect((await call("/api/today", { method: "POST" })).status).toBe(405);
  });

  test("unknown api paths are not served the app shell", async () => {
    const res = await call("/api/nope");
    expect(res.status).toBe(404);
    expect(res.headers.get("Content-Type")).toBe("application/json");
  });
});
