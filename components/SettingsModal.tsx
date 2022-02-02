import Link from "./Link";
import Modal from "./Modal";
import { useTheme } from "next-themes";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

// TODO: feature parity with wordle
export default function SettingsModal(props: Props) {
  function handleReset() {
    localStorage.removeItem("katla:gameState");
    localStorage.removeItem("katla:gameStats");
    localStorage.removeItem("katla:lastHash");
    window.location.reload();
  }

  const { isOpen, onClose } = props;
  const { theme, setTheme } = useTheme();

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Modal.Title>Informasi</Modal.Title>
      <p className="mb-4">
        <strong>Katla</strong> merupakan <s>imitasi</s> adaptasi dari{" "}
        <a
          href="https://www.powerlanguage.co.uk/wordle/"
          className="text-green-600 hover:text-green-700"
        >
          Wordle
        </a>
      </p>
      <p className="mb-4">
        Kamu bisa melihat daftar kata yang telah digunakan sebelumnya di dalam{" "}
        <Link href="/arsip">
          <a className="text-green-600 hover:text-green-700">Arsip</a>
        </Link>
      </p>
      <div className="flex justify-between py-2 my-2 text-lg items-center border-b border-t border-gray-500">
        <p>Dark Theme</p>
        <div
          className={`${
            theme === "dark" ? "dark:bg-green-600 " : ""
          } w-10 h-6 flex items-center bg-gray-500 rounded-full px-1`}
          onClick={
            theme === "dark" ? () => setTheme("white") : () => setTheme("dark")
          }
        >
          <div
            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition ${
              theme === "dark" ? "translate-x-4" : ""
            }`}
          ></div>
        </div>
      </div>
      <p>
        <h2 className="text-xl font-semibold">Terdapat Masalah?</h2>
        <Link href="/debug">Laporkan bug</Link>
        <span> atau </span>
        <button
          onClick={handleReset}
          className="text-green-600 hover:text-green-700"
        >
          reset sesi sekarang
        </button>
      </p>
    </Modal>
  );
}
