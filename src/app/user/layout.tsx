import BootstrapDashboardLayout from '@/layout/BootstrapDashboardLayout';

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BootstrapDashboardLayout isAdmin={false} isUser={true}>
      {children}
    </BootstrapDashboardLayout>
  );
}
