import { useEffect, useState } from "react";
import createPersistedState from "use-persisted-state";
import { LAST_HASH_KEY, GAME_STATE_KEY } from "./constants";

import { GameState, PersistedState } from "./types";

const initialState: GameState = {
  answers: Array(6).fill(""),
  attempt: 0,
};

interface Config {
  hash: string;
  date: string;
}

const useGameState: PersistedState<GameState> =
  createPersistedState(GAME_STATE_KEY);

export default function useGame(config: Config) {
  const [state, setState] = useGameState(initialState);
  const [gameReady, setGameReady] = useState(false);
  const [currentHash, setCurrentHash] = useState(config.hash);

  useEffect(() => {
    setGameReady(true);

    const lastHash = localStorage.getItem(LAST_HASH_KEY);
    let currentHash = config.hash;

    if (lastHash !== currentHash && lastHash !== "") {
      // new game schedule
      const now = new Date();
      const gameDate = new Date(config.date);
      gameDate.setHours(0);
      gameDate.setMinutes(0);
      gameDate.setSeconds(0);
      gameDate.setMilliseconds(0);
      const isAfterGameDate = now.getTime() >= gameDate.getTime();

      // ready for a new game
      if (isAfterGameDate) {
        localStorage.setItem(LAST_HASH_KEY, config.hash);
        setState({
          answers: Array(6).fill(""),
          attempt: 0,
        });
      }
      // not yet ready for a new game
      else {
        setCurrentHash(lastHash);
      }
    }
    // we want this effect to execute only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { gameReady, state, setState, currentHash };
}
