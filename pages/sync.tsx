import { useEffect } from "react";
import {
  GAME_STATE_KEY,
  GAME_STATS_KEY,
  LAST_HASH_KEY,
} from "../utils/constants";

const VALID_EVENT_ORIGIN =
  process.env.NODE_ENV === "production" ? "katla.vercel.app" : "localhost:3000";

export default function SyncPage() {
  useEffect(() => {
    if (window.location === window.parent.location) {
      window.location.replace("https://katla.vercel.app");
      return;
    }

    function handleMessage(event: MessageEvent) {
      if (
        event.data.type === "sync-storage" &&
        event.origin === VALID_EVENT_ORIGIN
      ) {
        localStorage.setItem(
          GAME_STATE_KEY,
          JSON.stringify(event.data.gameState)
        );
        localStorage.setItem(
          GAME_STATS_KEY,
          JSON.stringify(event.data.gameStats)
        );
        localStorage.setItem(LAST_HASH_KEY, event.data.lastHash);
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);
  return null;
}
