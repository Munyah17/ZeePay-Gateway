"use client";

import { useSidebar } from "@/context/SidebarContext";
import DashboardHeader from "@/layout/DashboardHeader";
import DashboardSidebar from "@/layout/DashboardSidebar";
import Backdrop from "@/layout/Backdrop";
import React from "react";

interface DashboardLayoutProps {
  children: React.ReactNode;
  isAdmin?: boolean;
}

export default function DashboardLayout({
  children,
  isAdmin = false,
}: DashboardLayoutProps) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
    ? "lg:ml-[290px]"
    : "lg:ml-[90px]";

  return (
    <div className="min-h-screen xl:flex">
      <DashboardSidebar isAdmin={isAdmin} />
      <Backdrop />
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}
      >
        <DashboardHeader />
        <div className="p-4 mx-auto max-w-7xl md:p-6">{children}</div>
      </div>
    </div>
  );
}
