/** Opsi asal gereja utama (selalu tampil di filter) */
export const MAIN_CHURCH_OPTIONS = [
  'GKDI Batam',
  'GKDI Bangka',
  'GKDI Jambi',
  'GKDI Palembang',
  'GKDI Lampung',
] as const;

/** Nilai filter untuk gereja "Lainnya" (custom) */
export const CHURCH_FILTER_OTHER = '__lainnya__';

/** Opsi ministry (selalu tampil di filter) */
export const MINISTRY_OPTIONS = ['Teens/Campus', 'Single/S2', 'Married'] as const;

/** Opsi gender */
export const GENDER_OPTIONS = ['Pria', 'Wanita'] as const;

/** Opsi usia anak (7-12 tahun sesuai ketentuan) */
export const CHILD_AGE_OPTIONS = [7, 8, 9, 10, 11, 12] as const;

/** Opsi size baju */
export const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'] as const;
