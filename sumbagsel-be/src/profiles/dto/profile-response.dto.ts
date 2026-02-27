export class ProfileResponseDto {
  id: string;
  fullName: string;
  churchName: string;
  ministry: string | null;
  contactEmail: string | null;
  phoneNumber: string | null;
  specialNotes: string | null;
  isCompleted: boolean;
}

