import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const kbbi = await fetch("https://kbbi.vercel.app").then((res) => res.json());
  const words = kbbi.entries
    .map((entry) => {
      const [word] = entry.split("/").reverse();
      return word;
    })
    .filter((word) => /^[a-z]+$/.test(word) && word.length === 5)
    .concat(october2021)
    .sort();

  res.setHeader(
    "Cache-Control",
    "public, s-maxage=3600, stale-while-revalidate=86400"
  );
  res.status(200).json(Array.from(new Set(words)));
}

const october2021 = [
  "abate",
  "abjat",
  "ampet",
  "arame",
  "asrot",
  "azeri",
  "azuki",
  "bakes",
  "benin",
  "beton",
  "bezit",
  "bksda",
  "botia",
  "burma",
  "cekah",
  "cekat",
  "cenah",
  "colon",
  "dapuk",
  "datau",
  "datin",
  "datum",
  "denar",
  "dobra",
  "doula",
  "duvet",
  "filem",
  "folio",
  "gabut",
  "gayor",
  "gokil",
  "gravi",
  "hipmi",
  "ilyas",
  "impun",
  "india",
  "islan",
  "kabul",
  "kalke",
  "kazak",
  "korea",
  "kudet",
  "kurdi",
  "kwaca",
  "lakip",
  "mandu",
  "maori",
  "nuget",
  "ompok",
  "palau",
  "panda",
  "pasto",
  "porus",
  "rasis",
  "rouks",
  "rupst",
  "sango",
  "sapun",
  "silpa",
  "sonde",
  "struk",
  "sudan",
  "swazi",
  "tafia",
  "tajik",
  "tando",
  "tenge",
  "titis",
  "tonga",
  "tuhur",
  "uwete",
  "uzbek",
  "venda",
];
