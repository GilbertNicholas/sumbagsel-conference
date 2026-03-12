import { IsString, MinLength, Matches } from 'class-validator';

export class AdminRequestOtpDto {
  @IsString({ message: 'Nomor WhatsApp atau email harus diisi' })
  @MinLength(1, { message: 'Nomor WhatsApp atau email harus diisi' })
  @Matches(/^(\+62|0)[0-9]{9,12}$|^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
    message: 'Masukkan nomor WhatsApp (08xx atau +628xx) atau alamat email yang valid',
  })
  identifier: string;
}
