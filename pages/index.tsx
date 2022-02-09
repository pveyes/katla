import React, { ComponentProps, ComponentRef, useEffect, useRef } from "react";
import { GetStaticProps } from "next";
import { Client } from "@notionhq/client";

import Container from "../components/Container";
import Header from "../components/Header";
import App from "../components/App";
import HelpModal from "../components/HelpModal";
import StatsModal from "../components/StatsModal";
import SettingsModal from "../components/SettingsModal";
import HeadingWithNum from "../components/HeadingWithNum";
import useModalState from "../components/useModalState";

import { useGame, useRemainingTime } from "../utils/game";
import { encodeHashed } from "../utils/codec";
import { GAME_STATS_KEY } from "../utils/constants";
import { GameStats } from "../utils/types";
import fetcher from "../utils/fetcher";
import createStoredState from "../utils/useStoredState";

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
    customHeading: <HeadingWithNum num={game.ready ? game.num : null} />,
    themeColor: game.state.enableHighContrast ? "#f5793a" : "#15803D",
    onShowHelp: () => setModalState("help"),
    onShowStats: () => setModalState("stats"),
    onShowSettings: () => setModalState("settings"),
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

const databaseId = process.env.NOTION_DATABASE_ID;
const notion = new Client({ auth: process.env.NOTION_API_KEY });

export const getStaticProps: GetStaticProps<Props> = async () => {
  const [db, words] = await Promise.all([
    notion.databases.query({
      database_id: databaseId,
      sorts: [
        {
          property: "Date",
          direction: "descending",
        },
      ],
    }),
    fetcher("https://katla.vercel.app/api/words"),
  ]);

  const latestEntry = db.results[0] as any;
  const latestDate = latestEntry.properties.Date.date.start;
  const latestWord = latestEntry.properties.Word.title[0].plain_text;
  const previousEntry = db.results[1] as any;
  const previousDate = previousEntry.properties.Date.date.start;
  const previousWord = previousEntry.properties.Word.title[0].plain_text;

  return {
    props: {
      hashed: encodeHashed(latestWord, latestDate, previousWord, previousDate),
      words: words,
    },
    revalidate: 60,
  };
};
