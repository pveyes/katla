import useSWR from "swr";
import { useEffect } from "react";
import confetti from "canvas-confetti";
import { useTheme } from "next-themes";
import * as Sentry from "@sentry/nextjs";

import Modal from "./Modal";

import { GameStats } from "../utils/types";
import { decode } from "../utils/codec";
import fetcher from "../utils/fetcher";
import { pad0 } from "../utils/formatter";
import {
  Game,
  useRemainingTime,
  getTotalPlay,
  getTotalWin,
  getAnswerStates,
  getGameNum,
} from "../utils/game";
import { checkNativeShareSupport } from "../utils/browser";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  game: Game;
  stats: GameStats;
  showMessage: (message: string) => void;
  remainingTime: ReturnType<typeof useRemainingTime>;
}

const GRAPH_WIDTH_MIN_RATIO = 10;

export default function StatsModal(props: Props) {
  const { isOpen, onClose, game, stats, showMessage } = props;
  const { hours, minutes, seconds } = props.remainingTime;
  const remainingTime = `${hours}:${pad0(minutes)}:${pad0(seconds)}`;
  const { resolvedTheme } = useTheme();
  const isAnswered =
    game.state.answers[game.state.attempt - 1] === decode(game.hash);

  const answer = decode(game.hash);
  const secretHash = process.env.NEXT_PUBLIC_SECRET_HASH;
  const showShare =
    game.state.answers.filter(Boolean).length === 6 ||
    game.state.answers[game.state.attempt - 1] === answer;
  const totalWin = getTotalWin(stats);
  const totalPlay = getTotalPlay(stats);

  function generateText() {
    const num = getGameNum(game.date);
    const score =
      game.state.answers[game.state.attempt - 1] === answer
        ? game.state.attempt
        : "X";
    let text = `Katla ${num} ${score}/6\n\n`;

    game.state.answers.filter(Boolean).forEach((userAnswer) => {
      const answerEmojis = getAnswerStates(userAnswer, answer).map((state) => {
        switch (state) {
          case "correct":
            return game.state.enableHighContrast ? "🟧" : "🟩";
          case "exist":
            return game.state.enableHighContrast ? "🟦" : "🟨";
          case "wrong":
            return resolvedTheme === "dark" ? "⬛" : "⬜️";
        }
      });
      text += `${answerEmojis.join("")}\n`;
    });

    text += "\nhttps://katla.vercel.app";
    return text;
  }

  useEffect(() => {
    if (!isOpen || !showShare || secretHash !== game.hash) {
      return;
    }

    // do this for 3 seconds
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    let animationFrame;
    function frame() {
      // launch a few confetti from the left edge
      confetti({
        particleCount: 7,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
      });
      // and launch a few from the right edge
      confetti({
        particleCount: 7,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
      });

      // keep going until we are out of time
      if (Date.now() < end) {
        animationFrame = requestAnimationFrame(frame);
      }
    }

    frame();
    return () => cancelAnimationFrame(animationFrame);
  }, [isOpen, showShare, secretHash, game.hash]);

  function handleShare() {
    const text = generateText();
    const shareData: ShareData = { text };
    const useNativeShare = checkNativeShareSupport();
    const clipboardSuccessCallback = () => {
      onClose();
      showMessage("Disalin ke clipboard");
    };
    const clipboardFailedCallback = (err: Error) => {
      Sentry.captureException(err);
      onClose();
      showMessage(`Gagal menyalin ke clipboard.`);
    };

    if ("share" in navigator && useNativeShare) {
      // native share
      navigator.share(shareData).catch(() => {
        // TODO: handle non abort error
      });
    } else if (
      "clipboard" in navigator &&
      typeof navigator.clipboard.writeText === "function" &&
      // https://sentry.io/share/issue/5074ad1fa6b34a2a9985edc7155967f0/
      // https://stackoverflow.com/questions/61243646/clipboard-api-call-throws-notallowederror-without-invoking-onpermissionrequest
      "permissions" in navigator
    ) {
      // async clipboard API
      const promise = navigator.clipboard.writeText(text);

      // https://sentry.io/share/issue/59a42dfd516a439a99f763ee276aff26/
      if (promise) {
        promise.then(clipboardSuccessCallback).catch(clipboardFailedCallback);
      }
    } else {
      // legacy browsers without async clipboard API support
      const textarea = document.createElement("textarea");
      textarea.textContent = text;
      textarea.style.position = "fixed";
      document.body.appendChild(textarea);
      // https://sentry.io/share/issue/cb8a0ca8f6fc47858eafe4bc5959debd/
      textarea.focus();
      textarea.select();
      try {
        document.execCommand("copy");
        clipboardSuccessCallback();
      } catch (err) {
        clipboardFailedCallback(err);
      } finally {
        document.body.removeChild(textarea);
      }
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
          <div className="text-xs md:text-sm break-word">
            <em>Streak</em> Saat Ini
          </div>
        </div>
        <div>
          <div className="text-md sm:text-xl lg:text-3xl">
            {stats.maxStreak}
          </div>
          <div className="text-xs md:text-sm break-word">
            <em>Streak</em> Maksimum
          </div>
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
            <div className="text-center flex flex-1 flex-col">
              <div className="font-semibold uppercase text-xs md:text-md">
                Katla berikutnya
              </div>
              <div className="text-xl md:text-4xl">{remainingTime}</div>
            </div>
            <div className="bg-gray-400" style={{ width: 1 }}></div>
            <div className="flex flex-col space-y-4">
              <button
                onClick={handleShare}
                className="bg-accent py-1 md:py-3 px-3 md:px-6 rounded-md font-semibold uppercase text-xl flex flex-1 flex-row space-x-2 items-center justify-center text-gray-200"
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
                onClick={handleShareToTwitter}
                className="py-1 md:py-3 px-3 md:px-6 rounded-md font-semibold uppercase text-xl flex flex-1 flex-row space-x-2 items-center justify-center text-gray-200"
                style={{ backgroundColor: "#00acee" }}
              >
                <div>Share</div>
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
  const { data = [] } = useSWR(`/api/define/${answer}`, fetcher);

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
