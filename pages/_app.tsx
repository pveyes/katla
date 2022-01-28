import "../styles/globals.css";
import { ThemeProvider } from "next-themes";

export default function MyApp({ Component, pageProps }) {
  return (
    <ThemeProvider attribute="class" storageKey="katla:theme">
      <Component {...pageProps} />
    </ThemeProvider>
  );
}
