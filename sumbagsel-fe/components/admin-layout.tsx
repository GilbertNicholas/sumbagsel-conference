'use client';

import { useState, memo, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { apiClient } from '@/lib/api-client';
import { FEATURES } from '@/lib/features';

const navItems = [
  { label: 'Data Konferensi', path: '/admin/dashboard', paths: ['/admin/dashboard', '/admin/participants'], icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
  { label: 'Data Baju', path: '/admin/shirt-data', paths: ['/admin/shirt-data'], icon: 'M15 4l6 2v5h-3v8a1 1 0 01-1 1h-10a1 1 0 01-1-1v-8h-3v-5l6-2a3 3 0 006 0' },
  { label: 'Data Anak', path: '/admin/children', paths: ['/admin/children'], icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  ...(FEATURES.arrivalSchedule ? [{ label: 'Arrival Schedules', path: '/admin/arrival-schedules', paths: ['/admin/arrival-schedules'], icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' }] : []),
];

const navActive = 'bg-green-600 text-white';
const navInactive = 'text-gray-800 hover:bg-[#9CA3AF] hover:text-white';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout = memo(function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  const toggleDesktopCollapse = useCallback(() => {
    setIsDesktopCollapsed((prev) => !prev);
  }, []);

  const handleLogout = useCallback(() => {
    apiClient.adminLogout();
    window.location.href = '/admin';
  }, []);

  const isActive = (item: { paths: string[] }) =>
    item.paths.some((p) => pathname === p || pathname?.startsWith(p + '/'));

  const sidebarCollapsed = !isSidebarOpen && isDesktopCollapsed;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile navbar */}
      <nav className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={toggleSidebar}
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
          <div className="w-10" />
        </div>
      </nav>

      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 lg:hidden transition-opacity duration-300 ${
          isSidebarOpen ? 'opacity-100 backdrop-blur-md pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeSidebar}
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
      />

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full bg-[#D1D5DB] text-gray-800 flex flex-col shadow-2xl transition-all duration-300 z-50 lg:z-30 ${
          isSidebarOpen ? 'translate-x-0 w-64' : sidebarCollapsed ? '-translate-x-full lg:translate-x-0 lg:w-16' : '-translate-x-full lg:translate-x-0 lg:w-64'
        }`}
      >
        <div className={`p-4 border-b border-[#9CA3AF] flex flex-col gap-2 ${sidebarCollapsed ? 'lg:items-center lg:py-4' : ''}`}>
          <div className={`flex items-center w-full ${sidebarCollapsed ? 'lg:justify-center' : 'justify-between'}`}>
            <div className={`flex flex-col gap-1 flex-1 flex items-center justify-center ${sidebarCollapsed ? 'lg:gap-2' : ''}`}>
              <Image
                src="/images/sumbagsel-logo.png"
                alt="Logo Sumbagsel"
                width={180}
                height={45}
                className="h-12 w-auto max-w-full object-contain"
              />
              <p className={`text-sm font-semibold text-gray-600 text-center ${sidebarCollapsed ? 'lg:hidden' : ''}`}>Dashboard Admin</p>
            </div>
            <button
            onClick={toggleDesktopCollapse}
            className="hidden lg:flex p-2 rounded hover:bg-[#9CA3AF] hover:text-white transition-colors shrink-0"
            aria-label={sidebarCollapsed ? 'Buka sidebar' : 'Tutup sidebar'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {sidebarCollapsed ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 12h14" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              )}
            </svg>
          </button>
          </div>
        </div>
        <nav className={`flex-1 p-4 space-y-1 overflow-y-auto ${sidebarCollapsed ? 'lg:px-2 lg:py-4' : ''}`}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              onClick={closeSidebar}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive(item) ? navActive : navInactive
              } ${sidebarCollapsed ? 'lg:justify-center lg:px-2 lg:py-3' : ''}`}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              <span className={`text-sm font-medium ${sidebarCollapsed ? 'lg:hidden' : ''}`}>{item.label}</span>
            </Link>
          ))}
          <button
            onClick={() => {
              handleLogout();
              closeSidebar();
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-red-600 hover:bg-red-100 ${sidebarCollapsed ? 'lg:justify-center lg:px-2 lg:py-3' : ''}`}
            title={sidebarCollapsed ? 'Keluar' : undefined}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className={`text-sm font-medium ${sidebarCollapsed ? 'lg:hidden' : ''}`}>Keluar</span>
          </button>
        </nav>
      </aside>

      {/* Main content - overflow-x-hidden agar table tidak tembus; pt-24 seperti user untuk navbar mobile */}
      <main className={`flex-1 min-h-screen pt-24 lg:pt-0 overflow-x-hidden transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        <div className="w-full min-w-0 p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
});
