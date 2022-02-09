import { useTheme } from "next-themes";

import Link from "./Link";
import Modal from "./Modal";
import Alert from "./Alert";

import {
  GAME_STATE_KEY,
  GAME_STATS_KEY,
  INVALID_WORDS_KEY,
  LAST_HASH_KEY,
  LAST_SESSION_RESET_KEY,
} from "../utils/constants";
import LocalStorage from "../utils/browser";
import { Game } from "../utils/game";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  game: Game;
}

export default function SettingsModal(props: Props) {
  function handleReset() {
    LocalStorage.removeItem(GAME_STATE_KEY);
    LocalStorage.removeItem(GAME_STATS_KEY);
    LocalStorage.removeItem(INVALID_WORDS_KEY);
    LocalStorage.removeItem(LAST_HASH_KEY);
    LocalStorage.setItem(
      LAST_SESSION_RESET_KEY,
      new Date().getTime().toString()
    );
    window.location.reload();
  }

  const { game, isOpen, onClose } = props;
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Modal.Title>Pengaturan</Modal.Title>
      <Switch
        title="Mode Sulit"
        subtitle="Semua petunjuk dari jawaban sebelumnya harus digunakan"
        disabled={game.state.attempt > 0}
        disabledText={"Mode sulit hanya dapat diganti di awal permainan"}
        active={game.state.enableHardMode}
        onChange={(enableHardMode) => {
          game.setState({ ...game.state, enableHardMode });
        }}
      />
      <Switch
        title="Mode Gelap"
        active={resolvedTheme === "dark"}
        onChange={(active) => {
          setTheme(active ? "dark" : "light");
        }}
      />
      <Switch
        title="Mode Buta Warna"
        subtitle="Warna kontras tinggi"
        active={game.state.enableHighContrast}
        onChange={(enableHighContrast) => {
          game.setState({ ...game.state, enableHighContrast });
        }}
      />
      <h4 className="text-center uppercase font-semibold my-4">Informasi</h4>
      <p className="mb-4">
        <strong>Katla</strong> merupakan <s>imitasi</s> adaptasi dari{" "}
        <a
          href="https://www.powerlanguage.co.uk/wordle/"
          className="color-accent"
        >
          Wordle
        </a>
      </p>
      <p className="mb-4">
        Kamu bisa melihat daftar kata yang telah digunakan sebelumnya di dalam{" "}
        <Link href="/arsip">Arsip</Link>
      </p>
      <div>
        <h2 className="text-xl font-semibold">Terdapat Masalah?</h2>
        <Link href="/debug">Laporkan bug</Link>
        <span> atau </span>
        <button onClick={handleReset} className="color-accent">
          reset sesi sekarang
        </button>
      </div>
    </Modal>
  );
}

interface SwitchProps {
  active: boolean;
  title: string;
  subtitle?: string;
  disabled?: boolean;
  disabledText?: string;
  onChange: (active: boolean) => void;
}

function Switch(props: SwitchProps) {
  const { title, subtitle, disabled, disabledText, active, onChange } = props;

  function handleClick() {
    if (disabled) {
      Alert.show(disabledText, { id: "disabled" });
      return;
    }

    onChange(!active);
  }

  return (
    <div className="flex justify-between py-2 my-2 text-lg items-center border-b border-gray-200 dark:border-gray-700 space-x-2">
      <div className="flex flex-col">
        <p className="mb-0">{title}</p>
        {subtitle && <span className="text-xs text-gray-500">{subtitle}</span>}
      </div>
      <button
        className={`${
          active ? "bg-correct" : "bg-gray-500"
        } w-10 h-6 flex items-center rounded-full px-1 flex-shrink-0`}
        onClick={handleClick}
        style={{ cursor: disabled ? "not-allowed" : "pointer" }}
      >
        <div
          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition ${
            active ? "translate-x-4" : ""
          }`}
        ></div>
      </button>
    </div>
  );
}
