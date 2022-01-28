import { useEffect, useRef, useState } from "react";

export default function useRemainingTime() {
  const now = new Date();
  const hours = 23 - now.getHours();
  const seconds = 59 - now.getSeconds();
  const minutes = 59 - now.getMinutes();

  const [remainingTime, setRemainingTime] = useState({
    hours,
    minutes,
    seconds,
  });
  const reloadTimeout = useRef(null);

  useEffect(() => {
    const t = setInterval(() => {
      const now = new Date();
      const hours = 23 - now.getHours();
      const minutes = 59 - now.getMinutes();
      const seconds = 59 - now.getSeconds();

      if (
        !reloadTimeout.current &&
        hours === 0 &&
        minutes === 0 &&
        seconds <= 5
      ) {
        reloadTimeout.current = setTimeout(() => {
          window.location.reload();
        }, 1000 * Number(seconds));
      }

      setRemainingTime({ hours, minutes, seconds });
    }, 500);
    return () => clearInterval(t);
  }, []);

  return remainingTime;
}
