import { IsEmail, IsOptional, IsString, MaxLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class AdminUpdateParticipantContactDto {
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsEmail({}, { message: 'Format email tidak valid' })
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  @MaxLength(20)
  @Matches(/^[0-9+\s-]*$/, { message: 'Nomor telepon hanya boleh berisi angka, +, -, atau spasi' })
  phoneNumber?: string;
}
