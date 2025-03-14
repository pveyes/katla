import fs from "fs/promises";
import { GetStaticPaths, GetStaticProps } from "next";
import path from "path";
import { ComponentProps, useState } from "react";

import App from "../../components/App";
import Container from "../../components/Container";
import Header from "../../components/Header";
import HeadingWithNum from "../../components/HeadingWithNum";
import HelpModal from "../../components/HelpModal";
import { useModalState } from "../../components/Modal";
import SettingsModal from "../../components/SettingsModal";
import StatsModal from "../../components/StatsModal";

import { getAllAnswers } from "../../utils/answers";
import { encodeHashed } from "../../utils/codec";
import fetcher from "../../utils/fetcher";
import { isGameFinished, useGame } from "../../utils/game";
import { handleGameComplete, handleSubmitWord } from "../../utils/message";
import { GameStats } from "../../utils/types";

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

export default function Arsip(props: Props) {
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
    ogImage: "https://katla.vercel.app/og-arsip.png",
    themeColor: game.state.enableHighContrast ? "#f5793a" : "#15803D",
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

// generate first and last 5 days
export const getStaticPaths: GetStaticPaths = async () => {
  const answers = await fs
    .readFile(path.join(process.cwd(), "./.scripts/answers.csv"), "utf8")
    .then((text) =>
      text
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    );

  return {
    paths: Array.from({ length: 5 }, (_, i) => ({
      params: { num: `${i + 1}` },
    })).concat(
      Array.from({ length: 5 }, (_, i) => ({
        params: { num: `${answers.length - i + 1}` },
      }))
    ),
    fallback: "blocking",
  };
};

export const getStaticProps: GetStaticProps<Props> = async (ctx) => {
  const num = ctx.params.num as string;
  if (Number.isNaN(parseInt(num))) {
    return {
      notFound: true,
    };
  }

  const numInt = Number(num);

  const [answers, words] = await Promise.all([
    getAllAnswers(),
    fetcher("https://makna.fatihkalifa.workers.dev/words.json"),
  ]);

  // archive should only return previous dates
  if (numInt > answers.length) {
    return {
      notFound: true,
      revalidate: 60,
    };
  }

  return {
    props: {
      num,
      hashed: encodeHashed(numInt, answers[numInt - 1], ""),
      words,
    },
  };
};
