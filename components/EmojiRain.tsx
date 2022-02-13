import { ComponentRef, useEffect, useRef, useState } from "react";

const CUSTOM_EVENT_NAME = "emoji-rain";

export default function EmojiRain() {
  const canvasRef = useRef<ComponentRef<"canvas">>(null);
  const [emoji, setEmoji] = useState(null);
  const timeoutRef = useRef<any>();

  useEffect(() => {
    if (!emoji) {
      return;
    }

    if (canvasRef.current === null) {
      return;
    }

    const w = window.innerWidth;
    const h = window.innerHeight;
    const ctx = canvasRef.current.getContext("2d");
    const bodyBackground = window.getComputedStyle(
      document.body
    ).backgroundColor;

    canvasRef.current.width = w;
    canvasRef.current.height = h;

    ctx.fillStyle = bodyBackground;
    ctx.fillRect(0, 0, w - 1, h - 1);

    const numOfEmojis = randomBetween(20, 30);
    let emojis: ElementPosition[] = Array(numOfEmojis)
      .fill(emoji)
      .map((emoji) => {
        let x = randomBetween(0, w - 1);
        let y = randomBetween(-42, -600);
        let size = randomBetween(32, 60);
        return new ElementPosition(emoji, x, y, size, size);
      });

    let frame = window.requestAnimationFrame(function draw() {
      const bodyBackground = window.getComputedStyle(
        document.body
      ).backgroundColor;
      emojis.forEach((element) => {
        element.updateY(
          interpolate(element.y, { min: -42, max: h }, { min: 8, max: 1 })
        );
      });

      emojis = emojis.filter((elem) => {
        if (elem.y > h + 42) {
          return false;
        }
        return true;
      });

      ctx.fillStyle = bodyBackground;
      ctx.fillRect(0, 0, w - 1, h - 1);

      emojis.forEach((elem) => {
        const alpha = interpolate(
          elem.y,
          { min: 0, max: (h / 3) * 2 },
          { min: 1, max: 0 }
        );
        ctx.fillStyle = `rgb(17, 24, 39, ${alpha})`;
        ctx.font = elem.width + "px sans";
        ctx.fillText(elem.emoji, elem.x, elem.y);
      });

      frame = window.requestAnimationFrame(draw);
    });
    return () => {
      ctx.fillStyle = bodyBackground;
      ctx.fillRect(0, 0, w - 1, h - 1);
      window.cancelAnimationFrame(frame);
    };
  }, [emoji]);

  useEffect(() => {
    function handleEmoji(e: CustomEvent) {
      setEmoji(e.detail);
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setEmoji(null);
      }, 5000);
    }

    window.addEventListener(CUSTOM_EVENT_NAME, handleEmoji);
    return () => window.removeEventListener(CUSTOM_EVENT_NAME, handleEmoji);
  }, []);

  return <canvas ref={canvasRef} className="fixed pointer-events-none z-0" />;
}

export function rainEmoji(emoji: string) {
  const event = new CustomEvent(CUSTOM_EVENT_NAME, { detail: emoji });
  window.dispatchEvent(event);
}

interface RangeValue {
  min: number;
  max: number;
}

function interpolate(current: number, from: RangeValue, to: RangeValue) {
  if (current < from.min) {
    return to.min;
  }
  if (current > from.max) {
    return to.max;
  }
  // y-y1/y2-y1 = x-x1/x2-x1
  // y = x-x1/x2-x1*y2-y1 + y1
  return (
    ((current - from.min) / (from.max - from.min)) * (to.max - to.min) + to.min
  );
}

function randomBetween(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

class ElementPosition {
  emoji: string;
  x: number;
  y: number;
  width: number;
  height: number;
  velocity: number;

  constructor(
    emoji: string,
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    this.emoji = emoji;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  updateY(velocity: number) {
    this.y = this.y + velocity;
  }
}
