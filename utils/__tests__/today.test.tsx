import { act, renderHook, waitFor } from "@testing-library/react";
import { ReactNode } from "react";
import { SWRConfig } from "swr";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { useTodayHashed } from "../today";

function wrapper({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        provider: () => new Map(),
        focusThrottleInterval: 1,
        dedupingInterval: 0,
      }}
    >
      {children}
    </SWRConfig>
  );
}

let latest: string;

beforeEach(() => {
  latest = "monday";
  vi.stubGlobal(
    "fetch",
    async () => new Response(JSON.stringify({ hashed: latest }))
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// People leave the tab open overnight. Coming back to it must show the new
// daily word without a manual reload, otherwise they keep playing yesterday's.
test("a tab left open picks up the new word when it is focused again", async () => {
  const { result } = renderHook(() => useTodayHashed(), { wrapper });
  await waitFor(() => expect(result.current).toBe("monday"));

  latest = "tuesday";
  // a focus right after the first load counts as the same visit and is skipped
  await new Promise((resolve) => setTimeout(resolve, 20));
  act(() => {
    window.dispatchEvent(new Event("focus"));
  });

  await waitFor(() => expect(result.current).toBe("tuesday"));
});
