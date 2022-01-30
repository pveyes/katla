export default function getGameNum(gameDate: string): number {
  return Math.ceil(
    (new Date(gameDate).getTime() - new Date("2022-01-20").getTime()) /
      24 /
      60 /
      60 /
      1000
  );
}
