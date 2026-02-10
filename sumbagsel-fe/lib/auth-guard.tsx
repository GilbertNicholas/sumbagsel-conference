'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getAuthToken } from './auth';
import { apiClient } from './api-client';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const token = getAuthToken();
      const isAuthPage = pathname?.startsWith('/auth');
      const isLandingPage = pathname === '/';
      const isAdminPage = pathname?.startsWith('/admin');

      // ALWAYS allow landing page - no auth check needed
      // Landing page is public and user can choose to login or not
      if (isLandingPage) {
        setIsChecking(false);
        return;
      }

      // Allow access to auth pages and admin pages if no token
      if (!token) {
        if (isAuthPage || isAdminPage) {
          setIsChecking(false);
          return;
        }
        // Redirect to landing page if no token (not directly to login)
        router.push('/');
        return;
      }

      // Skip user auth check for admin pages (admin has separate auth)
      if (isAdminPage) {
        setIsChecking(false);
        return;
      }

      // If has token, check profile status
      try {
        const profile = await apiClient.getMyProfile();
        
        // Check if profile has valid data (not placeholder)
        const hasValidFullName = profile.fullName && 
          profile.fullName.trim() !== '' && 
          profile.fullName !== 'Belum diisi';
        const hasValidChurchName = profile.churchName && 
          profile.churchName.trim() !== '' && 
          profile.churchName !== 'Belum diisi';
        const isProfileValid = hasValidFullName && hasValidChurchName;
        
        // If on auth page but logged in, redirect based on profile status
        if (isAuthPage) {
          if (!isProfileValid) {
            router.push('/profile/setup');
            return;
          }
          router.push('/dashboard');
          return;
        }

        // If profile not valid and not on setup page, redirect to setup
        if (!isProfileValid && pathname !== '/profile/setup') {
          router.push('/profile/setup');
          return;
        }

        // If profile valid and on setup page, redirect to dashboard
        if (isProfileValid && pathname === '/profile/setup') {
          router.push('/dashboard');
          return;
        }
      } catch (error) {
        // If profile doesn't exist or error
        if (isAuthPage) {
          // If on auth page, allow to continue (they'll be redirected after login)
          setIsChecking(false);
          return;
        }
        // If not on setup page, redirect to setup
        if (pathname !== '/profile/setup') {
          router.push('/profile/setup');
          return;
        }
      }

      setIsChecking(false);
    }

    checkAuth();
  }, [router, pathname]);

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-4 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

