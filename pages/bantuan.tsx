import { FormEvent, useEffect, useState } from "react";
import LocalStorage from "../utils/browser";
import {
  GAME_STATE_KEY,
  GAME_STATS_KEY,
  INVALID_WORDS_KEY,
  LAST_HASH_KEY,
  LAST_SESSION_RESET_KEY,
} from "../utils/constants";

export default function Debug(props: { hashed: string }) {
  const [debugCode, setDebugCode] = useState("");
  useEffect(() => {
    const gameState = LocalStorage.getItem(GAME_STATE_KEY);
    const gameStats = LocalStorage.getItem(GAME_STATS_KEY);
    const lastHash = LocalStorage.getItem(LAST_HASH_KEY);
    const invalidWords = LocalStorage.getItem(INVALID_WORDS_KEY);
    const lastSessionReset = LocalStorage.getItem(LAST_SESSION_RESET_KEY);
    const now = new Date();
    let timezone = "Unknown";
    try {
      timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (err) {}

    setDebugCode(
      btoa(
        [
          props.hashed,
          lastHash,
          gameState,
          gameStats,
          invalidWords,
          lastSessionReset,
          now.getTime(),
          now.getTimezoneOffset(),
          timezone,
          navigator.userAgent,
          window.location.host,
        ].join(":")
      )
    );
    // eslint-disable-next-line
  }, []);

  const messagePrefix = `Halo, saya ingin melaporkan masalah tentang ...`;
  const mailToLink = `mailto:help@katla.id?subject=Problem katla&body=${messagePrefix}%0D%0A%0D%0AKode: ${debugCode}`;

  const confirmImport = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // @ts-ignore
    const newDebugCode = e.target.debugCode.value;
    let confirmed: boolean;
    if (newDebugCode === debugCode) {
      confirmed = window.confirm(
        "Kode yang anda masukkan sama dengan kode di perangkat ini. Apakah anda yakin ingin mengimpor?"
      );
    } else {
      confirmed = window.confirm(
        "Statistik yang ada di perangkat ini akan diganti dari statistik dari kode. Apakah anda yakin?"
      );
    }

    if (!confirmed) return;

    try {
      const decoded = atob(newDebugCode);
      const st0 = decoded.indexOf('{"distribution');
      const ste = decoded.indexOf("}:");
      const stats = decoded.slice(st0, ste + 1);
      LocalStorage.setItem(GAME_STATS_KEY, stats);
      alert("Statistik berhasil diimpor");
      window.location.replace("/");
    } catch (err) {
      console.error(err);
      alert("Kode yang anda masukkan tidak valid");
    }
  };

  return (
    <div className="dark:text-white max-w-lg mx-auto mt-4 px-3">
      <NewSiteWarning />
      <h1 className="text-3xl mb-4">Bantuan</h1>
      {debugCode === "" ? (
        <span>Generating debug code...</span>
      ) : (
        <>
          <p className="mb-4">
            Klik{" "}
            <a className="underline text-blue-400" href={mailToLink}>
              tautan berikut
            </a>{" "}
            untuk mengirim email.
          </p>
          <p className="mb-4">
            Klik {/* eslint-disable-next-line */}
            <a href="/" className="underline text-blue-400">
              tautan berikut
            </a>{" "}
            untuk kembali ke beranda
          </p>
          <strong>Kode bantuan</strong>
          <pre className="border border-gray-300 p-3 whitespace-pre-wrap break-all ">
            {debugCode}
          </pre>
        </>
      )}
      <h2 className="text-2xl mt-4 mb-4">Impor Statistik</h2>
      <p className="mb-4">
        Masukkan debug code yang anda dapat dari halaman ini di perangkat lain
        untuk mengimpor statistik dari perangkat tersebut
      </p>
      <form onSubmit={confirmImport}>
        <textarea
          name="debugCode"
          className="w-full h-64 border border-gray-300 p-2 rounded-r overflow-hidden"
          placeholder="Salin kode di sini"
        />
        <button
          type="submit"
          className="border-none px-3 py-1 bg-accent text-white rounded-sm overflow-hidden mb-4"
        >
          Impor
        </button>
      </form>
    </div>
  );
}

function NewSiteWarning() {
  return (
    <div className="mx-auto text-sm mb-4 p-3 bg-yellow-100 text-black rounded-sm overflow-hidden">
      <p className="mb-2">
        Mulai 4 Oktober 2023, Katla akan menggunakan domain baru di{" "}
        <a href="https://katla.id" className="underline">
          katla.id
        </a>
        . Statistik permainan anda akan dipindahkan secara otomatis.
      </p>
    </div>
  );
}

export { getStaticProps } from "./index";
