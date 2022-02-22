import { useEffect, useState } from "react";
import { useRouter } from "next/router";

import { LAST_HASH_KEY, GAME_STATE_KEY, INVALID_WORDS_KEY } from "./constants";
import { AnswerState, Game, GameState, GameStats } from "./types";
import LocalStorage, { isStorageEnabled } from "./browser";
import createStoredState from "./useStoredState";
import { trackEvent } from "./tracking";
import { decode, decodeHashed } from "./codec";
import { unstable_batchedUpdates } from "react-dom";

export const initialState: GameState = {
  answers: Array(6).fill(""),
  attempt: 0,
  lastCompletedDate: null,
  enableHighContrast: false,
  enableHardMode: false,
};

export const useGamePersistedState =
  createStoredState<GameState>(GAME_STATE_KEY);

export function useGame(hashed: string, enableStorage: boolean = true): Game {
  const useGameState = enableStorage ? useGamePersistedState : useState;
  const [state, setState] = useGameState<GameState>(initialState);
  const [readyState, setGameReadyState] = useState<Game["readyState"]>("init");
  const router = useRouter();

  const [num, latestHash, previousHash] = decodeHashed(hashed);
  const initialCurrentNum = Number(num);
  const [currentNum, setCurrentNum] = useState(initialCurrentNum);
  const [currentHash, setCurrentHash] = useState(latestHash);

  useEffect(() => {
    if (!enableStorage) {
      setGameReadyState("ready");
      return;
    }

    if (isStorageEnabled()) {
      setGameReadyState("ready");
    } else {
      setGameReadyState("no-storage");
      return;
    }

    // check for new game schedule
    const now = new Date();
    const gameDate = new Date("2022-01-20");
    gameDate.setDate(gameDate.getDate() + initialCurrentNum);
    gameDate.setHours(0);
    gameDate.setMinutes(0);
    gameDate.setSeconds(0);
    gameDate.setMilliseconds(0);
    const isAfterGameDate = now.getTime() >= gameDate.getTime();

    const lastHash = LocalStorage.getItem(LAST_HASH_KEY);

    // first time playing
    if (!lastHash) {
      if (!isAfterGameDate) {
        unstable_batchedUpdates(() => {
          setCurrentHash(previousHash);
          setCurrentNum(initialCurrentNum - 1);
        });
        LocalStorage.setItem(LAST_HASH_KEY, previousHash);
        return;
      }

      LocalStorage.setItem(LAST_HASH_KEY, currentHash);
      return;
    }

    // already play
    if (lastHash !== latestHash) {
      // ready for a new game
      if (isAfterGameDate) {
        unstable_batchedUpdates(() => {
          setCurrentHash(latestHash);
          setCurrentNum(initialCurrentNum);
          setState((state) => ({
            ...state,
            answers: Array(6).fill(""),
            attempt: 0,
          }));
        });
        LocalStorage.setItem(LAST_HASH_KEY, latestHash);
        LocalStorage.setItem(INVALID_WORDS_KEY, JSON.stringify([]));
      } else if (lastHash !== previousHash) {
        // last hash is not in hashed
        unstable_batchedUpdates(() => {
          setCurrentHash(previousHash);
          setCurrentNum(initialCurrentNum - 1);
          setState((state) => ({
            ...state,
            answers: Array(6).fill(""),
            attempt: 0,
          }));
        });
        LocalStorage.setItem(LAST_HASH_KEY, previousHash);
        LocalStorage.setItem(INVALID_WORDS_KEY, JSON.stringify([]));
      } else {
        unstable_batchedUpdates(() => {
          setCurrentHash(previousHash);
          setCurrentNum(initialCurrentNum - 1);
        });
      }
    }
    // we want this effect to execute only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hashed]);

  function trackInvalidWord(word: string) {
    let invalidWords = [];
    try {
      invalidWords = JSON.parse(localStorage.getItem(INVALID_WORDS_KEY));
      if (!Array.isArray(invalidWords)) {
        throw new Error("invalid words is not an array");
      }
    } catch (err) {
      invalidWords = [];
    }

    if (invalidWords.includes(word)) {
      return;
    }

    invalidWords.push(word);
    LocalStorage.setItem(INVALID_WORDS_KEY, JSON.stringify(invalidWords));
    trackEvent("invalid_word", { word });
  }

  useEffect(() => {
    if (state.enableHighContrast) {
      document.documentElement.setAttribute("data-katla-hc", "true");
    } else {
      document.documentElement.removeAttribute("data-katla-hc");
    }
  }, [state.enableHighContrast]);

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        router.replace(router.asPath);
      }
    }

    window.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      window.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [router]);

  return {
    hash: currentHash,
    num: currentNum,
    readyState,
    ready: readyState !== "init",
    state,
    setState,
    trackInvalidWord,
  };
}

