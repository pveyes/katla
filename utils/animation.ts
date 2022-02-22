import showConfetti from "canvas-confetti";

export default function confetti(duration: number = 3) {
  let animationFrame: any;
  const end = Date.now() + duration * 1000;

  function frame() {
    // launch a few confetti from the left edge
    showConfetti({
      particleCount: 7,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
    });
    // and launch a few from the right edge
    showConfetti({
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
}
