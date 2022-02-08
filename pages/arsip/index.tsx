import { differenceInDays } from "date-fns";

import Container from "../../components/Container";
import Header from "../../components/Header";
import Link from "../../components/Link";

export default function Arsip() {
  const start = new Date("2022-01-20");
  const now = new Date();
  const diff = differenceInDays(now, start);

  return (
    <Container>
      <Header
        title="Katla | Arsip"
        keywords={[
          "arsip",
          "archive",
          "game",
          "permainan",
          "tebak",
          "kata",
          "rahasia",
          "wordle",
          "indonesia",
          "kbbi",
        ]}
        ogImage="https://katla.vercel.app/og-arsip.png"
      />
      <div className="px-4 mx-auto max-w-lg w-full pt-2 pb-4 text-left">
        <h2 className="text-2xl font-semibold mb-4">Arsip</h2>
        <p className="mb-2">
          Berikut adalah daftar kata telah digunakan sebelumnya. Kamu bisa
          menggunakan <em>link</em> di bawah, atau langsung memasukkan alamat
          pada <em>address bar</em> sesuai angka hari, misal:{" "}
          <a href="https://katla.vercel.app/arsip/1" className="color-accent">
            https://katla.vercel.app/arsip/1
          </a>
        </p>
        <p className="mb-2">
          Arsip hanya mencakup daftar di masa lalu dan tidak dapat digunakan
          untuk melihat masa depan 😌
        </p>
        <ol className="mx-8 list-disc">
          {Array(diff - 1)
            .fill("")
            .map((_, i) => (
              <li key={i}>
                <Link href={`/arsip/${i + 1}`}>{`Hari ke-${i + 1}`}</Link>
              </li>
            ))}
        </ol>
      </div>
    </Container>
  );
}
