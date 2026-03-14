/** Kapitalisasi huruf awal tiap kata. Contoh: "andiana siregar" -> "Andiana Siregar" */
export function capitalizeWords(str: string): string {
  if (!str || !str.trim()) return str;
  return str
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

const BULAN_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

/** Hitung usia dari tanggal lahir (YYYY-MM-DD) per hari ini */
export function computeAgeFromDate(dateStr: string | null): number | null {
  if (!dateStr || !dateStr.trim()) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

/** Format tanggal lahir untuk tampilan: "09 Februari 2000 (26 tahun)" */
export function formatDateOfBirthDisplay(dateOfBirth: string | null): string {
  if (!dateOfBirth || !dateOfBirth.trim()) return '-';
  const d = new Date(dateOfBirth);
  if (isNaN(d.getTime())) return '-';
  const day = d.getDate();
  const month = BULAN_ID[d.getMonth()];
  const year = d.getFullYear();
  const age = computeAgeFromDate(dateOfBirth);
  return age != null ? `${day} ${month} ${year} (${age} tahun)` : `${day} ${month} ${year}`;
}
