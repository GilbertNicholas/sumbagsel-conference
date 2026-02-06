'use client';

import { useState, memo, useCallback, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar, SidebarItem } from '@/components/sidebar';
import { removeAuthToken } from '@/lib/auth';
import { useRouter } from 'next/navigation';

const navItems: SidebarItem[] = [
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
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
      </svg>
    ),
  },
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

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/register': 'Pendaftaran',
  '/schedule/arrival': 'Jadwal Kedatangan',
  '/profile/me': 'Profil Saya',
};

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

  const pageTitle = useMemo(() => pageTitles[pathname || ''] || 'Dashboard', [pathname]);
  const bgColor = useMemo(() => pathname === '/dashboard' ? 'bg-[#F5F5F0]' : 'bg-gray-50', [pathname]);

  return (
    <div className={`flex min-h-screen ${bgColor}`}>
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
          <h1 className="text-lg font-semibold text-gray-900">{pageTitle}</h1>
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
      <div className="flex-1 lg:ml-64 min-h-screen overflow-x-hidden overflow-y-auto transition-all duration-300 flex items-center">
        <div className="w-full pt-16 lg:py-8 p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </div>
    </div>
  );
});
