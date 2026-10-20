import BootstrapDashboardLayout from "@/layout/BootstrapDashboardLayout";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <BootstrapDashboardLayout isAdmin={false}>{children}</BootstrapDashboardLayout>;
}
