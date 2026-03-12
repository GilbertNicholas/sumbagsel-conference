export class ShirtDataRowDto {
  id: string;
  fullName: string;
  churchName: string;
  shirtSize: string;
  phoneNumber: string | null;
  email: string;
}

export class ShirtDataResponseDto {
  totalsBySize: Record<string, number>;
  rows: ShirtDataRowDto[];
}
