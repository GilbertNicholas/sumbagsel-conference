export class ParticipantResponseDto {
  id: string;
  userId: string;
  fullName: string;
  churchName: string;
  ministry: string | null;
  gender: string | null;
  phoneNumber: string | null;
  email: string;
  status: string;
  registrationId: string | null;
  paymentProofUrl: string | null;
  checkedInAt: string | null;
  shirtSize: string | null;
  createdAt: string;
  updatedAt: string;
}
