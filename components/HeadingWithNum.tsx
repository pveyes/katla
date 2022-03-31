interface Props {
  num: string | number | null;
  enableLiarMode?: boolean;
}

export default function HeadingWithNum(props: Props) {
  return (
    <span>
      {props.enableLiarMode ? "KatLie" : "Katla"}
      {props.num && (
        <sup className="-top-4 tracking-tight" style={{ fontSize: "45%" }}>
          #{props.num}
        </sup>
      )}
    </span>
  );
}
