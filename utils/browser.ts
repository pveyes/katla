export function checkNativeShareSupport() {
  const isFirefox = navigator.userAgent.toLowerCase().indexOf("firefox") > -1;
  const isAndroid = navigator.userAgent.toLowerCase().indexOf("android") > -1;

  if (isFirefox && isAndroid) {
    return false;
  }

  const isDesktop =
    window.screenX === 0 &&
    !("ontouchstart" in window) &&
    // https://sentry.io/share/issue/5faab0d5e08a4d02a32cace759e7e3d8/
    (screen?.orientation?.type ?? "landscape-primary") === "landscape-primary";

  if (isDesktop) {
    return false;
  }

  return true;
}

/**
 * Safe & drop-in replacement for localStorage access for browser with storage disabled
 *  - Firefox with dom.storage.enabled = false
 *  - Webview with storage disabled
 */
const LocalStorage: typeof window.localStorage = {
  getItem(key: string): string | null {
    try {
      return window.localStorage.getItem(key);
    } catch (err) {
      return null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      return window.localStorage.setItem(key, value);
    } catch (err) {
      return;
    }
  },
  removeItem(key: string): void {
    try {
      return window.localStorage.removeItem(key);
    } catch (err) {
      return;
    }
  },
  clear(): void {
    try {
      return window.localStorage.clear();
    } catch (err) {
      return;
    }
  },
  key(index: number): string | null {
    try {
      return window.localStorage.key(index);
    } catch (err) {
      return null;
    }
  },
  get length(): number {
    try {
      return window.localStorage.length;
    } catch (err) {
      return 0;
    }
  },
};

export default LocalStorage;

export function isStorageEnabled() {
  const randomKey = Math.random().toFixed(5);
  const randomValue = Math.random().toFixed(5);
  const storageKey = `katla:test:${randomKey}`;
  LocalStorage.setItem(storageKey, randomValue);
  const stored = LocalStorage.getItem(storageKey);
  if (stored === null) {
    return false;
  }

  LocalStorage.removeItem(storageKey);
  return stored === randomValue;
}
