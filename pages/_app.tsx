import Script from "next/script";

import "../styles/globals.css";
import { ThemeProvider } from "next-themes";

export default function MyApp({ Component, pageProps }) {
  return (
    <ThemeProvider storageKey="katla:theme" attribute="class">
      <Component {...pageProps} />
      <Script id="track-ga" strategy="afterInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-QNLF4HTK6S');
      `}</Script>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-QNLF4HTK6S"
        strategy="afterInteractive"
      />
    </ThemeProvider>
  );
}
