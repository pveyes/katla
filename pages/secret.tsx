import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { encode } from "../utils/codec";
import { GAME_STATS_KEY } from "../utils/constants";
import { getGameNum } from "../utils/game";
import { GameStats } from "../utils/types";

export default function SecretPage() {
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    const code = router.query.code;
    if (!code) {
      return;
    }

    if (code !== encode("katla")) {
      setMessage("Invalid code");
      setTimeout(() => {
        window.location.replace("https://katla.vercel.app");
      }, 1000);
      return;
    }

    if (!router.query.scores) {
      setMessage("Invalid scores");
      setTimeout(() => {
        window.location.replace("https://katla.vercel.app");
      }, 1000);
      return;
    }

    const scores = (router.query.scores as string).split(",").map(Number);
    const [a, b, c, d, e, f, fail, currentStreak, maxStreak] = scores;

    const totalWin = a + b + c + d + e + f;
    const totalPlay = totalWin + fail;

    if (totalPlay > getGameNum("2022-02-04")) {
      return setMessage("Invalid play");
    }

    if (currentStreak > maxStreak) {
      return setMessage("Invalid streak #1");
    }

    if (currentStreak > totalWin || maxStreak > totalWin) {
      return setMessage("Invalid streak #2");
    }

    if (fail > 0) {
      if (maxStreak > totalWin) {
        return setMessage("Invalid streak #3");
      }
    }

    const gameStats: GameStats = {
      distribution: {
        1: a,
        2: b,
        3: c,
        4: d,
        5: e,
        6: f,
        fail,
      },
      currentStreak,
      maxStreak,
    };
    localStorage.setItem(GAME_STATS_KEY, JSON.stringify(gameStats));
    setMessage("Success");
    setTimeout(() => {
      window.location.replace("https://katla.vercel.app");
    }, 1000);
    // eslint-disable-next-line
  }, [router]);

  if (message) {
    return <div>{message}</div>;
  }

  return <div>What?</div>;
}