export function useRemainingTime() {
  const now = new Date();
  const hours = 23 - now.getHours();
  const minutes = 59 - now.getMinutes();
  const seconds = 59 - now.getSeconds();
  const router = useRouter();

  const [remainingTime, setRemainingTime] = useState({
    hours,
    minutes,
    seconds,
  });

  useEffect(() => {
    const t = setInterval(() => {
      const now = new Date();
      const hours = 23 - now.getHours();
      const minutes = 59 - now.getMinutes();
      const seconds = 59 - now.getSeconds();

      if (hours + minutes + seconds === 0) {
        router.replace(router.asPath);
      }

      setRemainingTime({ hours, minutes, seconds });
    }, 100);
    return () => clearInterval(t);
  }, []);

  return remainingTime;
}

export function isGameFinished(game: Game) {
  return (
    game.state.attempt === 6 ||
    game.state.answers[game.state.attempt - 1] === decode(game.hash)
  );
}

export function getTotalWin(stats: GameStats) {
  const { fail, ...wins } = stats.distribution;
  const totalWin = Object.values(wins).reduce((a, b) => a + b, 0);
  return totalWin;
}

export function getTotalPlay(stats: GameStats) {
  return getTotalWin(stats) + stats.distribution.fail;
}

export function verifyStreak(lastCompletedDate: number | null): boolean {
  if (!lastCompletedDate) {
    return true;
  }

  const lastDate = new Date(lastCompletedDate);
  const now = new Date();
  now.setDate(now.getDate() - 1);
  return (
    now.getDate() === lastDate.getDate() &&
    now.getMonth() === lastDate.getMonth() &&
    now.getFullYear() === lastDate.getFullYear()
  );
}

type AnswerStates = [
  AnswerState,
  AnswerState,
  AnswerState,
  AnswerState,
  AnswerState
];

export function getAnswerStates(
  userAnswer: string,
  answer: string
): AnswerStates {
  const states: AnswerStates = Array(5).fill(null) as any;

  const answerChars = answer.split("");
  const userAnswerChars = userAnswer.split("");
  for (let i = 0; i < answerChars.length; i++) {
    if (userAnswer[i] === answerChars[i]) {
      states[i] = "correct";
      answerChars[i] = null;
      userAnswerChars[i] = null;
    }
  }

  for (let i = 0; i < userAnswerChars.length; i++) {
    if (userAnswerChars[i] === null) {
      continue;
    }

    const answerIndex = answerChars.indexOf(userAnswer[i]);
    if (answerIndex !== -1) {
      states[i] = "exist";
      answerChars[answerIndex] = null;
      userAnswerChars[i] = null;
    }
  }

  return states.map((s) => (s === null ? "wrong" : s)) as any;
}

export function checkHardModeAnswer(
  state: GameState,
  answer: string
): [isInvalid: boolean, unusedChar: string, letterIndex?: number] {
  const previousAnswer = state.answers[state.attempt - 1];
  const currentAnswer = state.answers[state.attempt];

  const previousAnswerStates = getAnswerStates(previousAnswer, answer);
  const currentAnswerStates = getAnswerStates(currentAnswer, answer);

  // first check for unused characters
  const mustBeUsedChars: string[] = previousAnswerStates.flatMap((state, i) => {
    if (state === "exist") {
      return previousAnswer[i];
    }
    return [];
  });

  for (let i = 0; i < mustBeUsedChars.length; i++) {
    if (!currentAnswer.includes(mustBeUsedChars[i])) {
      return [true, mustBeUsedChars[i].toUpperCase()];
    }
  }

  // then check for matching answer
  for (let i = 0; i < previousAnswerStates.length; i++) {
    if (
      previousAnswerStates[i] === "correct" &&
      currentAnswerStates[i] !== "correct"
    ) {
      return [true, previousAnswer[i].toUpperCase(), i + 1];
    }
  }

  return [false, ""];
}
