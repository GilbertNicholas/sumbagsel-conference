import { IsString, MinLength, Matches } from 'class-validator';

export class AdminVerifyOtpDto {
  @IsString({ message: 'Nomor WhatsApp atau email harus diisi' })
  @MinLength(1, { message: 'Nomor WhatsApp atau email harus diisi' })
  @Matches(/^(\+62|0)[0-9]{9,12}$|^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
    message: 'Masukkan nomor WhatsApp (08xx atau +628xx) atau alamat email yang valid',
  })
  identifier: string;

  @IsString()
  @Matches(/^[0-9]{6}$/, { message: 'Kode OTP harus 6 digit angka' })
  otp: string;
}
