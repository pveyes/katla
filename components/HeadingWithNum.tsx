interface Props {
  num: string | number | null;
  enableLiarMode?: boolean;
}

export default function HeadingWithNum(props: Props) {
  const [_, mm, dd] = new Date().toISOString().split("T")[0].split("-");
  const isIndonesiaIndependenceDay = mm === "08" && dd === "17";
  let customNumClass = "";
  if (isIndonesiaIndependenceDay) {
    customNumClass = "text-white bg-red-500 p-1";
  }

  return (
    <span>
      {props.enableLiarMode ? "Katlie" : <><span style={{ color: "#EE2A35"}}>K</span>at<span style={{ color: "#009736"}}>la</span></>}
      {props.num && (
        <sup
          className={`-top-4 tracking-tight ${customNumClass}`}
          style={{ fontSize: "45%" }}
        >
          #{props.num}
        </sup>
      )}
    </span>
  );
}
