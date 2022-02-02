import React, { ComponentProps, useEffect, useState } from "react";
import createPersistedState from "use-persisted-state";
import { GetStaticProps } from "next";

import Container from "../components/Container";
import Header from "../components/Header";
import App from "../components/App";
import Alert from "../components/Alert";
import HelpModal from "../components/HelpModal";
import StatsModal from "../components/StatsModal";
import SettingsModal from "../components/SettingsModal";

import useGame from "../utils/useGame";
import { decode } from "../utils/codec";
import { getTotalPlay } from "../utils/score";
import { GAME_STATS_KEY } from "../utils/constants";
import { GameStats, PersistedState } from "../utils/types";
import useRemainingTime from "../utils/useRemainingTime";
import HeadingWithNum from "../components/HeadingWithNum";
import getGameNum from "../utils/game";

interface Props {
  hash: string;
  date: string;
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

const useStats: PersistedState<GameStats> =
  createPersistedState(GAME_STATS_KEY);

export default function Home(props: Props) {
  const remainingTime = useRemainingTime();
  const game = useGame(props);
  const [stats, setStats] = useStats(initialStats);
  const [message, setMessage] = useState(null);

  // modals
  const [showHelp, setShowHelp] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // modal effect
  useEffect(() => {
    if (!game.ready) {
      return;
    }

    // show help screen for first-time player
    if (getTotalPlay(stats) === 0) {
      setShowHelp(true);
    }
    // show stats screen if user already finished playing current session
    else if (
      game.state.attempt === 6 ||
      game.state.answers[game.state.attempt - 1] === decode(game.hash)
    ) {
      setShowStats(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.ready, game.hash]);

  useEffect(() => {
    // bugfix
    if (game.state.lastCompletedDate && stats.currentStreak === 1) {
      const lastDate = new Date(game.state.lastCompletedDate);
      if (
        (lastDate.getMonth() === 0 && lastDate.getDate() === 31) ||
        (lastDate.getMonth() === 1 && lastDate.getDate() === 1)
      ) {
        setStats({
          ...stats,
          currentStreak: stats.maxStreak + 1,
          maxStreak: stats.maxStreak + 1,
        });
      }
    }
  }, []);

  function showMessage(message: string, cb?: () => void) {
    setMessage(message);
    setTimeout(() => {
      setMessage(null);
      cb && cb();
    }, 750);
  }

  const headerProps: ComponentProps<typeof Header> = {
    customHeading: <HeadingWithNum num={getGameNum(game.date)} />,
    onShowStats: () => setShowStats(true),
    onShowHelp: () => setShowHelp(true),
    onShowSettings: () => setShowSettings(true),
  };

  if (!game.ready) {
    return (
      <Container>
        <Header {...headerProps} />
      </Container>
    );
  }

  return (
    <Container>
      <Header {...headerProps} />
      <p id="msg-info" className="-mt-4 mb-4 text-sm">
        <strong>Penting: </strong>Saat ini Katla sedang dalam proses akuisisi.
        Baca selengkapnya {/* eslint-disable-next-line */}
        <a href="/akuisisi" className="text-green-500 hover:text-green-700">
          di sini
        </a>
      </p>
      {message && <Alert>{message}</Alert>}
      <App
        game={game}
        stats={stats}
        setStats={setStats}
        showStats={() => setShowStats(true)}
        showMessage={showMessage}
      />
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
      <StatsModal
        isOpen={showStats}
        onClose={() => setShowStats(false)}
        game={game}
        stats={stats}
        showMessage={showMessage}
        remainingTime={remainingTime}
      />
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </Container>
  );
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const { hash, date } = await fetch("https://katla.vercel.app/api/hash").then(
    (res) => res.json()
  );
  return {
    props: {
      hash: hash,
      date: date,
    },
    revalidate: 60,
  };
};
