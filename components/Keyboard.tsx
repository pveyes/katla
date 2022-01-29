import { MutableRefObject, useEffect, useRef } from "react";

import KeyboardButton from "./KeyboardButton";
import { GameState } from "../utils/types";
import { decode } from "../utils/codec";

interface Props {
  onPressChar: (char: string) => void;
  onBackspace: () => void;
  onSubmit: () => void;
  gameState: GameState;
  hash: string;
  isAnimating: MutableRefObject<boolean>;
}

export default function Keyboard(props: Props) {
  const { onPressChar, onBackspace, onSubmit, gameState, hash, isAnimating } =
    props;
  const answer = decode(hash);
  const usedChars = new Set(
    gameState.answers
      .slice(0, gameState.attempt)
      .map((answer) => answer.split(""))
      .flat()
  );

  const correctChars = new Set();
  gameState.answers.forEach((userAnswer, i) => {
    if (i < gameState.attempt) {
      userAnswer.split("").forEach((char, j) => {
        if (answer[j] === char) {
          correctChars.add(char);
        }
      });
    }
  });

  function getKeyboardState(char: string) {
    let state = null;
    if (correctChars.has(char)) {
      state = "correct";
    } else if (usedChars.has(char) && answer.includes(char)) {
      state = "exist";
    } else if (usedChars.has(char)) {
      state = "wrong";
    }

    return state;
  }

  const pressed = useRef(null);
  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      if (gameState.attempt === 6) {
        return;
      }

      const currentText = gameState.answers[gameState.attempt];
      if (
        pressed.current === true &&
        e.key === currentText[currentText.length - 1]
      ) {
        return;
      }

      if (isAnimating.current) {
        return;
      }

      pressed.current = true;
      if (e.key === "Backspace") {
        onBackspace();
      } else if (e.key === "Enter") {
        // prevent modal to be opened when pressing enter
        e.preventDefault();
        onSubmit();
      } else if (/[a-z]/i.test(e.key) && e.key.length === 1) {
        onPressChar(e.key);
      }
    }

    function handleKeyup() {
      pressed.current = false;
    }

    document.addEventListener("keydown", handleKeydown);
    document.addEventListener("keyup", handleKeyup);
    return () => {
      document.removeEventListener("keydown", handleKeydown);
      document.removeEventListener("keyup", handleKeyup);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);

  return (
    <div
      className="max-w-lg w-full mx-auto space-y-3 flex flex-col p-4 relative z-auto"
      id="keyboard"
    >
      <div className="flex space-x-2">
        {"qwertyuiop".split("").map((char) => (
          <KeyboardButton
            key={char}
            state={getKeyboardState(char)}
            onClick={() => onPressChar(char)}
          >
            {char}
          </KeyboardButton>
        ))}
      </div>
      <div className="flex space-x-2">
        <div style={{ flex: 0.5 }}></div>
        {"asdfghjkl".split("").map((char) => (
          <KeyboardButton
            key={char}
            state={getKeyboardState(char)}
            onClick={() => onPressChar(char)}
          >
            {char}
          </KeyboardButton>
        ))}
        <div style={{ flex: 0.5 }}></div>
      </div>
      <div className="flex space-x-2">
        <KeyboardButton state={null} onClick={onSubmit} scale={1.5}>
          Enter
        </KeyboardButton>
        {"zxcvbnm".split("").map((char) => (
          <KeyboardButton
            key={char}
            state={getKeyboardState(char)}
            onClick={() => onPressChar(char)}
          >
            {char}
          </KeyboardButton>
        ))}
        <KeyboardButton state={null} onClick={onBackspace} scale={1.5}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="24"
            viewBox="0 0 24 24"
            width="24"
          >
            <path
              fill="currentColor"
              d="M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.11c.36.53.9.89 1.59.89h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H7.07L2.4 12l4.66-7H22v14zm-11.59-2L14 13.41 17.59 17 19 15.59 15.41 12 19 8.41 17.59 7 14 10.59 10.41 7 9 8.41 12.59 12 9 15.59z"
            ></path>
          </svg>
        </KeyboardButton>
      </div>
    </div>
  );
}
