import { describe, expect, test } from "vitest";

import { describeMakna, getDefinitions } from "./define";

function assetsWith(body: unknown, contentType = "application/json") {
  return {
    fetch: async () =>
      new Response(typeof body === "string" ? body : JSON.stringify(body), {
        headers: { "Content-Type": contentType },
      }),
  } as unknown as Fetcher;
}

describe("describeMakna", () => {
  test("uses the definition when there is one", () => {
    expect(describeMakna({ definisi: "angin kencang" })).toBe("angin kencang");
  });

  test("describes root words that only exist with affixes", () => {
    expect(
      describeMakna({
        tipeTeks: "kata tidak dipakai dalam bentuk dasarnya",
        referensi: ["mengapung", "terapung"],
      })
    ).toBe(
      "kata tidak dipakai dalam bentuk dasarnya; bentuk turunan: mengapung, terapung"
    );
  });

  test("ignores entries with nothing to show", () => {
    expect(describeMakna({})).toBeNull();
  });
});

describe("getDefinitions", () => {
  test("drops entries without a definition", async () => {
    const assets = assetsWith([
      { makna: [{ definisi: "baik sekali; elok" }, { referensi: [] }] },
    ]);
    expect(await getDefinitions(assets, "https://katla.id", "bagus")).toEqual([
      "baik sekali; elok",
    ]);
  });

  test("returns the derived forms for a prakategorial word", async () => {
    const assets = assetsWith([
      {
        makna: [
          {
            tipeTeks: "kata tidak dipakai dalam bentuk dasarnya",
            referensi: ["apungan", "mengapung"],
          },
        ],
      },
    ]);
    expect(await getDefinitions(assets, "https://katla.id", "apung")).toEqual([
      "kata tidak dipakai dalam bentuk dasarnya; bentuk turunan: apungan, mengapung",
    ]);
  });
});
