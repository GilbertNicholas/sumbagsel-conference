import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class AdminRequestOtpDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^(\+62|0)[0-9]{9,12}$/, {
    message: 'Nomor harus dalam format Indonesia (08xx atau +628xx)',
  })
  phoneNumber: string;
}
