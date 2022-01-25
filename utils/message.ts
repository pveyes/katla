export function getCongratulationMessage(attempt: number, totalPlay: number) {
  if (totalPlay === 0 && attempt === 0) {
    return "Curang bukan nih?";
  }

  switch (attempt) {
    case 0:
      return "Hoki? Atau kena spoiler?";
    case 1:
      return "Luar Biasa";
    case 2:
      return "Mantap";
    case 3:
      return "Bagus Sekali";
    case 4:
      return "Bagus";
    default:
      return "Nyaris!!";
  }
}
