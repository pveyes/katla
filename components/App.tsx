import { useRef, useState } from "react";

import Board from "./Board";
import Keyboard from "./Keyboard";

import { GameState, GameStats } from "../utils/types";
import { decode } from "../utils/codec";
import { getCongratulationMessage } from "../utils/message";
import { getTotalPlay } from "../utils/score";

interface Props {
  hash: string;
  gameState: GameState;
  setGameState: (gameState: GameState) => void;
  stats: GameStats;
  setStats: (stats: GameStats) => void;
  showMessage: (message: string, cb?: () => void) => void;
  showStats: () => void;
  words: string[];
}

export default function App(props: Props) {
  const {
    hash,
    gameState,
    setGameState,
    stats,
    setStats,
    showMessage,
    showStats,
    words,
  } = props;

  const [invalidAnswer, setInvalidAnswer] = useState(false);
  const isAnimating = useRef(null);

  const answer = decode(hash);

  function handlePressChar(char: string) {
    // ignore if already finished
    if (gameState.answers[gameState.attempt - 1] === answer) {
      return;
    }

    if (isAnimating.current) {
      return;
    }

    setGameState({
      answers: gameState.answers.map((answer, i) => {
        if (i === gameState.attempt && answer.length < 5) {
          return answer + char;
        }

        return answer;
      }),
      attempt: gameState.attempt,
    });
  }

  function handleBackspace() {
    if (isAnimating.current) {
      return;
    }

    setGameState({
      answers: gameState.answers.map((answer, i) => {
        if (i === gameState.attempt) {
          return answer.slice(0, -1);
        }

        return answer;
      }),
      attempt: gameState.attempt,
    });
  }

  function handleSubmit() {
    if (isAnimating.current) {
      return;
    }

    // ignore submission if the answer is already correct
    if (gameState.answers[gameState.attempt - 1] === answer) {
      return;
    }

    const userAnswer = gameState.answers[gameState.attempt];
    if (userAnswer.length < 5) {
      markInvalid();
      showMessage("Tidak cukup huruf");
      return;
    }

    if (!words.includes(userAnswer)) {
      markInvalid();
      showMessage("Tidak ada dalam KBBI");
      return;
    }

    setInvalidAnswer(false);
    setGameState({
      answers: gameState.answers.map((answer, i) => {
        if (i === gameState.attempt) {
          return userAnswer;
        }

        return answer;
      }),
      attempt: gameState.attempt + 1,
    });

    isAnimating.current = true;
    setTimeout(() => {
      isAnimating.current = false;

      if (answer === userAnswer) {
        setStats({
          distribution: {
            ...stats.distribution,
            [gameState.attempt + 1]:
              stats.distribution[gameState.attempt + 1] + 1,
          },
          currentStreak: stats.currentStreak + 1,
          maxStreak: Math.max(stats.maxStreak, stats.currentStreak + 1),
        });
        const message = getCongratulationMessage(
          gameState.attempt,
          getTotalPlay(stats)
        );
        showMessage(message, () => {
          showStats();
        });
      } else if (gameState.attempt === 5) {
        setStats({
          distribution: {
            ...stats.distribution,
            fail: stats.distribution.fail + 1,
          },
          currentStreak: 0,
          maxStreak: stats.maxStreak,
        });

        showMessage(`Jawaban: ${answer}`, () => {
          showStats();
        });
      }
    }, 400 * 6);
  }

  function markInvalid() {
    setInvalidAnswer(true);
    setTimeout(() => {
      setInvalidAnswer(false);
    }, 600);
  }

  return (
    <>
      <div className="mx-auto max-w-full px-4 flex justify-center items-centerg grow-0 shrink">
        <Board
          hash={hash}
          gameState={gameState}
          invalidAnswer={invalidAnswer}
        />
      </div>
      <Keyboard
        gameState={gameState}
        hash={hash}
        onPressChar={handlePressChar}
        onBackspace={handleBackspace}
        onSubmit={handleSubmit}
        isAnimating={isAnimating}
      />
    </>
  );
}
