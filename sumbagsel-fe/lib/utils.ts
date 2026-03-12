/** Kapitalisasi huruf awal tiap kata. Contoh: "andiana siregar" -> "Andiana Siregar" */
export function capitalizeWords(str: string): string {
  if (!str || !str.trim()) return str;
  return str
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
