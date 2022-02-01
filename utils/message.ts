import { getTotalPlay } from "./score";
import { GameStats } from "./types";

export function getCongratulationMessage(attempt: number, stats: GameStats) {
  const totalPlay = getTotalPlay(stats);

  if (totalPlay === 0 && attempt === 1) {
    return randomElement(["Curang bukan nih?", "Mencurigakan"]);
  }

  const message1 = ["Hoki? Atau kena spoiler", "Serius nih?"];
  const message2 = ["Luar Biasa", "Salut", "Gokil", "Bisa buat pamer nih"];
  const message3 = ["Mantap", "Pintar", "Keren"];
  const message4 = ["Bagus Sekali", "Dikit lagi keren", "4 sehat"];
  const message5 = ["Bagus", "Okelah", "5 sempurna"];
  const message6 = [
    "Nyaris!!",
    "Mepet!",
    "Dikit lagi",
    "Mungkin besok lebih baik",
  ];

  if (stats.distribution[1] > 2 || stats.distribution.fail > 2) {
    message1.push("Mencurigakan");
  }

  if (stats.distribution[6] + stats.distribution.fail > 2) {
    message6.push("Hobi amat mepet", "Suka angka 6?");
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

function randomElement<T>(array: T[]): T {
  const index = Math.floor(Math.random() * array.length);
  return array[index];
}
