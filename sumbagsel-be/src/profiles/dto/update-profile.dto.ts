import { IsString, IsOptional, MaxLength, IsEmail, IsBoolean, IsIn } from 'class-validator';
import { MINISTRY_OPTIONS } from './create-profile.dto';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @MaxLength(150)
  fullName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(150)
  churchName?: string;

  @IsString()
  @IsOptional()
  @IsIn(MINISTRY_OPTIONS, { message: 'Ministry must be one of: Teens/Campus, Single/S2, Married' })
  ministry?: string;

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

