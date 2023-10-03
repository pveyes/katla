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
import { ForcedResult, Game, LiveConfig } from "../utils/types";
import { shareInviteLink } from "../utils/liveGame";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  game: Game;
  liveConfig?: LiveConfig;
}

export default function SettingsModal(props: Props) {
  const { game, isOpen, onClose, liveConfig } = props;
  const { resolvedTheme, setTheme } = useTheme();
  const showLiarMode = game.num === 71;
  const correctColor = game.state.enableHighContrast ? "biru" : "hijau";
  const incorrectColor = game.state.enableHighContrast ? "oranye" : "kuning";

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Modal.Title>Pengaturan</Modal.Title>
      {game.num !== -1 && (
        <Switch
          title="Mode Sulit"
          subtitle="Semua petunjuk dari jawaban sebelumnya harus digunakan"
          onlyEnableOnFirstAttempt
          attempt={game.state.attempt}
          active={game.state.enableHardMode}
          onChange={(enableHardMode) => {
            game.setState({ ...game.state, enableHardMode });
          }}
        />
      )}
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
      <Switch
        title="Mode Edit Bebas"
        subtitle="Hapus huruf di kotak manapun dan lewati kotak dengan karakter '_'"
        isExperimental
        active={game.state.enableFreeEdit}
        onChange={(enableFreeEdit) => {
          game.setState({ ...game.state, enableFreeEdit });
        }}
      />
      {showLiarMode && (
        <Switch
          title="Mode Bohong"
          subtitle={`Setiap baris terdapat 1 kotak acak yang belum tentu mencerminkan petunjuk seharusnya (misal ${correctColor} menjadi ${incorrectColor})`}
          onlyEnableOnFirstAttempt
          attempt={game.state.attempt}
          active={game.state.enableLiarMode}
          onChange={(enableLiarMode) => {
            game.setState({
              ...game.state,
              enableLiarMode,
              lieBoxes: generateLieBoxes(),
            });
          }}
        />
      )}
      {liveConfig ? (
        liveConfig.isHost ? (
          <AdminTools config={liveConfig} game={game} onClose={onClose} />
        ) : (
          <PlayerTools config={liveConfig} />
        )
      ) : (
        <AdditionalInformation />
      )}
    </Modal>
  );
}

interface AdminToolsProps {
  game: Game;
  onClose: () => void;
  config: LiveConfig;
}

function AdminTools(props: AdminToolsProps) {
  const { game, onClose, config } = props;

  function handleReset() {
    game.resetState();
    onClose();
  }

  function handleInvite() {
    shareInviteLink(config, onClose);
  }

  return (
    <div>
      <h4 className="text-center uppercase font-semibold my-4">Mode Lawan</h4>
      <button className="color-accent block mb-2" onClick={handleInvite}>
        Ajak pemain
      </button>
      <button className="color-accent block mb-2" onClick={handleReset}>
        Mulai dari awal
      </button>
    </div>
  );
}

interface PlayerToolsProps {
  config: LiveConfig;
}

function PlayerTools(props: PlayerToolsProps) {
  const { config } = props;

  function handleInvite() {
    shareInviteLink(config);
  }

  return (
    <div>
      <h4 className="text-center uppercase font-semibold my-4">
        Pengaturan Mode Lawan
      </h4>
      <button className="color-accent" onClick={handleInvite}>
        Ajak pemain
      </button>
    </div>
  );
}

function AdditionalInformation() {
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

  return (
    <>
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
        <Link href="/bantuan">Bantuan</Link>
        <span> atau </span>
        <button onClick={handleReset} className="color-accent">
          reset sesi sekarang
        </button>
      </div>
    </>
  );
}

interface SwitchProps {
  active: boolean;
  title: string;
  subtitle?: string;
  onlyEnableOnFirstAttempt?: boolean;
  attempt?: number;
  isExperimental?: boolean;
  onChange: (active: boolean) => void;
}

function Switch(props: SwitchProps) {
  const {
    title,
    subtitle,
    isExperimental,
    active,
    onChange,
    onlyEnableOnFirstAttempt,
    attempt,
  } = props;

  const disabled = onlyEnableOnFirstAttempt && attempt > 0;
  const disabledText = `${title} hanya dapat diganti di awal permainan`;
  const warningText = onlyEnableOnFirstAttempt
    ? `Hanya dapat diganti di awal permainan`
    : isExperimental
    ? "Masih dalam tahap uji coba"
    : "";

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
        <p className="mb-0">
          {title}{" "}
          {warningText && (
            <span className="text-xs text-yellow-600 dark:text-yellow-400 inline-block">
              {"(" + warningText + ")"}
            </span>
          )}
        </p>
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

function generateLieBoxes(): ForcedResult[] {
  // only 5 because we want the last one to show the real answer
  return Array(5)
    .fill(0)
    .map(() => {
      const isExist = Math.random() > 0.35;
      const isCorrect = Math.random() > 0.5;
      const col = Math.floor(Math.random() * 5);
      return isExist ? (isCorrect ? [col, "c"] : [col, "e"]) : [col, "w"];
    });
}
