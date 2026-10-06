import { ComponentProps, useState } from "react";
import { useParams } from "react-router-dom";

import App from "../components/App";
import Container from "../components/Container";
import Header from "../components/Header";
import HeadingWithNum from "../components/HeadingWithNum";
import HelpModal from "../components/HelpModal";
import { useModalState } from "../components/Modal";
import SettingsModal from "../components/SettingsModal";
import StatsModal from "../components/StatsModal";

import { isGameFinished, useGame } from "../utils/game";
import { handleGameComplete, handleSubmitWord } from "../utils/message";
import NotFound from "./NotFound";
import { useArchiveHashed, useWords } from "../utils/today";
import { GameStats } from "../utils/types";

interface Props {
  num: string;
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

export default function ArsipGame() {
  const { num } = useParams();
  const { hashed, notFound } = useArchiveHashed(num);
  const words = useWords();

  if (notFound || Number.isNaN(parseInt(num))) {
    return <NotFound />;
  }

  if (!hashed || !words) {
    return (
      <Container>
        <Header title={`Katla | Arsip #${num}`} path={`/arsip/${num}`} />
      </Container>
    );
  }

  return <Archive num={num} hashed={hashed} words={words} />;
}

function Archive(props: Props) {
  const game = useGame(props.hashed, false);
  const [stats, setStats] = useState(initialStats);
  const [modalState, setModalState, resetModalState] = useModalState(
    game,
    stats
  );

  const headerProps: ComponentProps<typeof Header> = {
    title: `Katla | Arsip #${props.num}`,
    customHeading: <HeadingWithNum num={props.num} />,
    path: `/arsip/${props.num}`,
    ogImage: "https://katla.id/og-arsip.png",
    themeColor: game.state.enableHighContrast ? "#f5793a" : "#0F7A43",
    onShowHelp: () => setModalState("help"),
    onShowStats: isGameFinished(game)
      ? () => setModalState("stats")
      : undefined,
    onShowSettings: () => setModalState("settings"),
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
        game={game}
        stats={stats}
        isOpen={modalState === "stats"}
        onClose={resetModalState}
      />
      <SettingsModal
        isOpen={modalState === "settings"}
        onClose={resetModalState}
        game={game}
      />
    </Container>
  );
}
