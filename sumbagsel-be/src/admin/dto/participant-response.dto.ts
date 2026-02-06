export class ParticipantResponseDto {
  id: string;
  userId: string;
  fullName: string;
  churchName: string;
  phoneNumber: string | null;
  email: string;
  status: string;
  paymentProofUrl: string | null;
  createdAt: string;
  updatedAt: string;
}
