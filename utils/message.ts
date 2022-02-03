import { getTotalPlay } from "./score";
import { AnswerState, GameStats } from "./types";

export function getCongratulationMessage(attempt: number, stats: GameStats) {
  const totalPlay = getTotalPlay(stats);

  if (totalPlay === 0 && attempt === 1) {
    return randomElement(["Curang bukan?", "Mencurigakan"]);
  }

  const message1 = ["Hoki? Atau kena spoiler", "Serius nih?"];
  const message2 = ["Luar Biasa", "Jagoan", "Kebanggaan negara", "Cerdas"];
  const message3 = ["Mantap", "Pintar", "Keren", "Salut", "Hebat!!"];
  const message4 = ["Bagus Sekali", "Selamat!", "Dikit lagi keren", "4 sehat"];
  const message5 = ["Bagus", "Okelah", "5 sempurna", "Tidak buruk"];
  const message6 = ["Nyaris!!", "Mepet!", "Hampir aja"];

  if (stats.distribution[1] > 2 || stats.distribution.fail > 2) {
    message1.push("Mencurigakan");
  }

  if (stats.distribution[6] > 1) {
    message6.push("Tetap semangat!", "Mungkin besok lebih baik");
  }

  if (stats.distribution[6] + stats.distribution.fail > 4) {
    message6.push("Hobi amat mepet", "Suka angka 6?");
  }

  if (stats.distribution.fail > 4) {
    message6.push("Hampir dideportasi");
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

  if (answerStates.filter((state) => state === "correct").length === 4) {
    messageFail.push("Sabar ya", "Wkwkwkwk", "Upss");
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
