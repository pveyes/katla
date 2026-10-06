import { MutableRefObject, useEffect, useRef, useState } from "react";

import KeyboardButton from "./KeyboardButton";
import { AnswerState, GameState } from "../utils/types";
import { decode } from "../utils/codec";

interface Props {
  onPressChar: (char: string) => void;
  onBackspace: () => void;
  onSubmit: () => void;
  gameState: GameState;
  hash: string;
  isAnimating: MutableRefObject<boolean>;
}

// a quick tap is shorter than a frame, keep the key down long enough to be seen
const MIN_PRESS_MS = 90;

function toKeyId(e: KeyboardEvent): string | null {
  if (e.key === "Enter") return "enter";
  if (e.key === "Backspace") return "backspace";
  if (e.key === "_") return "_";
  if (e.key.length === 1 && /[a-z]/i.test(e.key)) return e.key.toLowerCase();
  return null;
}

// which on-screen keys should look pressed because a physical key is held
function useHeldKeys() {
  const [held, setHeld] = useState<string[]>([]);

  useEffect(() => {
    const downAt = new Map<string, number>();
    const releaseTimers = new Map<string, number>();

    function release(key: string) {
      downAt.delete(key);
      releaseTimers.delete(key);
      setHeld((keys) => keys.filter((k) => k !== key));
    }

    function handleKeydown(e: KeyboardEvent) {
      // shortcuts like Cmd+R are not typing
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const key = toKeyId(e);
      if (!key) return;

      window.clearTimeout(releaseTimers.get(key));
      releaseTimers.delete(key);
      if (!downAt.has(key)) {
        downAt.set(key, Date.now());
      }
      setHeld((keys) => (keys.includes(key) ? keys : [...keys, key]));
    }

    function handleKeyup(e: KeyboardEvent) {
      const key = toKeyId(e);
      if (!key || !downAt.has(key)) return;

      const wait = Math.max(0, MIN_PRESS_MS - (Date.now() - downAt.get(key)!));
      releaseTimers.set(
        key,
        window.setTimeout(() => release(key), wait)
      );
    }

    // the keyup never arrives when the window loses focus while a key is held
    function handleBlur() {
      releaseTimers.forEach((timer) => window.clearTimeout(timer));
      downAt.clear();
      releaseTimers.clear();
      setHeld([]);
    }

    document.addEventListener("keydown", handleKeydown);
    document.addEventListener("keyup", handleKeyup);
    window.addEventListener("blur", handleBlur);
    return () => {
      document.removeEventListener("keydown", handleKeydown);
      document.removeEventListener("keyup", handleKeyup);
      window.removeEventListener("blur", handleBlur);
      releaseTimers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  return held;
}

export default function Keyboard(props: Props) {
  const { onPressChar, onBackspace, onSubmit, gameState, hash, isAnimating } =
    props;
  const heldKeys = useHeldKeys();
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

  function getKeyboardState(char: string): AnswerState {
    let state = null;
    if (correctChars.has(char)) {
      state = "c";
    } else if (usedChars.has(char) && answer.includes(char)) {
      state = "e";
    } else if (usedChars.has(char)) {
      state = "w";
    }

    return gameState.enableLiarMode ? null : state;
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
      } else if (e.key === "_") {
        onPressChar(e.key);
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
            pressed={heldKeys.includes(char)}
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
            pressed={heldKeys.includes(char)}
            onClick={() => onPressChar(char)}
          >
            {char}
          </KeyboardButton>
        ))}
        <div style={{ flex: 0.5 }}></div>
      </div>
      <div className="flex space-x-2">
        <KeyboardButton
          state={null}
          pressed={heldKeys.includes("enter")}
          onClick={onSubmit}
          scale={1.5}
        >
          Enter
        </KeyboardButton>
        {"zxcvbnm".split("").map((char) => (
          <KeyboardButton
            key={char}
            state={getKeyboardState(char)}
            pressed={heldKeys.includes(char)}
            onClick={() => onPressChar(char)}
          >
            {char}
          </KeyboardButton>
        ))}
        <KeyboardButton
          state={null}
          pressed={heldKeys.includes("_")}
          onClick={() => onPressChar("_")}
          scale={1.5}
        >
          _
        </KeyboardButton>
        <KeyboardButton
          state={null}
          pressed={heldKeys.includes("backspace")}
          onClick={onBackspace}
          scale={1.5}
        >
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
