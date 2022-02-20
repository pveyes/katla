import { DialogOverlay, DialogContent } from "@reach/dialog";
import { useEffect, useState } from "react";

import { Game, getTotalPlay, isGameFinished } from "../utils/game";
import { GameStats } from "../utils/types";

export default function Modal({ isOpen, onClose, children }) {
  return (
    <DialogOverlay
      isOpen={isOpen}
      onDismiss={onClose}
      className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto z-10"
    >
      <DialogContent>
        <div className="dark:bg-gray-900 bg-white dark:text-gray-200 text-gray-900 w-5/6 max-w-lg absolute top-12 md:top-16 left-6 right-6 mx-auto p-4">
          <button
            onClick={onClose}
            title="close"
            aria-label="close"
            className="absolute right-4 top-4 text-gray-500"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24"
              viewBox="0 0 24 24"
              width="24"
            >
              <path
                fill="currentColor"
                d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
              ></path>
            </svg>
          </button>
          {children}
        </div>
      </DialogContent>
    </DialogOverlay>
  );
}

const Title = ({ children }) => (
  <h2 className="text-center uppercase font-semibold my-4">{children}</h2>
);
Modal.Title = Title;

type ModalState = "help" | "stats" | "settings";

type ModalStateReturn = [ModalState, (state: ModalState) => void, () => void];

export function useModalState(game: Game, stats: GameStats): ModalStateReturn {
  const [modalState, setModalState] = useState<ModalState | null>(null);

  useEffect(() => {
    if (!game.ready) {
      return;
    }

    // show help screen for first-time player
    if (
      getTotalPlay(stats) === 0 &&
      game.state.attempt === 0 &&
      game.state.answers[0] === ""
    ) {
      setModalState("help");
    }
    // show stats screen if user already finished playing current session
    else if (isGameFinished(game)) {
      setModalState("stats");
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.ready]);

  function resetModalState() {
    setModalState(null);
  }

  return [modalState, setModalState, resetModalState];
}
