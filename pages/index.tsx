import React, { ComponentProps, ComponentRef, useEffect, useRef } from "react";
import { GetStaticProps } from "next";
import path from "path";
import fs from "fs/promises";

import Container from "../components/Container";
import Header from "../components/Header";
import App from "../components/App";
import HelpModal from "../components/HelpModal";
import StatsModal from "../components/StatsModal";
import SettingsModal from "../components/SettingsModal";
import HeadingWithNum from "../components/HeadingWithNum";
import { useModalState } from "../components/Modal";

import { useGame, useRemainingTime } from "../utils/game";
import { encodeHashed } from "../utils/codec";
import { GAME_STATS_KEY } from "../utils/constants";
import { GameStats } from "../utils/types";
import fetcher from "../utils/fetcher";
import createStoredState from "../utils/useStoredState";
import { handleGameComplete, handleSubmitWord } from "../utils/message";

interface Props {
  hashed: string;
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

const useStats = createStoredState<GameStats>(GAME_STATS_KEY);

export default function Home(props: Props) {
  const remainingTime = useRemainingTime();
  const game = useGame(props.hashed);
  const [stats, setStats] = useStats(initialStats);
  const [modalState, setModalState, resetModalState] = useModalState(
    game,
    stats
  );

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

  const headerProps: ComponentProps<typeof Header> = {
    customHeading: (
      <HeadingWithNum
        num={game.ready ? game.num : null}
        enableLiarMode={game.state.enableLiarMode}
      />
    ),
    themeColor: game.state.enableHighContrast ? "#f5793a" : "#15803D",
    onShowHelp: () => setModalState("help"),
    onShowStats: () => setModalState("stats"),
    onShowSettings: () => setModalState("settings"),
    showLiarOption: game.ready && game.num === 71 && !game.state.enableLiarMode,
  };

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
      <App
        game={game}
        stats={stats}
        setStats={setStats}
        showStats={() => setModalState("stats")}
        words={props.words}
        onSubmit={handleSubmitWord}
        onComplete={handleGameComplete}
      />
      <HelpModal isOpen={modalState === "help"} onClose={resetModalState} />
      <StatsModal
        isOpen={modalState === "stats"}
        onClose={resetModalState}
        game={game}
        stats={stats}
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
  const [answers, words] = await Promise.all([
    fs
      .readFile(path.join(process.cwd(), "./.scripts/answers.csv"), "utf8")
      .then((text) =>
        text
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      ),
    fetcher("https://katla.vercel.app/api/words"),
  ]);

  return {
    props: {
      hashed: encodeHashed(
        answers.length,
        answers[answers.length - 1],
        answers[answers.length - 2]
      ),
      words: words,
    },
    revalidate: 60,
  };
};
