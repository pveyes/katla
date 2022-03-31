import { ComponentProps, memo } from "react";
import { AnswerState } from "../utils/types";

type Props = {
  state: AnswerState;
  scale?: number;
} & Omit<ComponentProps<"button">, "className" | "style">;

export default function KeyboardButton(props: Props) {
  let color = "bg-gray-300 text-gray-900 dark:bg-gray-500 dark:text-gray-200";
  switch (props.state) {
    case "c":
      color = "text-white bg-correct";
      break;
    case "e":
      color = "text-white bg-exist";
      break;
    case "w":
      color = "text-white bg-gray-500 dark:text-gray-200 dark:bg-gray-700";
      break;
    default:
  }

  return (
    <button
      className={`rounded-md uppercase font-semibold text-sm flex items-center justify-center ${color} select-none`}
      style={{ minHeight: 48, flex: props.scale ?? 1 }}
      {...props}
    />
  );
}
