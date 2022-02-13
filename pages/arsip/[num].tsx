import { ComponentProps, useState } from "react";
import { GetStaticPaths, GetStaticProps } from "next";
import { isSameDay, isAfter } from "date-fns";
import fs from "fs/promises";
import path from "path";

import Container from "../../components/Container";
import Header from "../../components/Header";
import App from "../../components/App";
import HelpModal from "../../components/HelpModal";
import SettingsModal from "../../components/SettingsModal";
import HeadingWithNum from "../../components/HeadingWithNum";

import { useGame, isGameFinished } from "../../utils/game";
import { encodeHashed } from "../../utils/codec";
import { GameStats } from "../../utils/types";
import fetcher from "../../utils/fetcher";
import StatsModal from "../../components/StatsModal";
import useModalState from "../../components/useModalState";

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

  const now = new Date();
  const date = new Date("2022-01-20");
  date.setDate(date.getDate() + parseInt(num));

  // archive should only return previous dates
  if (isSameDay(date, now) || isAfter(date, now)) {
    return {
      notFound: true,
      revalidate: 60,
    };
  }

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
      num,
      hashed: encodeHashed(answers.length, answers[answers.length - 1], ""),
      words,
    },
  };
};
