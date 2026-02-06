import { IsString, IsOptional } from 'class-validator';

export class UpdateRegistrationDto {
  @IsString()
  @IsOptional()
  paymentProofUrl?: string;
}
