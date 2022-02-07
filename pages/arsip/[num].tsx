import { ComponentProps, useState } from "react";
import { GetStaticPaths, GetStaticProps } from "next";
import { Client } from "@notionhq/client";
import { isSameDay, isAfter } from "date-fns";

import Container from "../../components/Container";
import Header from "../../components/Header";
import App from "../../components/App";
import HelpModal from "../../components/HelpModal";
import SettingsModal from "../../components/SettingsModal";
import HeadingWithNum from "../../components/HeadingWithNum";

import { formatDate } from "../../utils/formatter";
import { useGame, isGameFinished } from "../../utils/game";
import { encodeHashed } from "../../utils/codec";
import { GameStats } from "../../utils/types";
import fetcher from "../../utils/fetcher";
import StatsModal from "../../components/StatsModal";
import useModalState from "../../components/useModalState";

const databaseId = process.env.NOTION_DATABASE_ID;
const notion = new Client({ auth: process.env.NOTION_API_KEY });

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

export const getStaticPaths: GetStaticPaths = () => {
  return {
    paths: [],
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

  const [db, words] = await Promise.all([
    notion.databases.query({
      database_id: databaseId,
      filter: {
        property: "Date",
        type: "date",
        date: {
          equals: formatDate(date),
        },
      },
    }),
    fetcher("https://katla.vercel.app/api/words"),
  ]);

  // https://sentry.io/share/issue/c36f4e3f94ee471cb39e194e82c0bf8a/
  if (db.results.length === 0) {
    return {
      notFound: true,
      revalidate: 60,
    };
  }

  const entry = db.results[0] as any;
  return {
    props: {
      num,
      hashed: encodeHashed(
        entry.properties.Word.title[0].plain_text,
        entry.properties.Date.date.start,
        '',
        ''
      ),
      words,
    },
  };
};
