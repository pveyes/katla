import React, { ComponentProps, useEffect } from "react";
import { GetStaticProps } from "next";
import path from "path";
import fs from "fs/promises";
import { useRouter } from "next/router";

import Container from "../components/Container";
import Header from "../components/Header";
import App from "../components/App";
import HelpModal from "../components/HelpModal";
import StatsModal from "../components/StatsModal";
import SettingsModal from "../components/SettingsModal";
import HeadingWithNum from "../components/HeadingWithNum";
import { useModalState } from "../components/Modal";
import SponsorshipFooter from "../components/SponsorshipFooter";

import { useGame, useRemainingTime } from "../utils/game";
import { encodeHashed } from "../utils/codec";
import {
  GAME_STATE_KEY,
  GAME_STATS_KEY,
  LAST_HASH_KEY,
} from "../utils/constants";
import { GameStats, MigrationData } from "../utils/types";
import fetcher from "../utils/fetcher";
import createStoredState from "../utils/useStoredState";
import { handleGameComplete, handleSubmitWord } from "../utils/message";
import LocalStorage from "../utils/browser";
import { trackEvent } from "../utils/tracking";

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

const VALID_STATS_DELAY_MS = 5000;

export default function Home(props: Props) {
  const remainingTime = useRemainingTime();
  const game = useGame(props.hashed);
  const [stats, setStats] = useStats(initialStats);
  const [modalState, setModalState, resetModalState] = useModalState(
    game,
    stats
  );

  const router = useRouter();

  useEffect(() => {
    const migrationData = router.query.migrate;
    if (!migrationData) {
      return;
    }

    let data: MigrationData;
    try {
      data = JSON.parse(decodeURIComponent(migrationData as string));
    } catch (err) {
      trackEvent("invalidMigrationData", { err });
      return;
    }

    const timeDiff = Date.now() - data.time;
    if (timeDiff > VALID_STATS_DELAY_MS) {
      trackEvent("invalidMigrationTime", { timeDiff });
      router.replace("/").then(() => {
        alert("Data gagal dipindahkan");
      });
      return;
    }

    const hasExistingData =
      !!LocalStorage.getItem(GAME_STATE_KEY) ||
      !!LocalStorage.getItem(GAME_STATS_KEY);

    let shouldContinue = true;
    if (hasExistingData) {
      shouldContinue = window.confirm(
        `Kamu sudah memiliki statistik yang tersimpan di katla.id, apakah kamu ingin menggantinya dengan statistik terakhir dari katla.vercel.app?`
      );
    }

    if (!shouldContinue) {
      trackEvent("migrationCancelled", {
        hasExistingData: hasExistingData.toString(),
      });
      router.replace("/");
      return;
    }

    LocalStorage.setItem(GAME_STATS_KEY, JSON.stringify(data.stats));
    LocalStorage.setItem(GAME_STATE_KEY, JSON.stringify(data.state));
    LocalStorage.setItem(LAST_HASH_KEY, data.lastHash);
    game.migrate(data.lastHash, data.state);
    setStats(data.stats);
    setModalState("stats");
    trackEvent("migrationSuccess", {});
    router.replace("/").then(() => {
      alert("Data berhasil dipindahkan");
    });
  }, [router]);

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
      <SponsorshipFooter />
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
    fetcher("https://cdn.statically.io/gh/pveyes/makna/main/words.json"),
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
