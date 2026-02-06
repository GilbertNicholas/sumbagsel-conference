'use client';

import { AuthGuard } from '@/lib/auth-guard';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}

