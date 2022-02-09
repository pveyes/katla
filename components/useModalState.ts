import { useEffect, useState } from "react";
import { Game, getTotalPlay, isGameFinished } from "../utils/game";
import { GameStats } from "../utils/types";

type ModalState = "help" | "stats" | "settings";

type ModalStateReturn = [ModalState, (state: ModalState) => void, () => void];

export default function useModalState(
  game: Game,
  stats: GameStats
): ModalStateReturn {
  const [modalState, setModalState] = useState<ModalState | null>(null);

  useEffect(() => {
    if (!game.ready) {
      return;
    }

    // show help screen for first-time player
    if (
      getTotalPlay(stats) === 0 &&
      game.state.attempt === 0 &&
      game.state.answers[0] !== ""
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
    (document.activeElement as HTMLElement).blur();
    setModalState(null);
  }

  return [modalState, setModalState, resetModalState];
}
