import BootstrapDashboardLayout from '@/layout/BootstrapDashboardLayout';

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BootstrapDashboardLayout isAdmin={false} isUser={false} isSuperAdmin={true}>
      {children}
    </BootstrapDashboardLayout>
  );
}
