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
    </>
  );
}
