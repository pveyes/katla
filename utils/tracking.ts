declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

export function trackEvent(
  eventName: string,
  args: Record<string, string | number>
) {
  if ("gtag" in window && typeof window.gtag === "function") {
    window.gtag("event", eventName, args);
  }
}
