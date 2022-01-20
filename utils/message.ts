export function getCongratulationMessage(attempt: number) {
  switch (attempt) {
    case 0:
      return 'Menakjubkan';
    case 1:
      return 'Luar Biasa'
    case 2:
      return 'Mantap'
    case 3:
      return 'Bagus Sekali';
    case 4:
      return 'Bagus'
    default:
      return 'Selamat'
  }
}
