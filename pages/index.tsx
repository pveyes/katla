import Head from "next/head";
import React, {
  ComponentProps,
  PropsWithChildren,
  useEffect,
  useState,
} from "react";
import useSWR from "swr";
import createPersistedState from "use-persisted-state";
import { GetStaticProps } from "next";

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
import fetcher from "../utils/fetcher";

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
  const { state, setState, gameReady, currentHash } = useGame(props);
  const [stats, setStats] = useStats(initialStats);
  const [message, setMessage] = useState(null);
  const { data: words = [] } = useSWR("/api/words", fetcher);

  // modals
  const [showHelp, setShowHelp] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // modal effect
  useEffect(() => {
    if (!gameReady) {
      return;
    }

    // show help screen for first-time player
    if (getTotalPlay(stats) === 0) {
      setShowHelp(true);
    }
    // show stats screen if user already finished playing current session
    else if (
      state.attempt === 6 ||
      state.answers[state.attempt - 1] === decode(currentHash)
    ) {
      setShowStats(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameReady, currentHash]);

  const ready = gameReady && words.length > 0;

  // auto resize board game to fit screen
  useEffect(() => {
    if (!ready) {
      return;
    }

    function handleResize() {
      const katla = document.querySelector("#katla") as HTMLDivElement;
      const height =
        window.innerHeight -
        document.querySelector("#header").getBoundingClientRect().height -
        document.querySelector("#keyboard").getBoundingClientRect().height;
      const width = window.innerWidth;
      katla.style.height = Math.min(height, width) + "px";
      katla.style.width = Math.min(height, width) + "px";
    }

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [ready]);

  function showMessage(message: string, cb?: () => void) {
    setMessage(message);
    setTimeout(() => {
      setMessage(null);
      cb && cb();
    }, 750);
  }

  const headerProps: ComponentProps<typeof Header> = {
    onShowStats: () => setShowStats(true),
    onShowHelp: () => setShowHelp(true),
    onShowSetting: () => setShowSettings(true),
  };

  if (!ready) {
    return (
      <Container>
        <Header {...headerProps} />
      </Container>
    );
  }

  return (
    <Container>
      <Header {...headerProps} />
      {message && <Alert>{message}</Alert>}
      <App
        hash={currentHash}
        gameState={state}
        setGameState={setState}
        stats={stats}
        setStats={setStats}
        showStats={() => setShowStats(true)}
        showMessage={showMessage}
        words={words}
      />
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
      <StatsModal
        isOpen={showStats}
        onClose={() => setShowStats(false)}
        gameState={state}
        stats={stats}
        date={props.date}
        hash={currentHash}
        showMessage={showMessage}
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

function Container(props: PropsWithChildren<{}>) {
  return (
    <div className="h-screen text-white text-center flex flex-col items-stretch overflow-y-hidden">
      {props.children}
    </div>
  );
}

function Header({ onShowStats, onShowHelp, onShowSetting }) {
  return (
    <header className="px-4 mx-auto max-w-lg w-full pt-2 pb-4" id="header">
      <Head>
        <title>Katla - Permainan Kata | 1 Hari 1 Kata 6 Kesempatan</title>
        <meta
          name="description"
          content="Tebak kata rahasia dalam 6 percobaan. Kata baru tersedia setiap hari."
        />
        <meta
          name="keywords"
          content="game, permainan, tebak, kata, rahasia, wordle, indonesia, kbbi"
        />
        <meta property="og:url" content="https://katla.vercel.app/" />
        <meta property="og:type" content="website" />
        <meta
          property="og:title"
          content="Katla - Permainan Kata | 1 Hari 1 Kata 6 Kesempatan"
        />
        <meta
          property="og:description"
          content="Tebak kata rahasia dalam 6 percobaan. Kata baru tersedia setiap hari"
        />
        <meta
          property="og:keywords"
          content="game, permainan, tebak, kata, rahasia, wordle, indonesia, kbbi"
        />
        <meta property="og:image" content="https://katla.vercel.app/og.png" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta property="twitter:domain" content="katla.vercel.app" />

        <meta name="theme-color" content="#15803D" />
        <link href="/katla-32x32.png" rel="icon shortcut" sizes="3232" />
        <link href="/katla-192x192.png" rel="apple-touch-icon" />
      </Head>
      <div className="border-b border-b-gray-700 relative text-gray-500">
        <h1
          className="uppercase text-4xl text-gray-200 font-bold w-max mx-auto relative z-10"
          style={{ letterSpacing: 4 }}
        >
          Katla
        </h1>
        <div className="absolute flex flex-row items-center justify-between inset-0">
          <button onClick={onShowHelp} title="Bantuan" aria-label="Pengaturan">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24"
              viewBox="0 0 24 24"
              width="24"
            >
              <path
                fill="currentColor"
                d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"
              ></path>
            </svg>
          </button>
          <div className="flex gap-2">
            <button
              onClick={onShowStats}
              title="Statistik"
              aria-label="Statistik"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24"
                viewBox="0 0 24 24"
                width="24"
              >
                <path
                  fill="currentColor"
                  d="M16,11V3H8v6H2v12h20V11H16z M10,5h4v14h-4V5z M4,11h4v8H4V11z M20,19h-4v-6h4V19z"
                ></path>
              </svg>
            </button>
            <button
              onClick={onShowSetting}
              title="Pengaturan"
              aria-label="Pengaturan"
            >
              <svg
                viewBox="0 0 24 24"
                width="24"
                height="24"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
