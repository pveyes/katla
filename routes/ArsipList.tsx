import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Container from "../components/Container";
import Header from "../components/Header";
import HelpModal from "../components/HelpModal";
import SettingsModal from "../components/SettingsModal";

import useSWR from "swr";
import fetcher from "../utils/fetcher";
import { initialState, useGamePersistedState } from "../utils/game";
import { Game } from "../utils/types";

export default function ArsipList() {
  const { data } = useSWR<{ nums: number }>("/api/archive", fetcher);
  const nums = data?.nums ?? 0;
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
        ogImage="https://katla.id/og-arsip.png"
        onShowHelp={() => setModalState("help")}
        onShowSettings={() => setModalState("settings")}
      />
      <div className="px-4 mx-auto max-w-lg w-full pt-2 pb-4 text-left">
        <h2 className="text-2xl font-semibold mb-4">Arsip</h2>
        <p className="mb-4">
          Daftar kata yang sudah pernah dipakai. Arsip hanya mencakup hari-hari
          yang sudah lewat dan tidak dapat digunakan untuk melihat masa depan 😌
        </p>
        {nums > 0 && <ArchiveNavigator nums={nums} />}
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

const PAGE_SIZE = 100;
const LATEST_COUNT = 7;

function ArchiveNavigator({ nums }: { nums: number }) {
  const navigate = useNavigate();
  const pageCount = Math.ceil(nums / PAGE_SIZE);
  // open on the newest page since that is what most people look for
  const [page, setPage] = useState(pageCount - 1);
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const num = Number(value);
    if (!Number.isInteger(num) || num < 1 || num > nums) {
      setError(true);
      return;
    }
    navigate(`/arsip/${num}`);
  }

  const latest = Array.from(
    { length: Math.min(LATEST_COUNT, nums) },
    (_, i) => nums - i
  );
  const start = page * PAGE_SIZE + 1;
  const end = Math.min(start + PAGE_SIZE - 1, nums);

  return (
    <>
      <form onSubmit={handleSubmit} className="mb-6">
        <label htmlFor="arsip-num" className="block font-semibold mb-1">
          Lompat ke hari
        </label>
        <div className="flex gap-2">
          <input
            id="arsip-num"
            type="number"
            inputMode="numeric"
            min={1}
            max={nums}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(false);
            }}
            placeholder={`1 - ${nums}`}
            className="flex-1 min-w-0 border border-line-strong rounded-xl px-3 py-2 bg-surface"
          />
          <button
            type="submit"
            className="bg-accent text-white rounded-xl px-4 py-2"
          >
            Buka
          </button>
        </div>
        {error && (
          <p className="text-sm mt-1 text-red-600 dark:text-red-400">
            Masukkan angka antara 1 sampai {nums}
          </p>
        )}
      </form>

      <h3 className="font-semibold mb-2">Terbaru</h3>
      <div className="flex flex-wrap gap-2 mb-6">
        {latest.map((num) => (
          <NumLink key={num} num={num} />
        ))}
      </div>

      <h3 className="font-semibold mb-2">Semua hari</h3>
      <div className="flex flex-wrap gap-2 mb-4">
        {Array.from({ length: pageCount }, (_, i) => {
          const from = i * PAGE_SIZE + 1;
          const to = Math.min(from + PAGE_SIZE - 1, nums);
          return (
            <button
              key={i}
              onClick={() => setPage(i)}
              aria-pressed={i === page}
              className={`text-sm rounded-lg px-2 py-1 border ${
                i === page
                  ? "bg-accent text-white border-transparent"
                  : "border-line-strong"
              }`}
            >
              {from}-{to}
            </button>
          );
        })}
      </div>
      <p className="text-sm mb-2 text-muted">
        Hari ke-{start} sampai {end}
      </p>
      <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
        {Array.from({ length: end - start + 1 }, (_, i) => (
          <NumLink key={start + i} num={start + i} compact />
        ))}
      </div>
    </>
  );
}

function NumLink({ num, compact }: { num: number; compact?: boolean }) {
  return (
    <Link
      to={`/arsip/${num}`}
      className={`block text-center border border-line-strong bg-surface rounded-lg color-accent ${
        compact ? "py-1 text-sm" : "px-3 py-1"
      }`}
    >
      {compact ? num : `#${num}`}
    </Link>
  );
}
