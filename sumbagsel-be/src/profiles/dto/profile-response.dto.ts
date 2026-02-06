export class ProfileResponseDto {
  id: string;
  fullName: string;
  churchName: string;
  contactEmail: string | null;
  phoneNumber: string | null;
  photoUrl: string | null;
  specialNotes: string | null;
  isCompleted: boolean;
}

