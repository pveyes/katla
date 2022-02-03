import { ComponentProps, useState } from "react";
import { GetStaticPaths, GetStaticProps } from "next";
import { Client } from "@notionhq/client";
import { isSameDay, isAfter } from "date-fns";

import Container from "../../components/Container";
import Header from "../../components/Header";
import App from "../../components/App";
import Alert from "../../components/Alert";
import HelpModal from "../../components/HelpModal";
import SettingsModal from "../../components/SettingsModal";
import HeadingWithNum from "../../components/HeadingWithNum";

import { formatDate } from "../../utils/formatter";
import { encode } from "../../utils/codec";
import useGame from "../../utils/useGame";
import { GameStats } from "../../utils/types";

const databaseId = process.env.NOTION_DATABASE_ID;
const notion = new Client({ auth: process.env.NOTION_API_KEY });

interface Props {
  num: string;
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

export default function Arsip(props: Props) {
  const game = useGame(props, false);
  const [stats, setStats] = useState(initialStats);
  const [message, setMessage] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  function showMessage(message: string, cb?: () => void, timeout?: number) {
    setMessage(message);
    setTimeout(() => {
      setMessage(null);
      cb && cb();
    }, timeout ?? 750);
  }

  const headerProps: ComponentProps<typeof Header> = {
    title: `Katla | Arsip #${props.num}`,
    customHeading: <HeadingWithNum num={props.num} />,
    ogImage: "https://katla.vercel.app/og-arsip.png",
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
      {message && <Alert>{message}</Alert>}
      <App
        game={game}
        stats={stats}
        setStats={setStats}
        showMessage={showMessage}
        showStats={() => void 0}
      />
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </Container>
  );
}

export const getStaticPaths: GetStaticPaths = (ctx) => {
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

  const db = await notion.databases.query({
    database_id: databaseId,
    filter: {
      property: "Date",
      type: "date",
      date: {
        equals: formatDate(date),
      },
    },
  });

  const entry = db.results[0] as any;
  return {
    props: {
      num,
      hash: encode(entry.properties.Word.title[0].plain_text),
      date: entry.properties.Date.date.start,
    },
  };
};
