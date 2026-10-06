import * as Sentry from "@sentry/react";
import { ComponentProps, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import App from "../components/App";
import Container from "../components/Container";
import Header from "../components/Header";
import HeadingWithNum from "../components/HeadingWithNum";
import HelpModal from "../components/HelpModal";
import { useModalState } from "../components/Modal";
import SettingsModal from "../components/SettingsModal";
import StatsModal from "../components/StatsModal";

import LocalStorage from "../utils/browser";
import { GAME_STATS_KEY, LAST_HASH_KEY } from "../utils/constants";
import { getTotalPlay, useGame, useRemainingTime } from "../utils/game";
import { handleGameComplete, handleSubmitWord } from "../utils/message";
import { useTodayHashed, useWords } from "../utils/today";
import { trackEvent } from "../utils/tracking";
import { GameStats, MigrationData } from "../utils/types";
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
  duration: null,
};

const useStats = createStoredState<GameStats>(GAME_STATS_KEY);

const VALID_STATS_DELAY_MS = 5000;

export default function Home() {
  const hashed = useTodayHashed();
  const words = useWords();

  if (!hashed || !words) {
    return (
      <Container>
        <Header />
      </Container>
    );
  }

  return <Game hashed={hashed} words={words} />;
}

function Game(props: Props) {
  const remainingTime = useRemainingTime();
  const game = useGame(props.hashed);
  const [stats, setStats] = useStats(initialStats);
  const [modalState, setModalState, resetModalState] = useModalState(
    game,
    stats
  );

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const migrationData = searchParams.get("migrate");
    if (!migrationData) {
      return;
    }

    let data: MigrationData;
    try {
      data = JSON.parse(decodeURIComponent(migrationData));
    } catch (err) {
      Sentry.captureException(err, { extra: { migrationData } });
      return;
    }

    const timeDiff = Date.now() - data.time;
    if (timeDiff > VALID_STATS_DELAY_MS) {
      trackEvent("invalidMigrationTime", { timeDiff });
      navigate("/", { replace: true });
      return;
    }

    const hasExistingData = checkExistingData(data.stats);

    let shouldContinue = true;
    if (hasExistingData) {
      shouldContinue = window.confirm(
        `Kamu sudah memiliki statistik yang tersimpan di katla.id, apakah kamu ingin menggantinya dengan statistik terakhir dari situs lama?`
      );
    }

    if (!shouldContinue) {
      trackEvent("migrationCancelled", {
        hasExistingData: hasExistingData.toString(),
      });
      navigate("/", { replace: true });
      return;
    }

    LocalStorage.setItem(GAME_STATS_KEY, JSON.stringify(data.stats));
    LocalStorage.setItem(LAST_HASH_KEY, data.lastHash);
    setStats(data.stats);
    trackEvent("migrationSuccess", {});
    navigate("/", { replace: true });
    // run once on mount to import the migrated stats
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const headerProps: ComponentProps<typeof Header> = {
    customHeading: (
      <HeadingWithNum
        num={game.ready ? game.num : null}
        enableLiarMode={game.state.enableLiarMode}
      />
    ),
    themeColor: game.state.enableHighContrast ? "#f5793a" : "#0F7A43",
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
    </Container>
  );
}

const checkExistingData = (newStats: GameStats) => {
  if (!LocalStorage.getItem(GAME_STATS_KEY)) {
    return false;
  }

  try {
    const currentStats: GameStats = JSON.parse(
      LocalStorage.getItem(GAME_STATS_KEY) as string
    );
    const totalPlay = getTotalPlay(currentStats);
    const newTotalPlay = getTotalPlay(newStats);
    if (totalPlay !== newTotalPlay) {
      return true;
    }

    if (currentStats.maxStreak !== newStats.maxStreak) {
      return true;
    }

    if (currentStats.currentStreak !== newStats.currentStreak) {
      return true;
    }

    for (const v in currentStats.distribution) {
      if (currentStats.distribution[v] !== newStats.distribution[v]) {
        return true;
      }
    }

    return false;
  } catch (err) {
    return false;
  }
};
