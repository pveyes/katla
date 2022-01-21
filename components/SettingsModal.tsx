import Modal from "./Modal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal(props: Props) {
  // TODO: feature parity with wordle
  const { isOpen, onClose } = props;
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Modal.Title>Informasi</Modal.Title>
      <p>
        <strong>Katla</strong> merupakan <s>imitasi</s> adaptasi dari{" "}
        <a
          href="https://www.powerlanguage.co.uk/wordle/"
          className="text-green-600 hover:underline"
        >
          Wordle
        </a>
      </p>
    </Modal>
  );
}
