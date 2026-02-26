import { IsString, Matches, Length } from 'class-validator';

export class VerifyOtpDto {
  @IsString({ message: 'Nomor WhatsApp harus berupa string' })
  @Matches(/^(\+62|0)[0-9]{9,12}$/, {
    message: 'Nomor WhatsApp harus dalam format Indonesia (08xx atau +628xx)',
  })
  phoneNumber: string;

  @IsString({ message: 'Kode OTP harus berupa string' })
  @Length(6, 6, { message: 'Kode OTP harus 6 digit' })
  @Matches(/^[0-9]{6}$/, { message: 'Kode OTP harus berupa angka 6 digit' })
  otp: string;
}
