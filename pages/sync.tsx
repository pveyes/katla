import { useEffect } from "react";
import {
  GAME_STATE_KEY,
  GAME_STATS_KEY,
  LAST_HASH_KEY,
} from "../utils/constants";

export default function SyncPage() {
  useEffect(() => {
    if (window.location === window.parent.location) {
      window.location.replace("https://katla.vercel.app");
      return;
    }

    if (window.parent.location.host !== "katla.vercel.app") {
      // do not sync
      return;
    }

    function handleMessage(event: MessageEvent) {
      if (event.data.type === "sync-storage") {
        localStorage.setItem(GAME_STATE_KEY, event.data.gameState);
        localStorage.setItem(GAME_STATS_KEY, event.data.gameStats);
        localStorage.setItem(LAST_HASH_KEY, event.data.lastHash);
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);
  return null;
}
