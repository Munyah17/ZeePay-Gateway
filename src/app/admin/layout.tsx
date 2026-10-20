import { SidebarProvider } from "@/context/SidebarContext";
import DashboardLayoutWrapper from "@/layout/DashboardLayout";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <DashboardLayoutWrapper isAdmin={true}>{children}</DashboardLayoutWrapper>
    </SidebarProvider>
  );
}
