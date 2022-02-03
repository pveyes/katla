import { useEffect, useState, useRef } from "react";
import createPersistedState from "use-persisted-state";
import useSWR from "swr";

import { LAST_HASH_KEY, GAME_STATE_KEY, INVALID_WORDS_KEY } from "./constants";
import fetcher from "./fetcher";
import { AnswerState, GameState, GameStats, PersistedState } from "./types";

const initialState: GameState = {
  answers: Array(6).fill(""),
  attempt: 0,
  lastCompletedDate: null,
};

interface Config {
  hash: string;
  date: string;
}

export interface Game extends Config {
  words: string[];
  ready: boolean;
  state: GameState;
  setState: (state: GameState) => void;
  trackInvalidWord: (word: string) => void;
}

const useGamePersistedState: PersistedState<GameState> =
  createPersistedState(GAME_STATE_KEY);

export function useGame(config: Config, enableStorage: boolean = true): Game {
  const useGameState = enableStorage ? useGamePersistedState : useState;
  const [state, setState] = useGameState<GameState>(initialState);
  const [gameReady, setGameReady] = useState(false);
  const [currentHash, setCurrentHash] = useState(config.hash);
  const { data: words = [] } = useSWR("/api/words", fetcher);

  useEffect(() => {
    setGameReady(true);

    const lastHash = localStorage.getItem(LAST_HASH_KEY);
    let currentHash = config.hash;

    if (!enableStorage) {
      return;
    }

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
          lastCompletedDate: state.lastCompletedDate,
        });
        localStorage.setItem(INVALID_WORDS_KEY, JSON.stringify([]));
      }
      // not yet ready for a new game
      else {
        setCurrentHash(lastHash);
      }
    }
    // we want this effect to execute only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

    invalidWords.push(word);
    localStorage.setItem(INVALID_WORDS_KEY, JSON.stringify(invalidWords));
  }

  return {
    words,
    hash: currentHash,
    date: config.date,
    ready: gameReady && words.length > 0,
    state,
    setState,
    trackInvalidWord,
  };
}

export function useRemainingTime() {
  const now = new Date();
  const hours = 23 - now.getHours();
  const seconds = 59 - now.getSeconds();
  const minutes = 59 - now.getMinutes();

  const [remainingTime, setRemainingTime] = useState({
    hours,
    minutes,
    seconds,
  });
  const reloadTimeout = useRef(null);

  useEffect(() => {
    const t = setInterval(() => {
      const now = new Date();
      const hours = 23 - now.getHours();
      const minutes = 59 - now.getMinutes();
      const seconds = 59 - now.getSeconds();

      if (
        !reloadTimeout.current &&
        hours === 0 &&
        minutes === 0 &&
        seconds <= 5
      ) {
        reloadTimeout.current = setTimeout(() => {
          window.location.reload();
        }, 1000 * Number(seconds));
      }

      setRemainingTime({ hours, minutes, seconds });
    }, 500);
    return () => clearInterval(t);
  }, []);

  return remainingTime;
}

export function getGameNum(gameDate: string): number {
  return Math.ceil(
    (new Date(gameDate).getTime() - new Date("2022-01-20").getTime()) /
      24 /
      60 /
      60 /
      1000
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
