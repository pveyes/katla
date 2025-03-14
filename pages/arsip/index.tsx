import { useState } from "react";

import Container from "../../components/Container";
import Header from "../../components/Header";
import HelpModal from "../../components/HelpModal";
import Link from "../../components/Link";
import SettingsModal from "../../components/SettingsModal";

import { getAllAnswers } from "../../utils/answers";
import { initialState, useGamePersistedState } from "../../utils/game";
import { Game } from "../../utils/types";

export default function Arsip({ nums }) {
  const [modalState, setModalState] = useState(null);
  const [gameState, setGameState] = useGamePersistedState(initialState);
  const game: Game = {
    hash: "",
    num: -1,
    migrate: () => {},
    state: gameState,
    setState: setGameState,
    ready: true,
    readyState: "ready" as const,
    trackInvalidWord: () => {},
  };

  return (
    <Container>
      <Header
        path="/arsip"
        title="Katla | Arsip"
        keywords={[
          "arsip",
          "archive",
          "game",
          "permainan",
          "tebak",
          "kata",
          "rahasia",
          "wordle",
          "indonesia",
          "kbbi",
        ]}
        ogImage="https://katla.vercel.app/og-arsip.png"
        onShowHelp={() => setModalState("help")}
        onShowSettings={() => setModalState("settings")}
      />
      <div className="px-4 mx-auto max-w-lg w-full pt-2 pb-4 text-left">
        <h2 className="text-2xl font-semibold mb-4">Arsip</h2>
        <p className="mb-2">
          Berikut adalah daftar kata telah digunakan sebelumnya. Kamu bisa
          menggunakan <em>link</em> di bawah, atau langsung memasukkan alamat
          pada <em>address bar</em> sesuai angka hari, misal:{" "}
          <a href="https://katla.vercel.app/arsip/1" className="color-accent">
            https://katla.vercel.app/arsip/1
          </a>
        </p>
        <p className="mb-2">
          Arsip hanya mencakup daftar di masa lalu dan tidak dapat digunakan
          untuk melihat masa depan 😌
        </p>
        <ol className="mx-8 list-disc">
          {Array(nums)
            .fill("")
            .map((_, i) => (
              <li key={i}>
                <Link href={`/arsip/${i + 1}`}>{`Hari ke-${i + 1}`}</Link>
              </li>
            ))}
        </ol>
      </div>
      <HelpModal
        isOpen={modalState === "help"}
        onClose={() => setModalState(null)}
      />
      <SettingsModal
        game={game}
        isOpen={modalState === "settings"}
        onClose={() => setModalState(null)}
      />
    </Container>
  );
}

export const getStaticProps = async () => {
  const answers = await getAllAnswers();
  return {
    props: {
      nums: answers.length - 1,
    },
    revalidate: 3600,
  };
};
