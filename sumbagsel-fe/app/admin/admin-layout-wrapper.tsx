'use client';

import { usePathname } from 'next/navigation';
import { AdminLayout } from '@/components/admin-layout';

export function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === '/admin') {
    return <>{children}</>;
  }
  return <AdminLayout>{children}</AdminLayout>;
}
