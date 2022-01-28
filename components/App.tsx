import { useRef, useState } from "react";

import Board from "./Board";
import Keyboard from "./Keyboard";

import { GameStats } from "../utils/types";
import { decode } from "../utils/codec";
import { getCongratulationMessage } from "../utils/message";
import { getTotalPlay } from "../utils/score";
import { Game } from "../utils/useGame";

interface Props {
  game: Game;
  stats: GameStats;
  setStats: (stats: GameStats) => void;
  showMessage: (message: string, cb?: () => void) => void;
  showStats: () => void;
  words: string[];
}

export default function App(props: Props) {
  const { game, stats, setStats, showMessage, showStats, words } = props;

  const [invalidAnswer, setInvalidAnswer] = useState(false);
  const isAnimating = useRef(null);

  const answer = decode(game.hash);

  function handlePressChar(char: string) {
    // ignore if already finished
    if (game.state.answers[game.state.attempt - 1] === answer) {
      return;
    }

    if (isAnimating.current) {
      return;
    }

    game.setState({
      answers: game.state.answers.map((answer, i) => {
        if (i === game.state.attempt && answer.length < 5) {
          return answer + char;
        }

        return answer;
      }),
      attempt: game.state.attempt,
    });
  }

  function handleBackspace() {
    if (isAnimating.current) {
      return;
    }

    game.setState({
      answers: game.state.answers.map((answer, i) => {
        if (i === game.state.attempt) {
          return answer.slice(0, -1);
        }

        return answer;
      }),
      attempt: game.state.attempt,
    });
  }

  function handleSubmit() {
    if (isAnimating.current) {
      return;
    }

    // ignore submission if the answer is already correct
    if (game.state.answers[game.state.attempt - 1] === answer) {
      return;
    }

    const userAnswer = game.state.answers[game.state.attempt];
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
    game.setState({
      answers: game.state.answers.map((answer, i) => {
        if (i === game.state.attempt) {
          return userAnswer;
        }

        return answer;
      }),
      attempt: game.state.attempt + 1,
    });

    isAnimating.current = true;
    setTimeout(() => {
      isAnimating.current = false;

      if (answer === userAnswer) {
        setStats({
          distribution: {
            ...stats.distribution,
            [game.state.attempt + 1]:
              stats.distribution[game.state.attempt + 1] + 1,
          },
          currentStreak: stats.currentStreak + 1,
          maxStreak: Math.max(stats.maxStreak, stats.currentStreak + 1),
        });
        const message = getCongratulationMessage(
          game.state.attempt,
          getTotalPlay(stats)
        );
        showMessage(message, () => {
          showStats();
        });
      } else if (game.state.attempt === 5) {
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
          hash={game.hash}
          gameState={game.state}
          invalidAnswer={invalidAnswer}
        />
      </div>
      <Keyboard
        gameState={game.state}
        hash={game.hash}
        onPressChar={handlePressChar}
        onBackspace={handleBackspace}
        onSubmit={handleSubmit}
        isAnimating={isAnimating}
      />
    </>
  );
}
