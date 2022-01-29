import { useEffect, useState } from "react";
import {
  useBroadcastEvent,
  useEventListener,
  useList,
  useOthers,
  useRoom,
  useSelf,
  useUpdateMyPresence,
} from "@liveblocks/react";

import { Game, GameState, LiveConfig, LiveEvent } from "./types";
import { GAME_LIVE_STATE_KEY } from "./constants";
import createStoredState from "./useStoredState";
import LocalStorage, { isStorageEnabled, shareLink } from "./browser";
import { getAnswerStates } from "./game";
import { decode, encode } from "./codec";
import { rainEmoji } from "../components/EmojiRain";
import confetti from "./animation";
import Alert from "../components/Alert";

export interface LiveGameState extends GameState {
  winCount: number;
}

export interface LiveGame extends Game<LiveGameState> {
  start: () => void;
}

const initialState: LiveGameState = {
  answers: Array(6).fill(""),
  attempt: 0,
  winCount: 0,
  lastCompletedDate: null,
  enableHardMode: false,
  enableHighContrast: false,
};

const useGameState = createStoredState<LiveGameState>(GAME_LIVE_STATE_KEY);
export const defaultScore = Array(5).fill(0);

const NEW_GAME_DELAY_MS = 5000;

export function useLiveGame(words: string[]): LiveGame {
  const [state, setState] = useGameState(initialState);
  const [readyState, setGameReadyState] = useState<Game["readyState"]>("init");
  const hashes = useList<string>("hashes", []);
  const [num, setNum] = useState(-1);
  const [hash, setHash] = useState("");
  const updateMyPresence = useUpdateMyPresence();
  const broadcast = useBroadcastEvent();
  const self = useSelf();
  const others = useOthers();
  const room = useRoom();

  useEffect(() => {
    if (isStorageEnabled()) {
      setGameReadyState("ready");
    } else {
      setGameReadyState("no-storage");
      return;
    }
  }, []);

  useEventListener(({ event }: { event: LiveEvent }) => {
    switch (event.type) {
      case "emoji": {
        Alert.show(`Pesan dari: ${event.username}`, { id: "emoji" });
        rainEmoji(event.emoji);
        break;
      }
      case "win": {
        handleWin(event.username);
        break;
      }
      case "lose": {
        handleLose(event.answer);
        break;
      }
      case "start": {
        handleStart();
        break;
      }
    }
  });

  function submitAnswer(answer: string, attempt: number) {
    const scores = getUserScores(answer, hash);

    const totalScore = getTotalScore(scores);
    if (totalScore === 5) {
      room.batch(() => {
        handleWin(self.id);
        broadcast({ type: "win", username: self.id });
        updateMyPresence({ winCount: (self.presence?.winCount ?? 0) + 1 });
      });

      setTimeout(() => {
        room.batch(() => {
          startNewGame();
          handleStart();
        });
      }, NEW_GAME_DELAY_MS);
    }

    const isFailed = attempt === 6 && totalScore !== 5;
    if (isFailed && others.toArray().every((user) => user.presence?.isFailed)) {
      const answer = decode(hash);
      room.batch(() => {
        handleLose(answer);
        broadcast({ type: "lose", answer });
      });

      setTimeout(() => {
        room.batch(() => {
          startNewGame();
          handleStart();
        });
      }, NEW_GAME_DELAY_MS);
    }

    updateMyPresence({ scores, isFailed });
  }

  function handleWin(username: string) {
    confetti();
    Alert.show(
      `Selamat, ${username}!!\nRonde selanjutnya akan dimulai dalam 5 detik`,
      { id: "answer", duration: NEW_GAME_DELAY_MS }
    );
  }

  function handleLose(answer: string) {
    rainEmoji("💀");
    Alert.show(
      `Jawaban: ${answer}.\nRonde selanjutnya akan dimulai dalam 5 detik`,
      { id: "answer", duration: NEW_GAME_DELAY_MS }
    );
  }

  function handleStart() {
    updateMyPresence({ scores: defaultScore, isFailed: false });
    setState((state) => ({
      ...initialState,
      winCount: state.winCount,
    }));
  }

  function startNewGame() {
    const unusedWords = words.filter(
      (word) => !hashes.find((hash) => hash === encode(word))
    );
    const word = unusedWords[Math.floor(Math.random() * unusedWords.length)];

    hashes.push(encode(word));
    broadcast({ type: "start" });
  }

  function resetState() {
    room.batch(() => {
      hashes.clear();
      startNewGame();
      handleStart();
    });
  }

  useEffect(() => {
    if (!hashes) {
      return;
    }

    function handleSubscribe() {
      const hash = hashes.get(hashes.length - 1);
      setNum(hashes.length);
      setHash(hash);
    }

    handleSubscribe();
    const unsubscribe = room.subscribe(hashes, handleSubscribe);
    return () => unsubscribe();
  }, [hashes, room]);

  function start() {
    room.batch(() => {
      startNewGame();
      handleStart();
    });
  }

  useEffect(() => {
    if (!hash) {
      return;
    }

    try {
      const storedState: LiveGameState = JSON.parse(
        LocalStorage.getItem(GAME_LIVE_STATE_KEY)
      );
      if (storedState.attempt > 0 && !self.presence?.scores) {
        const scores = getUserScores(
          storedState.answers[storedState.attempt - 1],
          hash
        );
        const totalScore = getTotalScore(scores);
        const isFailed = storedState.attempt === 6 && totalScore !== 5;
        updateMyPresence({ scores, isFailed, winCount: storedState.winCount });
      }
    } catch (_) {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    hash,
    num,
    ready: readyState === "ready" && !!hashes,
    readyState,
    state,
    setState,
    trackInvalidWord: () => {},
    submitAnswer,
    resetState,
    start,
  };
}

export function generateRoomId(auth: string) {
  const id = "xxxxxxxxxxxxxxxxxxxxx".replace(/[x]/g, () => {
    return ((Math.random() * 16) | 0).toString(16);
  });

  return "kt-" + auth + "-" + id;
}

type Scores = Array<number>;

function getUserScores(answer: string, hash: string): Scores {
  return getAnswerStates(answer, decode(hash)).map((state) => {
    switch (state) {
      case "correct":
        return 1;
      case "exist":
        return 0.5;
      case "wrong":
        return 0;
    }
  });
}

export function getTotalScore(scores: Scores) {
  return scores.reduce((sum, state) => sum + state, 0);
}

export function getEmojiFromScore(
  score: number,
  darkMode: boolean,
  highContrast: boolean
) {
  switch (score) {
    case 0:
      return darkMode ? "⬜️" : "⬛";
    case 1:
      return highContrast ? "🟧" : "🟩";
    case 0.5:
      return highContrast ? "🟦" : "🟨";
  }
}

export function shareInviteLink(config: LiveConfig, cb?: () => void) {
  const host = window.location.protocol + "//" + window.location.host;
  const url = `${host}/lawan?room=${config.roomId}&invite=${config.inviteKey}`;
  shareLink(url, {
    cb,
    clipboardSuccessMessage: "Tautan telah disalin ke clipboard",
  });
}
