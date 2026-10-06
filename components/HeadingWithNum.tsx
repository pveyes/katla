interface Props {
  num: string | number | null;
  enableLiarMode?: boolean;
}

export default function HeadingWithNum(props: Props) {
  const [_, mm, dd] = new Date().toISOString().split("T")[0].split("-");
  const isIndonesiaIndependenceDay = mm === "08" && dd === "17";
  const numClass = isIndonesiaIndependenceDay
    ? "bg-red-500 text-white"
    : "bg-line text-muted";

  return (
    <span className="inline-flex items-center gap-2">
      {props.enableLiarMode ? "Katlie" : "Katla"}
      {props.num && (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold tracking-normal tabular-nums ${numClass}`}
        >
          #{props.num}
        </span>
      )}
    </span>
  );
}
