import useSWR from "swr";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Duration } from "date-fns";

import Modal from "./Modal";

import { AnswerState, Game, GameStats } from "../utils/types";
import { decode } from "../utils/codec";
import fetcher from "../utils/fetcher";
import { pad0 } from "../utils/formatter";
import {
  useRemainingTime,
  getTotalPlay,
  getTotalWin,
  getAnswerStates,
} from "../utils/game";
import { checkNativeShareSupport, shareText } from "../utils/browser";
import { isEidMessage } from "../utils/message";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  game: Game;
  stats: GameStats;
  remainingTime?: ReturnType<typeof useRemainingTime>;
}

const GRAPH_WIDTH_MIN_RATIO = 10;

export default function StatsModal(props: Props) {
  const { isOpen, onClose, game, stats } = props;
  const { resolvedTheme } = useTheme();
  const isAnswered =
    game.state.answers[game.state.attempt - 1] === decode(game.hash);
  const [canShareImage, setCanShareImage] = useState(false);
  const [showAnswersCheckbox, setShowAnswersCheckbox] = useState(false);

  useEffect(() => {
    const canShareImage =
      checkNativeShareSupport() && typeof navigator.canShare === "function";
    setCanShareImage(canShareImage);

    if (!canShareImage) {
      // preload image share logic
      import("file-saver");
    }
  }, []);

  const answer = decode(game.hash);
  const showShare =
    game.state.attempt === 6 ||
    game.state.answers[game.state.attempt - 1] === answer;
  const totalWin = getTotalWin(stats);
  const totalPlay = getTotalPlay(stats);
  const title = game.state.enableLiarMode ? "Katlie" : "Katla";

  function generateText() {
    const hardModeMarker = game.state.enableHardMode ? "*" : "";
    const score =
      game.state.answers[game.state.attempt - 1] === answer
        ? game.state.attempt
        : "X";
    let text = `${title} ${game.num} ${score}/6${hardModeMarker}\n\n`;

    game.state.answers.filter(Boolean).forEach((userAnswer) => {
      const answerEmojis = getAnswerStates(userAnswer, answer).map((state) => {
        switch (state) {
          case "c":
            return game.state.enableHighContrast ? "🟧" : "🟩";
          case "e":
            return game.state.enableHighContrast ? "🟦" : "🟨";
          case "w":
            return resolvedTheme === "dark" ? "⬛" : "⬜️";
        }
      });
      text += `${answerEmojis.join("")}\n`;
    });

    if (
      game.num === 102 &&
      isEidMessage(game.state.answers[game.state.attempt - 1])
    ) {
      text = `🙏🙏🙏🙏🙏\n\n`;
      text += `⬛⬛🟩⬛⬛\n`;
      text += `⬛🟩🟨🟩⬛\n`;
      text += `🟩🟨🟩🟨🟩\n`;
      text += `⬛🟩🟨🟩⬛\n`;
      text += `⬛⬛🟩⬛⬛\n`;
      text += "\n" + window.location.href;
      return text;
    }

    text += `\nDurasi: ${stats.duration.hours}:${pad0(
      stats.duration.minutes
    )}:${pad0(stats.duration.seconds)}`;
    text += "\n" + window.location.href;
    return text;
  }

  function handleShare() {
    shareText(generateText(), { cb: onClose });
  }

  async function handleShareImage() {
    const canvas = document.createElement("canvas");
    canvas.height = 1400;
    canvas.width = 900;

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = resolvedTheme === "dark" ? "#111827" : "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const gap = 10;
    const paddingH = 200;
    const paddingT = 400;
    const size = (canvas.width - paddingH * 2 - gap * 4) / 5;

    const score =
      game.state.answers[game.state.attempt - 1] === answer
        ? game.state.attempt
        : "X";
    const hardModeMarker = game.state.enableHardMode ? "*" : "";

    let answers = game.state.answers.slice(0, game.state.attempt);
    let answerStates: AnswerState[][] = answers.map((answer) => {
      return getAnswerStates(answer, decode(game.hash));
    });
    let text = `${title} ${game.num} ${score}/6${hardModeMarker}\n\n`;

    if (
      game.num === 102 &&
      isEidMessage(game.state.answers[game.state.attempt - 1])
    ) {
      text = `🙏🙏🙏🙏🙏🙏`;
      answers = ["mohon", "maaf", "lahir", "dan", "batin"];
      answerStates = [
        ["w", "w", "c", "w", "w"],
        ["w", "c", "e", "c", "w"],
        ["c", "e", "c", "e", "c"],
        ["w", "c", "e", "c", "w"],
        ["w", "w", "c", "w", "w"],
      ];
    }

    ctx.font = "bold 42px sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = resolvedTheme === "dark" ? "#ffffff" : "#111827";
    ctx.fillText(text, canvas.width / 2, 300);
    ctx.font = "32px sans-serif";
    ctx.fillText(
      `Durasi: ${stats.duration.hours}:${pad0(stats.duration.minutes)}:${pad0(
        stats.duration.seconds
      )}`,
      canvas.width / 2,
      canvas.height - 300
    );
    ctx.fillText("katla.vercel.app", canvas.width / 2, canvas.height - 150);

    answerStates.forEach((states, y) => {
      const answer = answers[y];
      states.forEach((state, x) => {
        if (state === "c") {
          ctx.fillStyle = game.state.enableHighContrast ? "#f5793a" : "#15803d";
        } else if (state === "e") {
          ctx.fillStyle = game.state.enableHighContrast ? "#85c0f9" : "#ca8a04";
        } else {
          ctx.fillStyle = resolvedTheme === "dark" ? "#374151" : "#6b7280";
        }

        const marginH = gap * x;
        const marginV = gap * y;
        const rectX = paddingH + x * size + marginH;
        const rectY = paddingT + y * size + marginV;

        ctx.beginPath();
        ctx.rect(rectX, rectY, size, size);
        ctx.fill();

        if (showAnswersCheckbox) {
          ctx.font = "bold 54px sans-serif";
          ctx.fillStyle = "#ffffff";
          ctx.fillText(
            answer[x]?.toUpperCase() ?? "",
            rectX + size / 2,
            rectY + size / 1.5
          );
        }
      });
    });

    const dataURL = canvas.toDataURL();
    const blob = await (await fetch(dataURL)).blob();

    if (canShareImage) {
      const imageName = showAnswersCheckbox
        ? `katla-${game.num}-with-answers.jpg`
        : `katla-${game.num}.jpg`;
      const shareData = {
        files: [
          new File([blob], imageName, {
            type: "image/jpeg",
            lastModified: new Date().getTime(),
          }),
        ],
      };
      navigator.share(shareData).catch(() => {});
    } else {
      const { saveAs } = await import("file-saver").then((mod) => mod.default);
      const imageName = showAnswersCheckbox
        ? `katla-${game.num}-with-answers`
        : `katla-${game.num}`;
      saveAs(blob, imageName);
    }
  }

  function handleShareToTwitter() {
    const text = generateText();
    const encodeURI = text.replace(/\n/g, "%0A");
    const shareToTwitter = `https://twitter.com/intent/tweet?text=${encodeURI}`;
    window.open(shareToTwitter, "_blank");
  }

  const { fail: _, ...distribution } = stats.distribution;
  const maxDistribution = Math.max(...Object.values(distribution));

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Modal.Title>Statistik</Modal.Title>
      <div className="grid grid-rows-1 grid-cols-4 text-center w-3/4 space-x-1 mx-auto mb-8">
        <div>
          <div className="text-md sm:text-xl lg:text-3xl">{totalPlay}</div>
          <div className="text-xs md:text-sm break-word">Dimainkan</div>
        </div>
        <div>
          <div className="text-md sm:text-xl lg:text-3xl">
            {totalPlay === 0 ? 0 : Math.round((totalWin / totalPlay) * 100)}
          </div>
          <div className="text-xs md:text-sm break-word">% Menang</div>
        </div>
        <div>
          <div className="text-md sm:text-xl lg:text-3xl">
            {stats.currentStreak}
          </div>
          <div className="text-xs md:text-sm break-word">Runtunan saat ini</div>
        </div>
        <div>
          <div className="text-md sm:text-xl lg:text-3xl">
            {stats.maxStreak}
          </div>
          <div className="text-xs md:text-sm break-word">Runtunan maksimum</div>
        </div>
      </div>
      <div className="w-10/12 mx-auto mb-8">
        <h3 className="uppercase font-semibold mb-4">Distribusi Tebakan</h3>
        {Array(6)
          .fill("")
          .map((_, i) => {
            const shouldHighlight = isAnswered && i === game.state.attempt - 1;
            const ratio =
              totalWin === 0
                ? GRAPH_WIDTH_MIN_RATIO
                : Math.max(
                    (Number(stats.distribution[i + 1]) / maxDistribution) * 100,
                    GRAPH_WIDTH_MIN_RATIO
                  );
            const alignment =
              ratio === GRAPH_WIDTH_MIN_RATIO
                ? "justify-center"
                : "justify-end";
            const background = shouldHighlight ? "bg-accent" : "bg-gray-500";
            return (
              <div className="flex h-5 mb-2" key={i}>
                <div className="tabular-nums">{i + 1}</div>
                <div className="w-full h-full pl-1">
                  <div
                    className={`text-right text-white ${background} flex ${alignment} px-2 font-bold`}
                    style={{ width: ratio + "%" }}
                  >
                    {stats.distribution[i + 1]}
                  </div>
                </div>
              </div>
            );
          })}
      </div>
      {showShare && (
        <>
          <WordDefinition answer={answer} />
          <div className="flex items-center justify-between w-3/4 m-auto my-8 space-x-2">
            {props.remainingTime ? (
              <TimeCounter
                time={props.remainingTime}
                duration={props.stats.duration}
              />
            ) : (
              <div />
            )}
            <div className="bg-gray-400" style={{ width: 1 }}></div>
            <div className="flex flex-col space-y-4 text-white">
              <button
                onClick={handleShare}
                className="bg-accent py-1 md:py-3 px-3 md:px-6 rounded-md font-semibold uppercase text-xl flex flex-1 flex-row space-x-2 items-center justify-center"
              >
                <div>Share</div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24"
                  viewBox="0 0 24 24"
                  width="24"
                >
                  <path
                    fill="currentColor"
                    d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92c0-1.61-1.31-2.92-2.92-2.92zM18 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM6 13c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm12 7.02c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"
                  ></path>
                </svg>
              </button>

              <button
                onClick={handleShareImage}
                className="bg-ig py-1 md:py-3 px-3 md:px-6 rounded-md font-semibold uppercase text-xl flex flex-1 flex-row space-x-2 items-center justify-center"
              >
                <div>Image</div>
                {canShareImage ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="24"
                    viewBox="0 0 24 24"
                    width="24"
                  >
                    <path
                      fill="currentColor"
                      d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92c0-1.61-1.31-2.92-2.92-2.92zM18 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM6 13c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm12 7.02c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"
                    ></path>
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                )}
              </button>

              <label className="flex items-center gap-2 text-xs dark:text-gray-400 text-gray-600">
                <input
                  type="checkbox"
                  checked={showAnswersCheckbox}
                  onChange={(e) => setShowAnswersCheckbox(e.target.checked)}
                />
                <span>Sertakan jawaban pada gambar</span>
              </label>

              <button
                onClick={handleShareToTwitter}
                className="py-1 md:py-3 px-3 md:px-6 rounded-md font-semibold uppercase text-xl flex flex-1 flex-row space-x-2 items-center justify-center"
                style={{ backgroundColor: "#00acee" }}
              >
                <div>Tweet</div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="#ffffff"
                >
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                </svg>
              </button>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}

function WordDefinition({ answer }) {
  const { data = [] } = useSWR(`/api/define/${answer}`, (path) => {
    return fetcher(path, {
      headers: {
        Authorization: `token ${process.env.NEXT_PUBLIC_DEFINE_TOKEN}`,
      },
    });
  });

  return (
    <div className="w-10/12 mx-auto mb-8">
      <h3 className="uppercase font-semibold">Katla hari ini</h3>
      <p className="text-xs mb-2 dark:text-gray-400 text-gray-600">
        Mohon untuk tetap dirahasiakan, semua orang mendapatkan kata yang sama
        🙏
      </p>
      <p>
        <strong>{answer}</strong>
        {data.length > 0 ? (
          data.length === 1 ? (
            `: ${data[0]}`
          ) : (
            <ul className="text-sm">
              {data.map((d, i) => (
                <li className=" list-outside list-disc ml-6" key={i}>
                  {d}
                </li>
              ))}
            </ul>
          )
        ) : null}
      </p>
      <a
        className="color-accent text-sm"
        href={`https://kbbi.kemdikbud.go.id/entri/${answer}`}
      >
        Lihat di KBBI
      </a>
    </div>
  );
}

function TimeCounter({
  time,
  duration,
}: {
  time: ReturnType<typeof useRemainingTime>;
  duration: Duration;
}) {
  const remainingTime = `${time.hours}:${pad0(time.minutes)}:${pad0(
    time.seconds
  )}`;

  const finishedTime = `${duration.hours}:${pad0(duration.minutes)}:${pad0(
    duration.seconds
  )}`;

  return (
    <div>
      <div className="text-center flex flex-1 flex-col mb-6">
        <div className="font-semibold uppercase text-xs md:text-md">Durasi</div>
        <div className="text-xl md:text-4xl">{finishedTime}</div>
      </div>
      <div className="text-center flex flex-1 flex-col">
        <div className="font-semibold uppercase text-xs md:text-md">
          Katla berikutnya
        </div>
        <div className="text-xl md:text-4xl">{remainingTime}</div>
      </div>
    </div>
  );
}
