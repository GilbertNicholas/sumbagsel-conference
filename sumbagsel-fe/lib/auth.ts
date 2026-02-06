import Cookies from 'js-cookie';

const TOKEN_COOKIE_NAME = 'token';
const TOKEN_COOKIE_OPTIONS = {
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  expires: 7, // 7 days
};

export function setAuthToken(token: string): void {
  Cookies.set(TOKEN_COOKIE_NAME, token, TOKEN_COOKIE_OPTIONS);
}

export function getAuthToken(): string | undefined {
  return Cookies.get(TOKEN_COOKIE_NAME);
}

export function removeAuthToken(): void {
  Cookies.remove(TOKEN_COOKIE_NAME);
}

export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

