import { useEffect, useState } from "react";
import LocalStorage from "./browser";

export default function createStoredState<T>(storageKey: string) {
  return function useStoredState(initialState: T): [T, (newState: T) => void] {
    const [state, setState] = useState<T>(initialState);

    function setStoredState(state: T) {
      LocalStorage.setItem(storageKey, JSON.stringify(state));
      setState(state);
    }

    useEffect(() => {
      function updateStateFromStorage() {
        try {
          const storedState = LocalStorage.getItem(storageKey);
          if (storedState) {
            setState(JSON.parse(storedState));
          }
        } catch (_) {}
      }

      updateStateFromStorage();
      window.addEventListener("focus", updateStateFromStorage);
      return () => window.removeEventListener("focus", updateStateFromStorage);
    }, []);

    return [state, setStoredState];
  };
}
