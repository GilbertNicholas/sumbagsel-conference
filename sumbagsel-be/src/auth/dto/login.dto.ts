import { IsString, Matches } from 'class-validator';

export class LoginDto {
  @IsString({ message: 'Nomor WhatsApp harus berupa string' })
  @Matches(/^(\+62|0)[0-9]{9,12}$/, {
    message: 'Nomor WhatsApp harus dalam format Indonesia (08xx atau +628xx)',
  })
  phoneNumber: string;
}

