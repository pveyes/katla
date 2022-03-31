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
      <p className="text-center mb-4">
        <a
          href="https://vercel.com?utm_source=katla&utm_campaign=oss"
          className="inline-block"
          title="Powered by Vercel"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="212"
            height="44"
            viewBox="0 0 212 44"
            fill="none"
          >
            <rect width="212" height="44" rx="8" fill="black" />
            <path
              d="M60.4375 15.2266V26.5H61.8438V22.4766H64.6797C66.7969 22.4766 68.3047 20.9844 68.3047 18.875C68.3047 16.7266 66.8281 15.2266 64.6953 15.2266H60.4375ZM61.8438 16.4766H64.3281C65.9609 16.4766 66.8594 17.3281 66.8594 18.875C66.8594 20.3672 65.9297 21.2266 64.3281 21.2266H61.8438V16.4766ZM73.3441 26.6484C75.7425 26.6484 77.2269 24.9922 77.2269 22.2891C77.2269 19.5781 75.7425 17.9297 73.3441 17.9297C70.9456 17.9297 69.4613 19.5781 69.4613 22.2891C69.4613 24.9922 70.9456 26.6484 73.3441 26.6484ZM73.3441 25.4375C71.7503 25.4375 70.8519 24.2812 70.8519 22.2891C70.8519 20.2891 71.7503 19.1406 73.3441 19.1406C74.9378 19.1406 75.8363 20.2891 75.8363 22.2891C75.8363 24.2812 74.9378 25.4375 73.3441 25.4375ZM89.2975 18.0781H87.9459L86.2897 24.8125H86.1647L84.2819 18.0781H82.9928L81.11 24.8125H80.985L79.3288 18.0781H77.9694L80.3288 26.5H81.6881L83.5631 19.9844H83.6881L85.5709 26.5H86.9381L89.2975 18.0781ZM93.8213 19.1172C95.1572 19.1172 96.0478 20.1016 96.0791 21.5938H91.4384C91.54 20.1016 92.4775 19.1172 93.8213 19.1172ZM96.04 24.3203C95.6884 25.0625 94.9541 25.4609 93.8681 25.4609C92.4384 25.4609 91.5088 24.4062 91.4384 22.7422V22.6797H97.4931V22.1641C97.4931 19.5469 96.1103 17.9297 93.8369 17.9297C91.5244 17.9297 90.04 19.6484 90.04 22.2969C90.04 24.9609 91.5009 26.6484 93.8369 26.6484C95.6806 26.6484 96.9931 25.7578 97.3838 24.3203H96.04ZM99.2825 26.5H100.626V21.2812C100.626 20.0938 101.556 19.2344 102.837 19.2344C103.103 19.2344 103.587 19.2812 103.697 19.3125V17.9688C103.525 17.9453 103.243 17.9297 103.025 17.9297C101.908 17.9297 100.939 18.5078 100.689 19.3281H100.564V18.0781H99.2825V26.5ZM108.181 19.1172C109.517 19.1172 110.408 20.1016 110.439 21.5938H105.798C105.9 20.1016 106.838 19.1172 108.181 19.1172ZM110.4 24.3203C110.048 25.0625 109.314 25.4609 108.228 25.4609C106.798 25.4609 105.869 24.4062 105.798 22.7422V22.6797H111.853V22.1641C111.853 19.5469 110.47 17.9297 108.197 17.9297C105.884 17.9297 104.4 19.6484 104.4 22.2969C104.4 24.9609 105.861 26.6484 108.197 26.6484C110.041 26.6484 111.353 25.7578 111.744 24.3203H110.4ZM116.76 26.6484C117.924 26.6484 118.924 26.0938 119.455 25.1562H119.58V26.5H120.861V14.7344H119.518V19.4062H119.4C118.924 18.4844 117.932 17.9297 116.76 17.9297C114.619 17.9297 113.221 19.6484 113.221 22.2891C113.221 24.9375 114.603 26.6484 116.76 26.6484ZM117.072 19.1406C118.596 19.1406 119.549 20.3594 119.549 22.2891C119.549 24.2344 118.603 25.4375 117.072 25.4375C115.533 25.4375 114.611 24.2578 114.611 22.2891C114.611 20.3281 115.541 19.1406 117.072 19.1406ZM131.534 26.6484C133.667 26.6484 135.065 24.9219 135.065 22.2891C135.065 19.6406 133.674 17.9297 131.534 17.9297C130.378 17.9297 129.354 18.5 128.893 19.4062H128.768V14.7344H127.424V26.5H128.706V25.1562H128.831C129.362 26.0938 130.362 26.6484 131.534 26.6484ZM131.221 19.1406C132.76 19.1406 133.674 20.3203 133.674 22.2891C133.674 24.2578 132.76 25.4375 131.221 25.4375C129.69 25.4375 128.737 24.2344 128.737 22.2891C128.737 20.3438 129.69 19.1406 131.221 19.1406ZM137.261 29.5469C138.753 29.5469 139.425 28.9688 140.143 27.0156L143.433 18.0781H142.003L139.698 25.0078H139.573L137.261 18.0781H135.808L138.925 26.5078L138.768 27.0078C138.417 28.0234 137.995 28.3906 137.222 28.3906C137.034 28.3906 136.823 28.3828 136.659 28.3516V29.5C136.847 29.5312 137.081 29.5469 137.261 29.5469ZM154.652 26.5L158.55 15.2266H156.402L153.589 24.1484H153.457L150.621 15.2266H148.394L152.332 26.5H154.652ZM162.668 19.3203C163.832 19.3203 164.598 20.1328 164.637 21.3984H160.613C160.699 20.1484 161.512 19.3203 162.668 19.3203ZM164.652 24.1484C164.371 24.7812 163.707 25.1328 162.746 25.1328C161.473 25.1328 160.652 24.2422 160.605 22.8203V22.7188H166.574V22.0938C166.574 19.3984 165.113 17.7812 162.676 17.7812C160.199 17.7812 158.66 19.5078 158.66 22.2578C158.66 25.0078 160.176 26.6719 162.691 26.6719C164.707 26.6719 166.137 25.7031 166.488 24.1484H164.652ZM168.199 26.5H170.137V21.5625C170.137 20.3672 171.012 19.5859 172.27 19.5859C172.598 19.5859 173.113 19.6406 173.262 19.6953V17.8984C173.082 17.8438 172.738 17.8125 172.457 17.8125C171.356 17.8125 170.434 18.4375 170.199 19.2812H170.067V17.9531H168.199V26.5ZM181.7 20.8281C181.497 19.0312 180.168 17.7812 177.973 17.7812C175.403 17.7812 173.895 19.4297 173.895 22.2031C173.895 25.0156 175.411 26.6719 177.981 26.6719C180.145 26.6719 181.489 25.4688 181.7 23.6797H179.856C179.653 24.5703 178.981 25.0469 177.973 25.0469C176.653 25.0469 175.856 24 175.856 22.2031C175.856 20.4297 176.645 19.4062 177.973 19.4062C179.036 19.4062 179.676 20 179.856 20.8281H181.7ZM186.817 19.3203C187.981 19.3203 188.747 20.1328 188.786 21.3984H184.762C184.848 20.1484 185.661 19.3203 186.817 19.3203ZM188.802 24.1484C188.52 24.7812 187.856 25.1328 186.895 25.1328C185.622 25.1328 184.802 24.2422 184.755 22.8203V22.7188H190.723V22.0938C190.723 19.3984 189.262 17.7812 186.825 17.7812C184.348 17.7812 182.809 19.5078 182.809 22.2578C182.809 25.0078 184.325 26.6719 186.841 26.6719C188.856 26.6719 190.286 25.7031 190.637 24.1484H188.802ZM192.427 26.5H194.364V14.6484H192.427V26.5Z"
              fill="white"
            />
            <path d="M23.3248 13L32.6497 29H14L23.3248 13Z" fill="white" />
            <line
              x1="43.5"
              y1="2.18557e-08"
              x2="43.5"
              y2="44"
              stroke="#5E5E5E"
            />
          </svg>
        </a>
      </p>
      <div>
        <h2 className="text-xl font-semibold">Terdapat Masalah?</h2>
        <Link href="/debug">Laporkan bug</Link>
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
