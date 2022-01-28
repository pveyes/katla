import { GetStaticProps } from "next";
import { useEffect, useState } from "react";
import { formatDate, formatTime } from "../utils/formatter";

interface Props {
  hash: string;
  date: string;
}

export default function Debug(props: Props) {
  const [debugCode, setDebugCode] = useState("");
  useEffect(() => {
    const gameState = localStorage.getItem("katla:gameState");
    const gameStats = localStorage.getItem("katla:gameStats");
    const lastHash = localStorage.getItem("katla:lastHash");
    const now = new Date();
    const nowDate = formatDate(now);
    const nowHours = formatTime(now);
    setDebugCode(
      btoa(
        [
          props.hash,
          props.date,
          lastHash,
          nowDate,
          nowHours,
          gameState,
          gameStats,
        ].join(":")
      )
    );
  }, []);

  return (
    <div className="text-white max-w-lg mx-auto mt-4">
      <h1 className="text-3xl mb-4">Debug</h1>
      {debugCode === "" ? (
        <span>Generating debug code...</span>
      ) : (
        <>
          <p className="mb-4">
            Kirimkan keluhan dan sertakan kode ini ke{" "}
            <a className="text-blue-400" href="https://twitter.com/pveyes">
              @pveyes
            </a>{" "}
            on Twitter
          </p>
          <pre className="border border-gray-300 p-3 whitespace-pre-wrap break-all ">
            {debugCode}
          </pre>
        </>
      )}
    </div>
  );
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const { hash, date } = await fetch("https://katla.vercel.app/api/hash").then(
    (res) => res.json()
  );
  return {
    props: {
      hash: hash,
      date: date,
    },
    revalidate: 60,
  };
};
