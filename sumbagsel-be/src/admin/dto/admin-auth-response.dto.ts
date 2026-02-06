export class AdminAuthResponseDto {
  accessToken: string;
  admin: {
    id: string;
    code: string;
    name: string | null;
  };
}
