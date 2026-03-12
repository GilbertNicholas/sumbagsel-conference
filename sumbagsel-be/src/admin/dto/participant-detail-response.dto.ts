export class ParticipantDetailChildDto {
  id: string;
  name: string;
  age: number;
  needsConsumption: boolean;
  checkedInAt: string | null;
}

export class ParticipantDetailResponseDto {
  id: string;
  userId: string;
  fullName: string;
  churchName: string;
  ministry: string | null;
  gender: string | null;
  age: number | null;
  phoneNumber: string | null;
  email: string;
  specialNotes: string | null;
  status: string;
  paymentProofUrl: string | null;
  children: ParticipantDetailChildDto[];
  baseAmount: number | null;
  totalAmount: number | null;
  uniqueCode: string | null;
  shirtSize: string | null;
  checkedInAt: string | null;
  rejectReason: string | null;
  createdAt: string;
  updatedAt: string;
}
