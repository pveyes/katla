import { ComponentProps, memo } from "react";
import { AnswerState } from "../utils/types";

type Props = {
  state: AnswerState;
  scale?: number;
  // a physical key is held down, show it as if this key was tapped
  pressed?: boolean;
} & Omit<ComponentProps<"button">, "className" | "style">;

export default function KeyboardButton({ pressed, ...props }: Props) {
  let color = "bg-surface text-ink border border-line";
  switch (props.state) {
    case "c":
      color = "bg-correct";
      break;
    case "e":
      color = "bg-exist";
      break;
    case "w":
      color = "bg-absent";
      break;
    default:
  }

  return (
    <button
      className={`keycap rounded-lg uppercase font-bold text-sm flex items-center justify-center ${color} select-none`}
      style={{ minHeight: 48, flex: props.scale ?? 1 }}
      data-pressed={pressed ? "true" : undefined}
      {...props}
    />
  );
}
