'use client';

import { useState, memo, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { Sidebar, SidebarItem } from '@/components/sidebar';
import { removeAuthToken } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { FEATURES } from '@/lib/features';

const allNavItems: SidebarItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    label: 'Daftar Konferensi',
    path: '/register',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    label: 'Jadwal Kedatangan',
    path: '/schedule/arrival',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0011.5 2 1.5 1.5 0 0010 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
      </svg>
    ),
  }, // FEATURES.arrivalSchedule - set true to show in sidebar
  {
    label: 'Profile',
    path: '/profile/me',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    label: 'Sign Out',
    path: '/',
    isLogout: true,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
    ),
  },
];

const navItems = allNavItems.filter((item) => item.path !== '/schedule/arrival' || FEATURES.arrivalSchedule);

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = memo(function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();

  const handleLogout = useCallback(() => {
    removeAuthToken();
    router.push('/');
  }, [router]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  const isDashboard = pathname === '/dashboard';
  const isRegister = pathname?.startsWith('/register') ?? false;
  const isProfile = pathname?.startsWith('/profile') ?? false;
  const hasBgImage = isDashboard || isRegister || isProfile;

  return (
    <div className={`flex min-h-screen ${hasBgImage ? '' : 'bg-gray-50'}`}>
      {/* Navbar untuk Mobile */}
      <nav className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-gray-700 p-2"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isSidebarOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
          <div className="flex-1 flex justify-center">
            <Image
              src="/images/sumbagsel-logo.png"
              alt="Sumbagsel Conference"
              width={140}
              height={36}
              className="h-8 w-auto object-contain"
            />
          </div>
          <div className="w-10"></div> {/* Spacer untuk centering */}
        </div>
      </nav>

      {/* Sidebar */}
      <Sidebar 
        items={navItems} 
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        onToggle={toggleSidebar}
        onClose={closeSidebar}
      />

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 min-h-screen overflow-x-hidden overflow-y-auto transition-all duration-300 flex items-center relative">
        {hasBgImage && (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url('/images/${isDashboard ? 'dashboard' : isProfile ? 'profile' : 'register'}-bg${isProfile ? '' : '-batam'}.png')` }}
              aria-hidden
            />
            <div
              className="absolute inset-0 bg-[radial-gradient(ellipse_140%_140%_at_50%_50%,rgba(255,255,255,0.75)_0%,rgba(255,255,255,0.3)_50%,transparent_70%)]"
              aria-hidden
            />
          </>
        )}
        <div className="relative z-10 w-full pt-24 lg:pt-8 lg:py-8 p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </div>
    </div>
  );
});
