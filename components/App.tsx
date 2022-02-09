import { useEffect, useRef, useState } from "react";

import Board from "./Board";
import Keyboard from "./Keyboard";

import { GameStats } from "../utils/types";
import { decode } from "../utils/codec";
import { getCongratulationMessage, getFailureMessage } from "../utils/message";
import {
  checkHardModeAnswer,
  Game,
  getAnswerStates,
  verifyStreak,
} from "../utils/game";
import { trackEvent } from "../utils/tracking";
import Alert from "./Alert";

interface Props {
  game: Game;
  stats: GameStats;
  words: string[];
  setStats: (stats: GameStats) => void;
  showStats: () => void;
}

export default function App(props: Props) {
  const { game, stats, setStats, showStats, words } = props;

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
      ...game.state,
      answers: game.state.answers.map((answer, i) => {
        if (i === game.state.attempt && answer.length < 5) {
          return answer + char;
        }

        return answer;
      }),
    });
  }

  function handleBackspace() {
    if (isAnimating.current) {
      return;
    }

    game.setState({
      ...game.state,
      answers: game.state.answers.map((answer, i) => {
        if (i === game.state.attempt) {
          return answer.slice(0, -1);
        }

        return answer;
      }),
    });
  }

  function handleSubmit() {
    if (isAnimating.current) {
      return;
    }

    // ignore submission user already know the answer
    if (
      // already fail
      game.state.attempt === 6 ||
      // already found the answer
      game.state.answers[game.state.attempt - 1] === answer
    ) {
      return;
    }

    const userAnswer = game.state.answers[game.state.attempt];
    if (userAnswer.length < 5) {
      markInvalid();
      Alert.show("Tidak cukup huruf", { id: "answer" });
      return;
    }

    if (!words.includes(userAnswer)) {
      markInvalid();
      Alert.show("Tidak ada dalam KBBI", { id: "answer" });
      game.trackInvalidWord(userAnswer);
      return;
    }

    if (game.state.enableHardMode && game.state.attempt > 0) {
      const [isInvalid, unusedChar, leterIndex] = checkHardModeAnswer(
        game.state,
        answer
      );
      if (isInvalid) {
        markInvalid();
        if (leterIndex) {
          Alert.show(`Huruf ke-${leterIndex} harus ${unusedChar}`, {
            id: "answer",
          });
        } else {
          Alert.show(`Huruf ${unusedChar} harus dipakai`, { id: "answer" });
        }
        return;
      }
    }

    setInvalidAnswer(false);
    game.setState({
      ...game.state,
      answers: game.state.answers.map((answer, i) => {
        if (i === game.state.attempt) {
          return userAnswer;
        }

        return answer;
      }),
      attempt: game.state.attempt + 1,
      lastCompletedDate: game.state.lastCompletedDate,
    });

    isAnimating.current = true;
    setTimeout(() => {
      isAnimating.current = false;

      if (answer === userAnswer) {
        trackEvent("succeed", {
          hash: game.hash,
          attempt: game.state.attempt + 1,
        });
        const isStreak = verifyStreak(game.state.lastCompletedDate);
        let currentStreak = stats.currentStreak + 1;
        if (!isStreak) {
          currentStreak = 1;
        }

        game.setState({
          ...game.state,
          answers: game.state.answers.map((answer, i) => {
            if (i === game.state.attempt) {
              return userAnswer;
            }

            return answer;
          }),
          attempt: game.state.attempt + 1,
          lastCompletedDate: new Date().getTime(),
        });

        setStats({
          distribution: {
            ...stats.distribution,
            [game.state.attempt + 1]:
              stats.distribution[game.state.attempt + 1] + 1,
          },
          currentStreak,
          maxStreak: Math.max(stats.maxStreak, currentStreak),
        });

        const message = getCongratulationMessage(game.state.attempt + 1, stats);
        Alert.show(message, {
          id: "finish",
          duration: 1250,
          cb: showStats,
        });
      } else if (game.state.attempt === 5) {
        trackEvent("failed", { hash: game.hash });
        setStats({
          distribution: {
            ...stats.distribution,
            fail: stats.distribution.fail + 1,
          },
          currentStreak: 0,
          maxStreak: stats.maxStreak,
        });

        const failureMessage = getFailureMessage(
          stats,
          getAnswerStates(game.state.answers[game.state.attempt], answer)
        );
        Alert.show(`${failureMessage}. Jawaban: ${answer}`, {
          id: "finish",
          duration: 1250,
          cb: showStats,
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

  // auto resize board game to fit screen
  useEffect(() => {
    if (!game.ready) {
      return;
    }

    function handleResize() {
      const katla = document.querySelector("#katla") as HTMLDivElement;
      const height =
        window.innerHeight -
        document.querySelector("#header").getBoundingClientRect().height -
        document.querySelector("#keyboard").getBoundingClientRect().height;
      const width = window.innerWidth;
      katla.style.height = Math.min(height, width) + "px";
      katla.style.width = Math.min(height, width) + "px";
    }

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [game.ready]);

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
