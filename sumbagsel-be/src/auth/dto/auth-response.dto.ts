export class AuthResponseDto {
  accessToken: string;
  user: {
    id: string;
    email: string | null;
    isEmailVerified: boolean;
    status: string;
  };
  profileExists: boolean;
  profileCompleted: boolean;
}

