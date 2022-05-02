import { getTotalPlay } from "./game";
import { Game, AnswerState, GameStats } from "./types";
import confetti from "./animation";
import { encode } from "./codec";
import { rainEmoji } from "../components/EmojiRain";
import Alert from "../components/Alert";

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

  if (stats.distribution[6] + fail > totalPlay / 3) {
    message6.push("Hobi amat mepet", "Suka angka 6?");
  }

  if (totalPlay > 7 && fail > totalPlay / 3) {
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

const LOVE_HASHES = [
  "Z1mteFF1",
  "b1GybVh1",
  "d1W/bVF1",
  "dl:sZV51",
  "bV6jZVh1",
  "ZmWt[1F1",
  "clmqZVh1",
  "blGtbll1",
  "eGWreWN1",
  "dlmt[GV1",
];

const EID_HASHES = [
  "cV:nc151",
  "cFGnbWJ1",
  "ZlG/bV51",
  "[lm/dll1",
  "dGWgd1F1",
  "d1GrZWR1",
  "flGqZWR1",
  "[V2ud1l1",
  "bFmrZVx1",
  "bV6yZVZ1",
  "d1GhZWJ1",
  "eGWreWN1",
];

export function handleSubmitWord(game: Game, userAnswer: string) {
  if (game.num === 25 && LOVE_HASHES.includes(encode(userAnswer))) {
    const loveEmojis = ["💖", "💗", "💘", "💙", "💚", "💛", "💜", "💝"];
    const emoji = loveEmojis[Math.floor(Math.random() * loveEmojis.length)];
    return rainEmoji(emoji);
  }

  if (game.num === 102 && EID_HASHES.includes(encode(userAnswer))) {
    return rainEmoji("🙏");
  }
}

interface GameCompleteOptions {
  hash: string;
  attempt: number;
  stats: GameStats;
  cb?: () => void;
}

export function handleGameComplete(options: GameCompleteOptions) {
  const { hash, attempt, stats, cb } = options;
  const message = getCongratulationMessage(attempt, stats);
  Alert.show(message, {
    id: "finish",
    duration: 1250,
    cb,
  });

  if (hash === "eVy/ZVh1") {
    return confetti();
  }

  if (hash === "ZlWxZVt1" && attempt === 1) {
    return rainEmoji("💩");
  }
}
