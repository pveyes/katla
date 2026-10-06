import { DialogOverlay, DialogContent } from "@reach/dialog";
import { useEffect, useState, ReactNode, useCallback } from "react";

import { getTotalPlay, isGameFinished } from "../utils/game";
import { GameStats, Game } from "../utils/types";

interface Props {
  isOpen: boolean;
  onClose?: () => void;
  children: ReactNode;
}

export default function Modal(props: Props) {
  const { isOpen, onClose, children } = props;
  return (
    <DialogOverlay
      isOpen={isOpen}
      onDismiss={onClose}
      className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm overflow-y-auto z-10"
    >
      <DialogContent aria-labelledby="dialogTitle">
        <div className="bg-surface text-ink border border-line shadow-2xl rounded-2xl w-5/6 max-w-lg absolute top-12 md:top-16 left-6 right-6 mx-auto p-5">
          <button
            onClick={onClose}
            title="close"
            aria-label="close"
            className="icon-btn absolute right-3 top-3"
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
  <h2 id="dialogTitle" className="text-center text-xl font-extrabold my-4">
    {children}
  </h2>
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

  useEffect(() => {
    // reset modal every new game
    setModalState(null);
  }, [game.num]);

  const resetModalState = useCallback(() => {
    setModalState(null);
  }, []);

  return [modalState, setModalState, resetModalState];
}
