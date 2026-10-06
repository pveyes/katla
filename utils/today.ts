import useSWR from "swr";

import fetcher from "./fetcher";

export const TODAY_KEY = "/api/today";

// SWR revalidates on window focus, which picks up the new daily word when
// the player comes back to a tab left open overnight.
export function useTodayHashed() {
  const { data } = useSWR<{ hashed: string }>(TODAY_KEY, fetcher);
  return data?.hashed;
}

export function useArchiveHashed(num: string) {
  const { data, error } = useSWR<{ hashed: string }>(
    `/api/archive/${num}`,
    fetcher,
    { revalidateOnFocus: false }
  );
  return { hashed: data?.hashed, notFound: Boolean(error) };
}

export function useWords() {
  const { data } = useSWR<string[]>("/makna/words.json", fetcher, {
    revalidateOnFocus: false,
  });
  return data;
}
