import Alert from "../components/Alert";

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

  return "share" in navigator;
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

interface ShareOptions {
  cb?: () => void;
  fallbackText?: string;
  clipboardSuccessMessage?: string;
}

export function shareLink(url: string, options: ShareOptions) {
  share({ url }, { ...options, fallbackText: url });
}

export function shareText(text: string, options: ShareOptions) {
  share({ text }, { ...options, fallbackText: text });
}

export function share(data: ShareData, options: ShareOptions) {
  const useNativeShare = checkNativeShareSupport();
  const clipboardSuccessCallback = () => {
    const message = options.clipboardSuccessMessage ?? "Disalin ke clipboard";
    options.cb?.();
    Alert.show(message, { id: "clipboard " });
  };
  const clipboardFailedCallback = (_: Error) => {
    options.cb?.();
    Alert.show("Gagal menyalin ke clipboard", { id: "clipboard" });
  };

  if (useNativeShare) {
    // native share
    navigator.share(data).catch(() => {
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
    const promise = navigator.clipboard.writeText(options.fallbackText);

    // https://sentry.io/share/issue/59a42dfd516a439a99f763ee276aff26/
    if (promise) {
      promise.then(clipboardSuccessCallback).catch(clipboardFailedCallback);
    }
  } else {
    // legacy browsers without async clipboard API support
    const textarea = document.createElement("textarea");
    textarea.textContent = options.fallbackText;
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
