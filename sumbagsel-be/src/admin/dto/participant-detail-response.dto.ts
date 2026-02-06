export class ParticipantDetailResponseDto {
  id: string;
  userId: string;
  fullName: string;
  churchName: string;
  phoneNumber: string | null;
  email: string;
  specialNotes: string | null;
  status: string;
  paymentProofUrl: string | null;
  createdAt: string;
  updatedAt: string;
}
