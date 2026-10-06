import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "katla:theme";

type Theme = "light" | "dark" | "system";

interface ThemeContext {
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
}

const Context = createContext<ThemeContext>({
  resolvedTheme: "light",
  setTheme: () => {},
});

function getStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : "system";
  } catch (err) {
    return "system";
  }
}

function resolve(theme: Theme): "light" | "dark" {
  if (theme !== "system") {
    return theme;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

// the initial class is set by an inline script in index.html to avoid a flash
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme);
  const [resolvedTheme, setResolvedTheme] = useState(() => resolve(theme));

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const next = resolve(theme);
      setResolvedTheme(next);
      document.documentElement.classList.toggle("dark", next === "dark");
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch (err) {}
  }, []);

  const value = useMemo(
    () => ({ resolvedTheme, setTheme }),
    [resolvedTheme, setTheme]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useTheme() {
  return useContext(Context);
}
