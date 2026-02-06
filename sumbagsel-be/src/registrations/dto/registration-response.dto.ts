import { RegistrationStatus } from '../../entities/registration.entity';

export class RegistrationResponseDto {
  id: string;
  userId: string;
  paymentProofUrl: string | null;
  status: RegistrationStatus;
  createdAt: Date;
  updatedAt: Date;
}
