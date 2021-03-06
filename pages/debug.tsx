import { useEffect, useState } from "react";
import LocalStorage from "../utils/browser";
import {
  GAME_STATE_KEY,
  GAME_STATS_KEY,
  INVALID_WORDS_KEY,
  LAST_HASH_KEY,
  LAST_SESSION_RESET_KEY,
} from "../utils/constants";

export default function Debug(props: { hashed: string }) {
  const [debugCode, setDebugCode] = useState("");
  useEffect(() => {
    const gameState = LocalStorage.getItem(GAME_STATE_KEY);
    const gameStats = LocalStorage.getItem(GAME_STATS_KEY);
    const lastHash = LocalStorage.getItem(LAST_HASH_KEY);
    const invalidWords = LocalStorage.getItem(INVALID_WORDS_KEY);
    const lastSessionReset = LocalStorage.getItem(LAST_SESSION_RESET_KEY);
    const now = new Date();
    let timezone = "Unknown";
    try {
      timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (err) {}

    setDebugCode(
      btoa(
        [
          props.hashed,
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

export { getStaticProps } from "./index";
