import Script from "next/script";

import "../styles/globals.css";

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Script id="metrical" strategy="afterInteractive">{`
        window.metrical = {
          "app": "5bYi95VvH"
        }
      `}</Script>
      <Script
        src="https://cdn.metrical.xyz/script.js"
        strategy="afterInteractive"
      />
    </>
  );
}
