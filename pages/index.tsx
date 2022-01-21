import Head from "next/head";
import { GetStaticProps } from "next";
import React, {
  ComponentRef,
  PropsWithChildren,
  useEffect,
  useRef,
  useState,
} from "react";
import useSWR from "swr";
import createPersistedState from "use-persisted-state";

import Tile from "../components/Tile";
import Keyboard from "../components/Keyboard";
import HelpModal from "../components/HelpModal";
import StatsModal from "../components/StatsModal";
import SettingsModal from "../components/SettingsModal";
import Alert from "../components/Alert";
import { decode, encode } from "../utils/codec";
import { getCongratulationMessage } from "../utils/message";
import { GameState, GameStats } from "../utils/types";
import { getTotalPlay } from "../utils/score";

interface Props {
  hash: string;
  date: string;
}

const initialState: GameState = {
  answers: Array(6).fill(""),
  attempt: 0,
};

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

type PersistedState<T> = (initialState: T) => [T, (newState: T) => void];
const useGameState: PersistedState<GameState> =
  createPersistedState("katla:gameState");
const useStats: PersistedState<GameStats> =
  createPersistedState("katla:gameStats");

const fetcher = (...args: Parameters<typeof fetch>) =>
  fetch(...args).then((res) => res.json());

export default function Home(props: Props) {
  const { hash, date } = props;
  const [mounted, setMounted] = useState(false);
  const [gameState, setGameState] = useGameState(initialState);
  const [stats, setStats] = useStats(initialStats);
  const { data: words = [] } = useSWR("/api/words", fetcher);
  const [message, setMessage] = useState(null);
  const isAnimating = useRef(null);
  const answer = decode(hash);
  const [invalidAnswer, setInvalidAnswer] = useState(false);

  // menu
  const [showHelp, setShowHelp] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    setMounted(true);

    // new game schedule
    const now = new Date();
    const gameDate = new Date(date);
    const lastHash = localStorage.getItem("katla:lastHash");
    if (lastHash !== hash && gameDate.getTime() >= now.getTime()) {
      localStorage.setItem("katla:lastHash", hash);
      setGameState({
        answers: Array(6).fill(""),
        attempt: 0,
      });
    }
  }, [hash, date, setGameState]);

  useEffect(() => {
    if (
      gameState.attempt === 6 ||
      gameState.answers[gameState.attempt - 1] === answer
    ) {
      setShowStats(true);
    } else if (getTotalPlay(stats) === 0) {
      setShowHelp(true);
    }
    // we want this effect to execute once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handlePressChar(char: string) {
    // ignore if already finished
    if (gameState.answers[gameState.attempt - 1] === answer) {
      return;
    }

    if (isAnimating.current) {
      return;
    }

    setGameState({
      answers: gameState.answers.map((answer, i) => {
        if (i === gameState.attempt && answer.length < 5) {
          return answer + char;
        }

        return answer;
      }),
      attempt: gameState.attempt,
    });
  }

  function handleBackspace() {
    if (isAnimating.current) {
      return;
    }

    setGameState({
      answers: gameState.answers.map((answer, i) => {
        if (i === gameState.attempt) {
          return answer.slice(0, -1);
        }

        return answer;
      }),
      attempt: gameState.attempt,
    });
  }

  function handleSubmit() {
    if (isAnimating.current) {
      return;
    }

    // ignore submission if the answer is already correct
    if (gameState.answers[gameState.attempt - 1] === answer) {
      return;
    }

    const userAnswer = gameState.answers[gameState.attempt];
    if (userAnswer.length < 5) {
      markInvalid();
      showMessage("Tidak cukup huruf");
      return;
    }

    if (!words.includes(userAnswer)) {
      markInvalid();
      showMessage("Tidak ada dalam KBBI");
      return;
    }

    setInvalidAnswer(false);
    setGameState({
      answers: gameState.answers.map((answer, i) => {
        if (i === gameState.attempt) {
          return userAnswer;
        }

        return answer;
      }),
      attempt: gameState.attempt + 1,
    });

    isAnimating.current = true;
    setTimeout(() => {
      isAnimating.current = false;

      if (answer === userAnswer) {
        setStats({
          distribution: {
            ...stats.distribution,
            [gameState.attempt + 1]:
              stats.distribution[gameState.attempt + 1] + 1,
          },
          currentStreak: stats.currentStreak + 1,
          maxStreak: Math.max(stats.maxStreak, stats.currentStreak + 1),
        });
        const message = getCongratulationMessage(gameState.attempt);
        showMessage(message, () => {
          setShowStats(true);
        });
      } else if (gameState.attempt === 5) {
        setStats({
          distribution: {
            ...stats.distribution,
            fail: stats.distribution.fail + 1,
          },
          currentStreak: 0,
          maxStreak: stats.maxStreak,
        });

        showMessage(`Jawaban: ${answer}`, () => {
          setShowStats(true);
        });
      }
    }, 400 * 6);
  }

  function markInvalid() {
    setInvalidAnswer(true);
    setTimeout(() => {
      setInvalidAnswer(false);
    }, 600);
  }

  function showMessage(message: string, cb?: () => void) {
    setMessage(message);
    setTimeout(() => {
      setMessage(null);
      cb && cb();
    }, 750);
  }

  const ready = mounted && words.length > 0;

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

  if (!ready) {
    return (
      <Container>
        <Header
          onShowStats={() => setShowStats(true)}
          onShowHelp={() => setShowHelp(true)}
          onShowSetting={() => setShowSettings(true)}
        />
      </Container>
    );
  }

  return (
    <Container>
      <Header
        onShowStats={() => setShowStats(true)}
        onShowHelp={() => setShowHelp(true)}
        onShowSetting={() => setShowSettings(true)}
      />
      <div className="mx-auto max-w-full px-4 flex justify-center items-centerg grow-0 shrink">
        {message && <Alert>{message}</Alert>}
        <div
          className="grid grid-rows-6 gap-1.5 max-w-full"
          style={{ aspectRatio: "1 / 1" }}
          id="katla"
        >
          {Array(6)
            .fill("")
            .map((_, i) => {
              let userAnswer = gameState.answers[i] ?? "";
              userAnswer += " ".repeat(5 - userAnswer.length);

              return (
                <div className="grid grid-cols-5 gap-1.5 relative" key={i}>
                  {userAnswer.split("").map((char, index) => {
                    let state = null;
                    if (i < gameState.attempt) {
                      if (char === answer[index]) {
                        state = "correct";
                      } else if (answer.includes(char)) {
                        state = "exist";
                      } else if (char !== " ") {
                        state = "wrong";
                      }
                    }

                    const isInvalid = invalidAnswer && i === gameState.attempt;
                    return (
                      <React.Fragment key={index}>
                        <Tile
                          key={index}
                          char={char}
                          state={state}
                          isInvalid={isInvalid}
                          delay={300 * index}
                        />
                      </React.Fragment>
                    );
                  })}
                </div>
              );
            })}
        </div>
      </div>
      <Keyboard
        gameState={gameState}
        answer={answer}
        onPressChar={handlePressChar}
        onBackspace={handleBackspace}
        onSubmit={handleSubmit}
        isAnimating={isAnimating}
      />
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
      <StatsModal
        isOpen={showStats}
        onClose={() => setShowStats(false)}
        gameState={gameState}
        stats={stats}
        date={props.date}
        answer={answer}
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
        <title>Katla - Permainan kata harian</title>
        <meta
          name="description"
          content="Tebak kata tersembunyi dalam 6 percobaan. Kata baru tersedia setiap hari."
        />

        <meta property="og:url" content="https://katla.vercel.app/" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Katla - Permainan kata harian" />
        <meta
          property="og:description"
          content="Tebak kata tersembunyi dalam 6 percobaan. Kata baru tersedia setiap hari"
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
