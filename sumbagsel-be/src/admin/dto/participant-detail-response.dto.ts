export class ParticipantDetailChildDto {
  id: string;
  name: string;
  age: number;
}

export class ParticipantDetailResponseDto {
  id: string;
  userId: string;
  fullName: string;
  churchName: string;
  ministry: string | null;
  phoneNumber: string | null;
  email: string;
  specialNotes: string | null;
  status: string;
  paymentProofUrl: string | null;
  children: ParticipantDetailChildDto[];
  baseAmount: number | null;
  totalAmount: number | null;
  uniqueCode: string | null;
  checkedInAt: string | null;
  createdAt: string;
  updatedAt: string;
}
