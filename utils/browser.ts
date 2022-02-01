export function checkNativeShareSupport() {
  const isFirefox = navigator.userAgent.toLowerCase().indexOf("firefox") > -1;
  const isAndroid = navigator.userAgent.toLowerCase().indexOf("android") > -1;

  if (isFirefox && isAndroid) {
    return false;
  }

  const isDesktop =
    window.screenX === 0 &&
    !("ontouchstart" in window) &&
    screen.orientation.type === "landscape-primary";

  if (isDesktop) {
    return false;
  }

  return true;
}
