'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface NavItem {
  label: string;
  path: string;
  isLogout?: boolean;
}

interface NavbarProps {
  items: NavItem[];
  textColor?: 'white' | 'gray';
  onLogout?: () => void;
}

export function Navbar({ items, textColor = 'gray', onLogout }: NavbarProps) {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleItemClick = (item: NavItem) => {
    if (item.isLogout && onLogout) {
      onLogout();
    } else {
      router.push(item.path);
    }
    closeSidebar();
  };

  const textColorClass = textColor === 'white' ? 'text-white hover:text-gray-200' : 'text-gray-700 hover:text-gray-900';
  const burgerColorClass = textColor === 'white' ? 'text-white' : 'text-gray-700';

  return (
    <>
      {/* Navbar */}
      <nav className="relative z-20 w-full px-4 py-4 sm:px-6 lg:px-0 lg:py-6">
        <div className="w-full lg:px-8 xl:px-12 flex items-center justify-end">
          {/* Burger Menu untuk Mobile */}
          <button
            onClick={toggleSidebar}
            className={`lg:hidden ${burgerColorClass} p-2`}
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

          {/* Desktop Menu */}
          <div className="hidden lg:flex gap-3">
            {items.map((item) => (
              <button
                key={item.path}
                onClick={() => handleItemClick(item)}
                className={`rounded-md px-4 py-2 lg:px-6 lg:py-3 xl:px-8 xl:py-4 text-sm lg:text-base xl:text-lg font-medium transition-colors ${
                  item.isLogout ? 'text-red-600 hover:text-red-700' : textColorClass
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Sidebar untuk Mobile */}
      <>
        {/* Overlay dengan blur */}
        <div
          className={`fixed inset-0 z-30 lg:hidden transition-opacity duration-300 ease-in-out ${
            isSidebarOpen ? 'opacity-100 backdrop-blur-sm' : 'opacity-0 pointer-events-none'
          }`}
          onClick={closeSidebar}
        />
        {/* Sidebar */}
        <div className={`fixed top-0 right-0 h-full w-64 bg-white bg-opacity-95 backdrop-blur-md shadow-xl z-40 lg:hidden transform transition-transform duration-300 ease-out ${
          isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          <div className="flex flex-col h-full">
            {/* Header Sidebar */}
            <div className="flex items-center justify-between p-4 border-b">
              <span className="text-lg font-semibold text-gray-900">Menu</span>
              <button
                onClick={closeSidebar}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* Menu Items */}
            <div className="flex flex-col p-4 gap-2">
              {items.map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleItemClick(item)}
                  className={`text-left px-4 py-3 rounded-md text-base font-medium transition-colors ${
                    item.isLogout
                      ? 'text-red-600 hover:bg-red-50'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </>
    </>
  );
}
