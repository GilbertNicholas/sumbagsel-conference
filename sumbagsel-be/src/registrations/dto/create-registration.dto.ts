import { IsString, IsOptional } from 'class-validator';

export class CreateRegistrationDto {
  @IsString()
  @IsOptional()
  paymentProofUrl?: string;
}
