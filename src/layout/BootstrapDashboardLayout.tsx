"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

interface BootstrapDashboardLayoutProps {
  children: React.ReactNode;
  isAdmin?: boolean;
  isUser?: boolean;
  isSuperAdmin?: boolean;
}

export default function BootstrapDashboardLayout({
  children,
  isAdmin = false,
  isUser = false,
  isSuperAdmin = false,
}: BootstrapDashboardLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const merchantNavItems = [
    { name: "Dashboard", path: "/dashboard", icon: "bi-speedometer2" },
    { name: "Transactions", path: "/dashboard/transactions", icon: "bi-credit-card" },
    { name: "Customers", path: "/dashboard/customers", icon: "bi-people" },
    { name: "Payment Methods", path: "/dashboard/methods", icon: "bi-wallet2" },
    { name: "Refunds", path: "/dashboard/refunds", icon: "bi-arrow-counterclockwise" },
    { name: "Settings", path: "/dashboard/settings", icon: "bi-gear" },
    { name: "Simulator", path: "/dashboard/simulator", icon: "bi-play-circle" },
  ];

  const adminNavItems = [
    { name: "Overview", path: "/admin", icon: "bi-speedometer2" },
    { name: "Merchants", path: "/admin/merchants", icon: "bi-shop" },
    { name: "Transactions", path: "/admin/transactions", icon: "bi-credit-card" },
    { name: "Providers", path: "/admin/providers", icon: "bi-bank" },
    { name: "Settlements", path: "/admin/settlements", icon: "bi-cash-coin" },
    { name: "Settings", path: "/admin/settings", icon: "bi-gear" },
  ];

  const userNavItems = [
    { name: "My Payments", path: "/user", icon: "bi-credit-card" },
    { name: "Send Money", path: "/user/send", icon: "bi-send" },
    { name: "Airtime", path: "/user/airtime", icon: "bi-phone" },
    { name: "Bills", path: "/user/bills", icon: "bi-receipt" },
    { name: "History", path: "/user/history", icon: "bi-clock-history" },
    { name: "Cards", path: "/user/cards", icon: "bi-credit-card-2-front" },
    { name: "Settings", path: "/user/settings", icon: "bi-gear" },
  ];

  const superAdminNavItems = [
    { name: "Executive Overview", path: "/super-admin", icon: "bi-graph-up" },
    { name: "Platform Health", path: "/super-admin/health", icon: "bi-heart-pulse" },
    { name: "Financial Reports", path: "/super-admin/financials", icon: "bi-currency-dollar" },
    { name: "Team Management", path: "/super-admin/team", icon: "bi-people-fill" },
    { name: "Compliance", path: "/super-admin/compliance", icon: "bi-shield-check" },
    { name: "Strategic Analytics", path: "/super-admin/analytics", icon: "bi-bar-chart-line" },
    { name: "Settings", path: "/super-admin/settings", icon: "bi-gear-fill" },
  ];

  const navItems = isSuperAdmin ? superAdminNavItems : isAdmin ? adminNavItems : isUser ? userNavItems : merchantNavItems;

  const isActive = (path: string) => pathname === path;

  return (
    <div className="d-flex" style={{ minHeight: "100vh" }}>
      {/* Sidebar */}
      <div
        className={`bg-dark text-white d-flex flex-column ${
          sidebarOpen ? "col-md-3 col-lg-2" : "col-auto"
        }`}
        style={{ minHeight: "100vh", transition: "width 0.3s" }}
      >
        <div className="p-3 border-bottom border-secondary">
          <Link href="/" className="text-decoration-none text-white fw-bold">
            <i className="bi bi-wallet2 me-2"></i>
            ZeePay
          </Link>
        </div>

        <div className="flex-grow overflow-auto py-3">
          <ul className="nav flex-column nav-pills gap-2">
            {navItems.map((item) => (
              <li className="nav-item" key={item.path}>
                <Link
                  href={item.path}
                  className={`nav-link text-white ${
                    isActive(item.path) ? "active bg-primary" : ""
                  }`}
                >
                  <i className={`bi ${item.icon} me-2`}></i>
                  {sidebarOpen && <span>{item.name}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-3 border-top border-secondary">
          <button
            className="btn btn-outline-light btn-sm w-100"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <i className={`bi ${sidebarOpen ? "bi-chevron-left" : "bi-chevron-right"}`}></i>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow d-flex flex-column bg-light">
        {/* Top Navbar */}
        <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom">
          <div className="container-fluid">
            <button
              className="btn btn-outline-secondary btn-sm d-md-none"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <i className="bi bi-list"></i>
            </button>

            <div className="ms-auto d-flex align-items-center gap-3">
              <div className="dropdown">
                <button
                  className="btn btn-light dropdown-toggle d-flex align-items-center gap-2"
                  type="button"
                  data-bs-toggle="dropdown"
                >
                  <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                       style={{ width: "32px", height: "32px" }}>
                    U
                  </div>
                  <span className="d-none d-md-inline">User</span>
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li><a className="dropdown-item" href="#">Profile</a></li>
                  <li><a className="dropdown-item" href="#">Settings</a></li>
                  <li><hr className="dropdown-divider" /></li>
                  <li><a className="dropdown-item text-danger" href="/auth/login">Sign out</a></li>
                </ul>
              </div>
            </div>
          </div>
        </nav>

        {/* Page Content */}
        <div className="flex-grow p-4 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
