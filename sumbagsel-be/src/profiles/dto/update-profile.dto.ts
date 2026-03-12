import { IsString, IsOptional, MaxLength, IsEmail, IsBoolean, IsIn, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { MINISTRY_OPTIONS, GENDER_OPTIONS } from './create-profile.dto';

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
  @IsIn(GENDER_OPTIONS, { message: 'Gender must be Pria or Wanita' })
  gender?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(13, { message: 'Usia minimal 13 tahun' })
  @Max(100, { message: 'Usia maksimal 100 tahun' })
  age?: number;

  @IsString()
  @IsOptional()
  specialNotes?: string;

  @IsBoolean()
  @IsOptional()
  isCompleted?: boolean;
}

