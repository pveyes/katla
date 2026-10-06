import { CSSProperties, useEffect, useState } from "react";
import {
  FLIP_ANIMATION_DELAY_MS,
  FLIP_ANIMATION_DURATION_MS,
  SHAKE_ANIMATION_DURATION_MS,
} from "../utils/constants";
import { AnswerState } from "../utils/types";

interface Props {
  char: string;
  state: AnswerState;
  isInvalid?: boolean;
  delay: number;
  onPress?: () => void;
}

export default function Tile(props: Props) {
  const [background, setBackground] = useState("text-ink");
  const [animate, setAnimationEnabled] = useState(false);
  // empty tiles are quiet outlines, typed tiles get a stronger outline
  const surface =
    props.char === " "
      ? "border-2 border-line bg-surface/40"
      : props.state === null
      ? "border-2 border-line-strong bg-surface"
      : "border-2 border-transparent";

  useEffect(() => {
    if (props.state === null) {
      return;
    }

    setAnimationEnabled(true);
    () => setAnimationEnabled(false);
  }, [props.state]);

  const style: CSSProperties = {};
  if (props.isInvalid) {
    style.animationName = "shake";
    style.animationDuration = `${SHAKE_ANIMATION_DURATION_MS}ms`;
  }

  if (props.state === null && props.char !== " ") {
    style.animationName = "pop";
    style.animationDuration = "120ms";
  }

  if (animate) {
    style.animationName = "flip";
    style.animationDuration = `${FLIP_ANIMATION_DURATION_MS}ms`;
    style.animationDelay = `${props.delay}ms`;
  }

  useEffect(() => {
    setTimeout(() => {
      switch (props.state) {
        case "c":
          setBackground("bg-correct");
          break;
        case "e":
          setBackground("bg-exist");
          break;
        case "w":
          setBackground("bg-absent");
          break;
      }
    }, props.delay + FLIP_ANIMATION_DELAY_MS);
  }, [animate, props.state, props.delay]);

  return (
    <button
      style={style}
      className={`rounded-lg uppercase text-center h-full w-full text-dynamic font-extrabold ${background} flex justify-center items-center ${surface} select-none`}
      tabIndex={-1}
      onClick={props.onPress}
    >
      {props.char === "_" ? "" : props.char}
    </button>
  );
}
