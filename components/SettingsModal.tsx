import Link from "next/link";
import Modal from "./Modal";

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
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Modal.Title>Informasi</Modal.Title>
      <p className="mb-4">
        <strong>Katla</strong> merupakan <s>imitasi</s> adaptasi dari{" "}
        <a
          href="https://www.powerlanguage.co.uk/wordle/"
          className="text-green-600 hover:underline"
        >
          Wordle
        </a>
      </p>
      <p>
        <h2 className="text-xl">Terdapat Masalah?</h2>
        <Link href="/debug">
          <a className="text-green-600">Laporkan bug</a>
        </Link>
        <span> atau </span>
        <button onClick={handleReset} className="text-green-600">
          reset sesi sekarang
        </button>
      </p>
    </Modal>
  );
}
