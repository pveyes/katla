export function trackEvent(
  eventName: string,
  args: Record<string, string | number>
) {
  // @ts-ignore
  window.gtag("event", eventName, args);
}
