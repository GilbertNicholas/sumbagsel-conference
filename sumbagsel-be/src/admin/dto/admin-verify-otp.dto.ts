import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class AdminVerifyOtpDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^(\+62|0)[0-9]{9,12}$/, {
    message: 'Nomor harus dalam format Indonesia (08xx atau +628xx)',
  })
  phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]{6}$/, { message: 'Kode OTP harus 6 digit angka' })
  otp: string;
}
