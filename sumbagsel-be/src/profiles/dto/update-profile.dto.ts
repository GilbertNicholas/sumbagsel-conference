import { IsString, IsOptional, MaxLength, IsEmail, IsBoolean } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @MaxLength(150)
  fullName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(150)
  churchName?: string;

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

  @IsBoolean()
  @IsOptional()
  isCompleted?: boolean;
}

