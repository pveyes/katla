import { CSSProperties, useEffect, useState } from "react";
import { AnswerState } from "../utils/types";

interface Props {
  char: string;
  state: AnswerState;
  isInvalid?: boolean;
  delay: number;
}

export default function Tile(props: Props) {
  const [background, setBackground] = useState("");
  const [animate, setAnimationEnabled] = useState(false);
  const border =
    props.char === " " ? "border" : props.state === null ? "border-3" : "";
  const borderColor =
    props.char === " "
      ? "border-gray-700"
      : props.state === null
      ? "border-gray-500"
      : "";

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
    style.animationDuration = "600ms";
  }

  if (animate) {
    style.animationName = "flipIn";
    style.animationDuration = "400ms";
    style.animationDelay = `${props.delay}ms`;
  }

  useEffect(() => {
    setTimeout(() => {
      switch (props.state) {
        case "correct":
          setBackground("bg-green-700");
          break;
        case "exist":
          setBackground("bg-yellow-600");
          break;
        case "wrong":
          setBackground("bg-gray-700");
          break;
      }
    }, props.delay + 200);
  }, [animate, props.state, props.delay]);

  return (
    <div
      style={style}
      className={`rounded-sm uppercase text-white text-center h-full w-full text-dynamic font-bold ${background} flex justify-center items-center ${border} ${borderColor}`}
    >
      {props.char}
    </div>
  );
}
