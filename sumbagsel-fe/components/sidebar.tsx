'use client';

import { useState, memo, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export interface SidebarItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  isLogout?: boolean;
}

interface SidebarProps {
  items: SidebarItem[];
  onLogout?: () => void;
  isOpen?: boolean;
  onToggle?: () => void;
  onClose?: () => void;
}

export const Sidebar = memo(function Sidebar({ items, onLogout, isOpen: controlledIsOpen, onToggle, onClose }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  
  // Use controlled state if provided, otherwise use internal state
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  
  const toggleSidebar = useCallback(() => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalIsOpen(!internalIsOpen);
    }
  }, [onToggle, internalIsOpen]);

  const closeSidebar = useCallback(() => {
    if (onClose) {
      onClose();
    } else {
      setInternalIsOpen(false);
    }
  }, [onClose]);

  const handleItemClick = useCallback((item: SidebarItem) => {
    if (item.isLogout && onLogout) {
      onLogout();
    }
    closeSidebar();
  }, [onLogout, closeSidebar]);

  return (
    <>
      {/* Overlay dengan blur untuk Mobile */}
      <div
        className={`fixed inset-0 z-40 lg:hidden transition-opacity duration-300 ease-in-out ${
          isOpen ? 'opacity-100 backdrop-blur-md pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeSidebar}
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
      />

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full bg-[#2C1810] text-white flex flex-col shadow-2xl transition-all duration-300 ${
        isOpen ? 'w-64 translate-x-0 z-50' : 'w-16 sm:w-48 lg:w-64 -translate-x-full lg:translate-x-0 z-30'
      } lg:z-30`}>
        {/* Logo Section */}
        <div className="p-3 sm:p-4 lg:p-6 border-b border-[#3D2418]">
          <div className="flex items-center gap-2 lg:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-[#2C1810]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className={`min-w-0 ${isOpen ? 'block' : 'hidden'} sm:block`}>
              <div className="text-sm lg:text-lg font-semibold truncate">UNSHAKEN 2026</div>
              <div className="text-xs text-gray-400 truncate">Sumbagsel Conference</div>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-2 lg:p-4 space-y-1 lg:space-y-2 overflow-y-auto">
          {items.map((item) => {
            const isActive = pathname === item.path;
            if (item.isLogout) {
              return (
                <button
                  key={item.path}
                  onClick={() => handleItemClick(item)}
                  className="w-full flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2 lg:py-3 rounded-lg transition-colors text-red-400 hover:text-red-300 hover:bg-[#3D2418]"
                >
                  <span className="w-4 h-4 sm:w-5 sm:h-5 lg:w-5 lg:h-5 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </span>
                  <span className={`text-xs sm:text-sm lg:text-sm font-medium truncate ${isOpen ? 'block' : 'hidden'} sm:inline`}>Sign Out</span>
                </button>
              );
            }
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => handleItemClick(item)}
                className={`w-full flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2 lg:py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-[#3D2418] text-white'
                    : 'text-gray-300 hover:bg-[#3D2418] hover:text-white'
                }`}
              >
                <span className="w-4 h-4 sm:w-5 sm:h-5 lg:w-5 lg:h-5 flex items-center justify-center flex-shrink-0">
                  {item.icon}
                </span>
                <span className={`text-xs sm:text-sm lg:text-sm font-medium truncate ${isOpen ? 'block' : 'hidden'} sm:inline`}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

      </div>
    </>
  );
});
