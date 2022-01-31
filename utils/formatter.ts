export function formatDate(d: Date) {
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const date = d.getDate();
  return `${year}-${pad0(month)}-${pad0(date)}`;
}

export function formatTime(d: Date) {
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const seconds = d.getSeconds();
  return `${hours}:${pad0(minutes)}:${pad0(seconds)}`;
}

export function pad0(n: number): string {
  return n.toString().padStart(2, "0");
}
