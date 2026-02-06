export class AuthResponseDto {
  accessToken: string;
  user: {
    id: string;
    email: string;
    isEmailVerified: boolean;
    status: string;
  };
  profileExists: boolean;
  profileCompleted: boolean;
}

