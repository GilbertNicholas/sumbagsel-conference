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
  shirtSize: string | null;
  children: RegistrationChildResponseDto[];
  rejectReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}
