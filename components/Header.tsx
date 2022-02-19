import Head from "next/head";
import { ReactNode } from "react";

interface Props {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  customHeading?: ReactNode;
  warnStorageDisabled?: boolean;
  themeColor?: string;
  onShowStats?: () => void;
  onShowHelp?: () => void;
  onShowSettings?: () => void;
}

export default function Header(props: Props) {
  const {
    title = "Katla - Permainan Tebak Kata | 1 Hari 1 Kata 6 Kesempatan",
    description = "Tebak kata rahasia dalam 6 percobaan. Kata baru tersedia setiap hari.",
    keywords = [
      "game",
      "permainan",
      "main",
      "tebak",
      "kata",
      "rahasia",
      "sembunyi",
      "clue",
      "petunjuk",
      "wordle",
      "bahasa",
      "indonesia",
      "karya",
      "anak",
      "bangsa",
      "kbbi",
    ],
    ogImage = "https://katla.vercel.app/og.png",
    customHeading,
    onShowStats,
    onShowHelp,
    onShowSettings,
    warnStorageDisabled,
    themeColor = "#15803D",
  } = props;
  return (
    <header className="px-4 mx-auto max-w-lg w-full pt-2 pb-4" id="header">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="keywords" content={keywords.join(", ")} />
        <meta property="og:url" content="https://katla.vercel.app/" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:keywords" content={keywords.join(", ")} />
        <meta property="og:image" content={ogImage} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta property="twitter:domain" content="katla.vercel.app" />

        <meta name="theme-color" content={themeColor} />
        <link href="/katla-32x32.png" rel="icon shortcut" sizes="3232" />
        <link href="/katla-192x192.png" rel="apple-touch-icon" />
      </Head>
      {warnStorageDisabled && (
        <div className="text-xs mb-2 text-yellow-800 dark:text-yellow-200">
          Browser yang kamu gunakan saat ini tidak dapat menyimpan progres
          permainan seperti jawaban sementara dan statistik. Silahkan gunakan
          browser lain untuk pengalaman yang lebih optimal.
        </div>
      )}
      <div className="border-b border-b-gray-500  relative text-gray-500">
        <h1
          className="uppercase text-4xl dark:text-gray-200 text-gray-900 font-bold w-max mx-auto relative z-10 mb-2"
          style={{ letterSpacing: 4 }}
        >
          {customHeading ? customHeading : "Katla"}
        </h1>
        <div className="absolute flex flex-row items-center justify-between inset-0">
          <button
            onClick={onShowHelp}
            title="Bantuan"
            aria-label="Pengaturan"
            style={{ visibility: onShowHelp ? "visible" : "hidden" }}
            tabIndex={-1}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24"
              viewBox="0 0 24 24"
              width="24"
            >
              <path
                fill="currentColor"
                d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"
              ></path>
            </svg>
          </button>
          <div className="flex space-x-2">
            <button
              onClick={onShowStats}
              title="Statistik"
              aria-label="Statistik"
              style={{ visibility: onShowStats ? "visible" : "hidden" }}
              tabIndex={-1}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24"
                viewBox="0 0 24 24"
                width="24"
              >
                <path
                  fill="currentColor"
                  d="M16,11V3H8v6H2v12h20V11H16z M10,5h4v14h-4V5z M4,11h4v8H4V11z M20,19h-4v-6h4V19z"
                ></path>
              </svg>
            </button>
            <button
              onClick={onShowSettings}
              title="Pengaturan"
              aria-label="Pengaturan"
              style={{ visibility: onShowSettings ? "visible" : "hidden" }}
              tabIndex={-1}
            >
              <svg
                viewBox="0 0 24 24"
                width="24"
                height="24"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
