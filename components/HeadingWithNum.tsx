export default function HeadingWithNum(props: { num: string | number | null }) {
  return (
    <span>
      Katla
      {props.num && (
        <sup className="-top-4 tracking-tight" style={{ fontSize: "45%" }}>
          #{props.num}
        </sup>
      )}
    </span>
  );
}
