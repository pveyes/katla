import { FormEvent, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Container from "../components/Container";
import Header from "../components/Header";
import LocalStorage from "../utils/browser";
import {
  GAME_STATE_KEY,
  GAME_STATS_KEY,
  INVALID_WORDS_KEY,
  LAST_HASH_KEY,
  LAST_SESSION_RESET_KEY,
} from "../utils/constants";
import { useTodayHashed } from "../utils/today";

export default function Debug() {
  const hashed = useTodayHashed();
  const [debugCode, setDebugCode] = useState("");
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLPreElement>(null);

  function selectCode() {
    const node = codeRef.current;
    if (!node) {
      return;
    }
    const range = document.createRange();
    range.selectNodeContents(node);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }

  async function copyCode() {
    selectCode();
    try {
      await navigator.clipboard.writeText(debugCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // clipboard is unavailable, the code stays selected so it can be copied by hand
    }
  }
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
          hashed,
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
  }, [hashed]);

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
    <Container>
      <Header title="Katla | Bantuan" path="/bantuan" />
      <div className="max-w-lg w-full mx-auto px-4 pb-8 text-left">
        <Link
          to="/"
          className="inline-flex items-center gap-1 color-accent font-semibold mb-4"
        >
          <span aria-hidden="true">&larr;</span> Kembali ke beranda
        </Link>
        <h1 className="text-3xl mb-4">Bantuan</h1>
        {debugCode === "" ? (
          <span>Membuat kode bantuan...</span>
        ) : (
          <>
            <p className="mb-4">
              Klik{" "}
              <a className="underline color-accent" href={mailToLink}>
                tautan berikut
              </a>{" "}
              untuk mengirim email.
            </p>
            <strong>Kode bantuan</strong>
            <pre
              ref={codeRef}
              onClick={selectCode}
              title="Klik untuk memilih seluruh kode"
              className="border border-line bg-surface rounded-xl p-3 whitespace-pre-wrap break-all cursor-pointer select-all mb-2"
            >
              {debugCode}
            </pre>
            <button
              type="button"
              onClick={copyCode}
              className="bg-accent text-white rounded-xl px-4 py-2 mb-4"
            >
              {copied ? "Kode tersalin" : "Salin kode"}
            </button>
          </>
        )}
        <h2 className="text-2xl mt-4 mb-4">Impor Statistik</h2>
        <p className="mb-4">
          Masukkan{" "}
          <button
            type="button"
            onClick={() => {
              codeRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
              copyCode();
            }}
            disabled={debugCode === ""}
            title="Klik untuk memilih dan menyalin kode bantuan"
            className="underline color-accent"
          >
            kode bantuan
          </button>{" "}
          yang anda dapat dari halaman ini di perangkat lain untuk mengimpor
          statistik dari perangkat tersebut
        </p>
        <form onSubmit={confirmImport}>
          <textarea
            name="debugCode"
            className="w-full h-64 border border-line bg-surface rounded-xl p-3 overflow-hidden"
            placeholder="Salin kode di sini"
          />
          <button
            type="submit"
            className="border-none px-4 py-2 bg-accent text-white rounded-xl overflow-hidden mb-4"
          >
            Impor
          </button>
        </form>
      </div>
    </Container>
  );
}
