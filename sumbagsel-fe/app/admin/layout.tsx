import { AdminLayoutWrapper } from './admin-layout-wrapper';

export default function AdminLayoutRoot({ children }: { children: React.ReactNode }) {
  return <AdminLayoutWrapper>{children}</AdminLayoutWrapper>;
}
