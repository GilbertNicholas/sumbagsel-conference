import { RegistrationStatus } from '../../entities/registration.entity';
import { RegistrationChildResponseDto } from './registration-child-response.dto';

export class RegistrationResponseDto {
  id: string;
  userId: string;
  paymentProofUrl: string | null;
  status: RegistrationStatus;
  uniqueCode: string | null;
  totalAmount: number | null;
  baseAmount: number | null;
  children: RegistrationChildResponseDto[];
  createdAt: Date;
  updatedAt: Date;
}
