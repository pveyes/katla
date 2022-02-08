import React, {
  ComponentProps,
  ComponentRef,
  useEffect,
  useRef,
  useState,
} from "react";
import { GetStaticProps } from "next";

import Container from "../components/Container";
import Header from "../components/Header";
import App from "../components/App";
import Alert from "../components/Alert";
import HelpModal from "../components/HelpModal";
import StatsModal from "../components/StatsModal";
import SettingsModal from "../components/SettingsModal";
import HeadingWithNum from "../components/HeadingWithNum";

import {
  useGame,
  useRemainingTime,
  getTotalPlay,
  getGameNum,
} from "../utils/game";
import { decode } from "../utils/codec";
import { GAME_STATS_KEY } from "../utils/constants";
import { GameStats } from "../utils/types";
import fetcher from "../utils/fetcher";
import createStoredState from "../utils/useStoredState";

interface Props {
  hash: string;
  date: string;
  words: string[];
}

const initialStats: GameStats = {
  distribution: {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
    fail: 0,
  },
  currentStreak: 0,
  maxStreak: 0,
};

type ModalState = "help" | "stats" | "settings";

const useStats = createStoredState<GameStats>(GAME_STATS_KEY);

export default function Home(props: Props) {
  const remainingTime = useRemainingTime();
  const game = useGame(props);
  const [stats, setStats] = useStats(initialStats);
  const [message, setMessage] = useState(null);

  // modals
  const [modalState, setModalState] = useState<ModalState | null>(null);
  useEffect(() => {
    if (!game.ready) {
      return;
    }

    // show help screen for first-time player
    if (
      getTotalPlay(stats) === 0 &&
      game.state.attempt === 0 &&
      game.state.answers[0] !== ""
    ) {
      setModalState("help");
    }
    // show stats screen if user already finished playing current session
    else if (
      game.state.attempt === 6 ||
      game.state.answers[game.state.attempt - 1] === decode(game.hash)
    ) {
      setModalState("stats");
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.ready]);

  // sync storage
  const iframeRef = useRef<ComponentRef<"iframe">>(null);
  const iframeLoaded = useRef(false);
  useEffect(() => {
    if (game.readyState !== "ready") {
      return;
    }

    if (iframeLoaded.current) {
      iframeRef.current?.contentWindow.postMessage(
        {
          type: "sync-storage",
          gameState: game.state,
          gameStats: stats,
          lastHash: game.hash,
        },
        "*"
      );
    }
  }, [stats, game.state, game.hash, game.readyState]);

  function showMessage(message: string, cb?: () => void, timeout?: number) {
    setMessage(message);
    setTimeout(() => {
      setMessage(null);
      cb && cb();
    }, timeout ?? 750);
  }

  const headerProps: ComponentProps<typeof Header> = {
    customHeading: <HeadingWithNum num={getGameNum(game.date)} />,
    onShowHelp: () => setModalState("help"),
    onShowStats: () => setModalState("stats"),
    onShowSettings: () => setModalState("settings"),
  };

  function resetModalState() {
    (document.activeElement as HTMLElement).blur();
    setModalState(null);
  }

  if (game.readyState === "init") {
    return (
      <Container>
        <Header {...headerProps} />
      </Container>
    );
  }

  return (
    <Container>
      <Header
        {...headerProps}
        warnStorageDisabled={game.readyState === "no-storage"}
      />
      {message && <Alert>{message}</Alert>}
      <App
        game={game}
        stats={stats}
        setStats={setStats}
        showStats={() => setModalState("stats")}
        showMessage={showMessage}
        words={props.words}
      />
      <HelpModal isOpen={modalState === "help"} onClose={resetModalState} />
      <StatsModal
        isOpen={modalState === "stats"}
        onClose={resetModalState}
        game={game}
        stats={stats}
        showMessage={showMessage}
        remainingTime={remainingTime}
      />
      <SettingsModal
        isOpen={modalState === "settings"}
        onClose={resetModalState}
        game={game}
      />
      <iframe
        ref={iframeRef}
        className="hidden"
        src="https://katla.id/sync"
        sandbox="allow-same-origin allow-scripts"
        onLoad={() => {
          if (game.readyState !== "ready") {
            return;
          }

          iframeLoaded.current = true;
          let win;
          try {
            win = iframeRef.current?.contentWindow;
          } catch (err) {
            win = iframeRef.current?.contentWindow;
          }

          win.postMessage(
            {
              type: "sync-storage",
              gameState: game.state,
              gameStats: stats,
              lastHash: game.hash,
            },
            "*"
          );
        }}
      />
    </Container>
  );
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const [{ hash, date }, words] = await Promise.all([
    fetcher("https://katla.vercel.app/api/hash"),
    fetcher("https://katla.vercel.app/api/words"),
  ]);

  return {
    props: {
      hash: hash,
      date: date,
      words: words,
    },
    revalidate: 60,
  };
};
