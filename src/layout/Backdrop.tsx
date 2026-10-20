"use client";

import { useSidebar } from "@/context/SidebarContext";

export default function Backdrop() {
  const { isMobileOpen, toggleMobileSidebar } = useSidebar();

  return (
    <div
      onClick={toggleMobileSidebar}
      className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 xl:hidden ${
        isMobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    />
  );
}
