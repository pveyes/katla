import fs from "node:fs/promises";
import path from "node:path";
import { afterEach, describe, expect, test, vi } from "vitest";

import { getDefinitions } from "./define";

const ORIGIN = "https://katla.id";

function stored(entries: unknown) {
  return {
    fetch: async () =>
      new Response(JSON.stringify(entries), {
        headers: { "Content-Type": "application/json" },
      }),
  } as unknown as Fetcher;
}

// serves public/ like the Worker assets do, including the html shell that the
// single-page-app fallback returns for files that don't exist
function diskAssets() {
  return {
    fetch: async (input: string) => {
      const file = path.join("public", new URL(input).pathname);
      try {
        return new Response(await fs.readFile(file), {
          headers: { "Content-Type": "application/json" },
        });
      } catch {
        return new Response("<!doctype html>", {
          headers: { "Content-Type": "text/html" },
        });
      }
    },
  } as unknown as Fetcher;
}

function stubNetwork(handler: (url: string) => Response | Promise<Response>) {
  vi.stubGlobal("fetch", (url: string) => Promise.resolve(handler(url)));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getDefinitions", () => {
  const prakategorial = {
    tipeTeks: "kata tidak dipakai dalam bentuk dasarnya",
    referensi: ["apungan", "mengapung"],
  };

  test.each([
    [
      "plain definitions",
      [{ makna: [{ definisi: "baik sekali; elok" }] }],
      ["baik sekali; elok"],
    ],
    [
      "a root word that only exists with affixes",
      [{ makna: [prakategorial] }],
      [
        "kata tidak dipakai dalam bentuk dasarnya; bentuk turunan: apungan, mengapung",
      ],
    ],
    [
      "entries with nothing to show are dropped",
      [{ makna: [{ definisi: "baik sekali; elok" }, {}, { referensi: [] }] }],
      ["baik sekali; elok"],
    ],
  ])("%s", async (_, entries, expected) => {
    expect(await getDefinitions(stored(entries), ORIGIN, "bagus")).toEqual(
      expected
    );
  });

  test("falls back to KBBI when the word has no stored definition", async () => {
    stubNetwork((url) => {
      expect(url).toContain("kbbi.kemendikdasmen.go.id/entri/nonword");
      return new Response("<ol><li><font>n</font>arti dari kbbi</li></ol>");
    });

    // unknown files come back as the html shell, which must not be shown as a meaning
    const result = await getDefinitions(diskAssets(), ORIGIN, "nonword");
    expect(result).toEqual(["arti dari kbbi"]);
  });

  test("falls back to KBBI when the stored entry has no usable text", async () => {
    stubNetwork(() => new Response("<ol><li>arti dari kbbi</li></ol>"));

    const result = await getDefinitions(
      stored([{ makna: [{}] }]),
      ORIGIN,
      "kosong"
    );
    expect(result).toEqual(["arti dari kbbi"]);
  });

  test("gives up with null when every source fails", async () => {
    stubNetwork(() => {
      throw new Error("offline");
    });

    expect(await getDefinitions(diskAssets(), ORIGIN, "nonword")).toBeNull();
  });
});

// The popup is blank when a word has no stored meaning, which is what happened
// to root words like "apung" before. Every word the game can pick or accept as a
// guess must be answerable from the stored data alone, without any network.
describe("stored definitions", () => {
  async function csv(file: string) {
    const text = await fs.readFile(path.join(".scripts", file), "utf8");
    return text
      .split(",")
      .map((word) => word.trim())
      .filter(Boolean);
  }

  test("every possible answer has a meaning", async () => {
    stubNetwork(() => {
      throw new Error("a stored definition was missing, the network was used");
    });

    const words = [
      ...new Set([
        ...(await csv("whitelist.csv")),
        ...(await csv("answers.csv")),
      ]),
    ];
    const assets = diskAssets();

    const without: string[] = [];
    for (const word of words) {
      const definitions = await getDefinitions(assets, ORIGIN, word);
      if (!definitions?.length || definitions.some((text) => !text.trim())) {
        without.push(word);
      }
    }

    expect(without).toEqual([]);
  });
});
