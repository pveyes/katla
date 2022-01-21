import { ComponentProps } from "react";

type Props = {
  state: "correct" | "exist" | "wrong" | null;
  scale?: number;
} & Omit<ComponentProps<"button">, "className" | "style">;

export default function KeyboardButton(props: Props) {
  let background = "bg-gray-500";
  switch (props.state) {
    case "correct":
      background = "bg-green-700";
      break;
    case "exist":
      background = "bg-yellow-600";
      break;
    case "wrong":
      background = "bg-gray-700";
      break;
    default:
  }

  return (
    <button
      className={`rounded-md uppercase font-semibold text-sm flex items-center justify-center ${background}`}
      style={{ minHeight: 48, flex: props.scale ?? 1 }}
      {...props}
    />
  );
}
