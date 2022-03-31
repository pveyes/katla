import { getTotalPlay } from "./game";
import { AnswerState, GameStats } from "./types";

export function getCongratulationMessage(attempt: number, stats: GameStats) {
  const totalPlay = getTotalPlay(stats);
  const { fail, ...rest } = stats.distribution;

  if (totalPlay === 0 && attempt === 1) {
    return randomElement(["Browser baru?", "Baru main? 👏👏"]);
  }

  const message1 = [
    "Hoki? Atau kena spoiler",
    "Wow",
    "Jenius",
    "Ajaib",
    "Cenayang",
    "Si Peramal",
    "Penjelajah Waktu",
  ];
  const message2 = [
    "Kebanggaan Negara",
    "Kesayangan Ibu Pertiwi",
    "Sakti Mandraguna",
    "Cendekiawan",
    "Kaum Intelek",
  ];
  const message3 = [
    "Luar Biasa!",
    "Jagoan!",
    "Mantap!",
    "Cerdas!",
    "Keren!",
    "Salut!",
    "Hebat!",
    "Lantip!",
    "Brilian!",
    "Otak Cemerlang",
  ];
  const message4 = [
    "Bagus Sekali",
    "Cermat",
    "Pintar",
    "Teladan",
    "Idaman",
    "Cerdik",
    "Encer",
  ];
  const message5 = ["Bagus", "Horee", "Selamat!", "Pandai"];
  const message6 = ["Nyaris!!!", "Hampir saja", "Lega!!"];

  if (stats.distribution[6] + fail > 7) {
    message6.push("Hobi amat mepet", "Suka angka 6?");
  }

  if (fail > 7) {
    message6.push("Hampir dideportasi");
  }

  if (totalPlay > 7) {
    message4.push("4 Sehat", "Dikit lagi Keren!");
    message5.push("5 sempurna", "Tidak buruk", "Okelah");
    message6.push("Mepet!");

    if (stats.distribution[6] > 3) {
      message6.push("Tetap semangat!", "Mungkin besok lebih baik");
    }

    if (stats.distribution[attempt] === 0) {
      const bestMove = Object.values(rest).findIndex((value) => value > 0) + 1;
      if (attempt < bestMove && stats.distribution[bestMove] > 3) {
        return "Akhirnyaaa 🥳";
      }
    }
  }

  switch (attempt) {
    case 1:
      return randomElement(message1);
    case 2:
      return randomElement(message2);
    case 3:
      return randomElement(message3);
    case 4:
      return randomElement(message4);
    case 5:
      return randomElement(message5);
    default:
      return randomElement(message6);
  }
}

export function getFailureMessage(
  stats: GameStats,
  answerStates: AnswerState[]
) {
  const messageFail = ["Sayang sekali"];

  if (answerStates.filter((state) => state === "c").length === 4) {
    messageFail.push("Sabar ya", "Dikiit lagi 🤏", "Upss");
  }

  if (stats.distribution.fail > 1) {
    messageFail.push(
      "Jangan menyerah",
      "Coba lagi besok",
      "Masih belum beruntung"
    );
  }

  if (stats.distribution.fail > 3) {
    messageFail.push("Belajar lagi");
  }

  return randomElement(messageFail);
}

function randomElement<T>(array: T[]): T {
  const index = Math.floor(Math.random() * array.length);
  return array[index];
}
