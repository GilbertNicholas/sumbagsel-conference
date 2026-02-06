# SumBagSel Church Region Website
Product Brief v1

## Goal
Membangun website gereja untuk region SumBagSel.
Tahap awal fokus pada autentikasi dan profile user.

## Core Flow
1. User dapat login atau signup menggunakan email password atau Google.
2. Setelah login:
   - Jika profile belum ada atau belum lengkap, arahkan ke halaman Input Profile.
   - Jika profile sudah lengkap, arahkan ke Dashboard.
3. Saat ini halaman yang tersedia:
   - Dashboard
   - Input Profile
   - Detail Profile

## Profile Fields v1
- Nama
- Email
- Church asal gereja
- Foto
- Password

Catatan penting:
Email dan Password untuk login berada di domain User dan Auth.
Profile menyimpan data identitas komunitas dan data pelayanan.
Password tidak boleh disimpan di tabel profile.

## Non Functional Requirements
1. Mobile friendly.
2. Maintainable karena fitur akan berkembang.
3. Backend dan database dibuat terlebih dahulu lengkap dengan tipe data.
4. Gunakan Docker.

## Out of Scope v1
- Fitur event, news, directory gereja.
- Role admin khusus.
- Multi region di luar SumBagSel.

## Success Criteria v1
- User dapat login atau signup.
- Sistem redirect otomatis ke Input Profile bila profile belum lengkap.
- User dapat mengisi profile lalu masuk Dashboard.
- Semua berjalan via Docker Compose.
