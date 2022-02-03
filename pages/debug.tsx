import { GetStaticProps } from "next";
import { useEffect, useState } from "react";
import {
  GAME_STATE_KEY,
  GAME_STATS_KEY,
  INVALID_WORDS_KEY,
  LAST_HASH_KEY,
  LAST_SESSION_RESET_KEY,
} from "../utils/constants";

interface Props {
  hash: string;
  date: string;
}

export default function Debug(props: Props) {
  const [debugCode, setDebugCode] = useState("");
  useEffect(() => {
    const gameState = localStorage.getItem(GAME_STATE_KEY);
    const gameStats = localStorage.getItem(GAME_STATS_KEY);
    const lastHash = localStorage.getItem(LAST_HASH_KEY);
    const invalidWords = localStorage.getItem(INVALID_WORDS_KEY);
    const lastSessionReset = localStorage.getItem(LAST_SESSION_RESET_KEY);
    const now = new Date();
    let timezone = "Unknown";
    try {
      timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (err) {}

    setDebugCode(
      btoa(
        [
          props.hash,
          props.date,
          lastHash,
          gameState,
          gameStats,
          invalidWords,
          lastSessionReset,
          now.getTime(),
          now.getTimezoneOffset(),
          timezone,
          navigator.userAgent,
          window.location.host,
        ].join(":")
      )
    );
    // eslint-disable-next-line
  }, []);

  return (
    <div className="dark:text-white max-w-lg mx-auto mt-4">
      <h1 className="text-3xl mb-4">Debug</h1>
      {debugCode === "" ? (
        <span>Generating debug code...</span>
      ) : (
        <>
          <p className="mb-4">
            Kirimkan keluhan dan sertakan kode ini ke{" "}
            <a className="text-blue-400" href="https://twitter.com/pveyes">
              @pveyes
            </a>{" "}
            on Twitter
          </p>
          <pre className="border border-gray-300 p-3 whitespace-pre-wrap break-all ">
            {debugCode}
          </pre>
        </>
      )}
    </div>
  );
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const { hash, date } = await fetch("https://katla.vercel.app/api/hash").then(
    (res) => res.json()
  );
  return {
    props: {
      hash: hash,
      date: date,
    },
    revalidate: 60,
  };
};
