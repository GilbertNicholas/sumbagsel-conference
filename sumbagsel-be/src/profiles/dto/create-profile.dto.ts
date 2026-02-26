import { IsString, IsNotEmpty, IsOptional, MaxLength, IsEmail, IsIn } from 'class-validator';

export const MINISTRY_OPTIONS = ['Teens/Campus', 'Single/S2', 'Married'] as const;

export class CreateProfileDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  fullName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  churchName: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(MINISTRY_OPTIONS, { message: 'Ministry must be one of: Teens/Campus, Single/S2, Married' })
  ministry: string;

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

