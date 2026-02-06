import { IsString, IsNotEmpty, IsOptional, MaxLength, IsEmail } from 'class-validator';

export class CreateProfileDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  fullName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  churchName: string;

  @IsEmail()
  @IsOptional()
  @MaxLength(255)
  contactEmail?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  photoUrl?: string;

  @IsString()
  @IsOptional()
  specialNotes?: string;
}

