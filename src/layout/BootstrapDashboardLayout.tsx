"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, Suspense } from "react";

interface BootstrapDashboardLayoutProps {
  children: React.ReactNode;
  isAdmin?: boolean;
  isUser?: boolean;
  isSuperAdmin?: boolean;
}

interface NavItem {
  name: string;
  path: string;
  icon: string;
}

interface NavGroup {
  name: string;
  icon: string;
  items: NavItem[];
}

function BootstrapDashboardLayoutContent({
  children,
  isAdmin = false,
  isUser = false,
  isSuperAdmin = false,
}: BootstrapDashboardLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };

  const merchantNavItems: NavItem[] = [
    { name: "Dashboard", path: "/dashboard", icon: "bi-speedometer2" },
    { name: "Transactions", path: "/dashboard/transactions", icon: "bi-credit-card" },
    { name: "Customers", path: "/dashboard/customers", icon: "bi-people" },
    { name: "Payment Methods", path: "/dashboard/methods", icon: "bi-wallet2" },
    { name: "Refunds", path: "/dashboard/refunds", icon: "bi-arrow-counterclockwise" },
    { name: "Payment Links", path: "/dashboard/links", icon: "bi-link-45deg" },
    { name: "Subscriptions", path: "/dashboard/subscriptions", icon: "bi-arrow-repeat" },
    { name: "Payouts", path: "/dashboard/payouts", icon: "bi-send" },
    { name: "Invoices", path: "/dashboard/invoices", icon: "bi-file-earmark-text" },
    { name: "Checkout Config", path: "/dashboard/checkout", icon: "bi-shop" },
    { name: "Developers", path: "/dashboard/developers", icon: "bi-code-slash" },
    { name: "API Keys", path: "/dashboard/api-keys", icon: "bi-key" },
    { name: "Webhooks", path: "/dashboard/webhooks", icon: "bi-webhook" },
    { name: "Settings", path: "/dashboard/settings", icon: "bi-gear" },
    { name: "Simulator", path: "/dashboard/simulator", icon: "bi-play-circle" },
  ];

  const adminNavGroups: NavGroup[] = [
    {
      name: "Overview",
      icon: "bi-speedometer2",
      items: [
        { name: "Executive Dashboard", path: "/admin", icon: "bi-graph-up" },
        { name: "Operations Centre", path: "/admin/operations", icon: "bi-activity" },
        { name: "Live Activity", path: "/admin/activity", icon: "bi-broadcast" },
      ],
    },
    {
      name: "Merchants",
      icon: "bi-shop",
      items: [
        { name: "Directory", path: "/admin/merchants", icon: "bi-list-ul" },
        { name: "Applications", path: "/admin/merchants/applications", icon: "bi-file-earmark-text" },
        { name: "Verification Queue", path: "/admin/merchants/verification", icon: "bi-check-circle" },
        { name: "Tier Management", path: "/admin/merchants/tiers", icon: "bi-layers" },
      ],
    },
    {
      name: "Payments",
      icon: "bi-credit-card",
      items: [
        { name: "Transactions", path: "/admin/transactions", icon: "bi-list-ul" },
        { name: "Payment Attempts", path: "/admin/payments/attempts", icon: "bi-arrow-repeat" },
        { name: "Refunds", path: "/admin/payments/refunds", icon: "bi-arrow-counterclockwise" },
        { name: "Disputes", path: "/admin/payments/disputes", icon: "bi-exclamation-triangle" },
        { name: "Payment Links", path: "/admin/payments/links", icon: "bi-link-45deg" },
      ],
    },
    {
      name: "Payment Network",
      icon: "bi-diagram-3",
      items: [
        { name: "Payment Methods", path: "/admin/providers/methods", icon: "bi-wallet2" },
        { name: "Providers", path: "/admin/providers", icon: "bi-bank" },
        { name: "Provider Health", path: "/admin/providers/health", icon: "bi-heart-pulse" },
        { name: "Routing Rules", path: "/admin/providers/routing", icon: "bi-signpost" },
        { name: "Integration Manager", path: "/admin/providers/integrations", icon: "bi-plug" },
      ],
    },
    {
      name: "Finance",
      icon: "bi-cash-coin",
      items: [
        { name: "Settlements", path: "/admin/settlements", icon: "bi-cash-stack" },
        { name: "Reconciliation", path: "/admin/finance/reconciliation", icon: "bi-arrow-left-right" },
        { name: "Fees & Pricing", path: "/admin/finance/fees", icon: "bi-tag" },
        { name: "Financial Reports", path: "/admin/finance/reports", icon: "bi-file-earmark-bar-graph" },
      ],
    },
    {
      name: "Risk & Compliance",
      icon: "bi-shield-check",
      items: [
        { name: "Verification Reviews", path: "/admin/compliance/verification", icon: "bi-person-check" },
        { name: "Risk Alerts", path: "/admin/compliance/alerts", icon: "bi-bell" },
        { name: "Transaction Monitoring", path: "/admin/compliance/monitoring", icon: "bi-eye" },
        { name: "Audit History", path: "/admin/compliance/audit", icon: "bi-clock-history" },
      ],
    },
    {
      name: "Analytics & Reports",
      icon: "bi-bar-chart-line",
      items: [
        { name: "Revenue Analytics", path: "/admin/analytics/revenue", icon: "bi-graph-up-arrow" },
        { name: "Provider Performance", path: "/admin/analytics/providers", icon: "bi-diagram-3" },
        { name: "Country Performance", path: "/admin/analytics/countries", icon: "bi-globe" },
        { name: "Merchant Leaderboard", path: "/admin/analytics/merchants", icon: "bi-trophy" },
      ],
    },
    {
      name: "Support",
      icon: "bi-headset",
      items: [
        { name: "Support Tickets", path: "/admin/support/tickets", icon: "bi-ticket-detailed" },
        { name: "Merchant Enquiries", path: "/admin/support/enquiries", icon: "bi-chat-dots" },
        { name: "Failed Payments", path: "/admin/support/failed-payments", icon: "bi-x-circle" },
      ],
    },
    {
      name: "Organisation",
      icon: "bi-people-fill",
      items: [
        { name: "Staff Directory", path: "/admin/organisation/staff", icon: "bi-person-lines-fill" },
        { name: "Departments", path: "/admin/organisation/departments", icon: "bi-building" },
        { name: "Roles & Permissions", path: "/admin/organisation/roles", icon: "bi-shield-lock" },
        { name: "Activity Logs", path: "/admin/organisation/activity", icon: "bi-journal-text" },
      ],
    },
    {
      name: "Platform Settings",
      icon: "bi-gear-fill",
      items: [
        { name: "General Config", path: "/admin/settings/general", icon: "bi-sliders" },
        { name: "Countries & Currencies", path: "/admin/settings/countries", icon: "bi-globe2" },
        { name: "API Settings", path: "/admin/settings/api", icon: "bi-code-slash" },
        { name: "Security", path: "/admin/settings/security", icon: "bi-lock-fill" },
        { name: "Feature Flags", path: "/admin/settings/features", icon: "bi-flag-fill" },
      ],
    },
  ];

  const userNavItems = [
    { name: "My Payments", path: "/user", icon: "bi-credit-card" },
    { name: "Send Money", path: "/user/send", icon: "bi-send" },
    { name: "Airtime", path: "/user/airtime", icon: "bi-phone" },
    { name: "Bills", path: "/user/bills", icon: "bi-receipt" },
    { name: "Subscriptions", path: "/user/subscriptions", icon: "bi-arrow-repeat" },
    { name: "History", path: "/user/history", icon: "bi-clock-history" },
    { name: "Cards", path: "/user/cards", icon: "bi-credit-card-2-front" },
    { name: "Settings", path: "/user/settings", icon: "bi-gear" },
  ];

  const superAdminNavGroups: NavGroup[] = [
    {
      name: "Platform Overview",
      icon: "bi-graph-up",
      items: [
        { name: "Executive Dashboard", path: "/super-admin", icon: "bi-speedometer2" },
        { name: "Platform Health", path: "/super-admin/health", icon: "bi-heart-pulse" },
        { name: "Global Activity", path: "/super-admin/activity", icon: "bi-broadcast" },
      ],
    },
    {
      name: "Organisation",
      icon: "bi-people-fill",
      items: [
        { name: "Company Profile", path: "/super-admin/organisation/profile", icon: "bi-building" },
        { name: "Departments", path: "/super-admin/organisation/departments", icon: "bi-diagram-3" },
        { name: "Staff Directory", path: "/super-admin/organisation/staff", icon: "bi-person-lines-fill" },
        { name: "Teams", path: "/super-admin/organisation/teams", icon: "bi-people" },
      ],
    },
    {
      name: "Access Control",
      icon: "bi-shield-lock",
      items: [
        { name: "Roles", path: "/super-admin/access/roles", icon: "bi-person-badge" },
        { name: "Permissions", path: "/super-admin/access/permissions", icon: "bi-key" },
        { name: "Permission Templates", path: "/super-admin/access/templates", icon: "bi-file-earmark-text" },
        { name: "Access Reviews", path: "/super-admin/access/reviews", icon: "bi-check2-circle" },
      ],
    },
    {
      name: "Merchant Governance",
      icon: "bi-shop",
      items: [
        { name: "Governance Overview", path: "/super-admin/governance/merchants", icon: "bi-grid" },
        { name: "Account Controls", path: "/super-admin/merchants/controls", icon: "bi-sliders" },
        { name: "-Onboarding Policies", path: "/super-admin/merchants/onboarding", icon: "bi-file-earmark-check" },
        { name: "Limits & Restrictions", path: "/super-admin/merchants/limits", icon: "bi-exclamation-circle" },
        { name: "Account Restrictions", path: "/super-admin/merchants/restrictions", icon: "bi-lock" },
      ],
    },
    {
      name: "Provider Governance",
      icon: "bi-bank",
      items: [
        { name: "Governance Overview", path: "/super-admin/governance/providers", icon: "bi-grid" },
        { name: "Provider Activation", path: "/super-admin/providers/activation", icon: "bi-toggle-on" },
        { name: "Country Availability", path: "/super-admin/providers/countries", icon: "bi-globe" },
        { name: "Credentials Status", path: "/super-admin/providers/credentials", icon: "bi-key-fill" },
        { name: "Integration Approvals", path: "/super-admin/providers/approvals", icon: "bi-check-circle" },
      ],
    },
    {
      name: "Payment Configuration",
      icon: "bi-wallet2",
      items: [
        { name: "Supported Currencies", path: "/super-admin/payments/currencies", icon: "bi-currency-dollar" },
        { name: "Payment Methods", path: "/super-admin/payments/methods", icon: "bi-credit-card" },
        { name: "Country Rules", path: "/super-admin/payments/countries", icon: "bi-globe2" },
        { name: "Routing Policies", path: "/super-admin/payments/routing", icon: "bi-signpost" },
      ],
    },
    {
      name: "Pricing & Commercials",
      icon: "bi-tag",
      items: [
        { name: "Fee Plans", path: "/super-admin/pricing/fees", icon: "bi-receipt" },
        { name: "Merchant Pricing", path: "/super-admin/pricing/merchants", icon: "bi-shop" },
        { name: "Provider Costs", path: "/super-admin/pricing/providers", icon: "bi-bank" },
        { name: "Pricing History", path: "/super-admin/pricing/history", icon: "bi-clock-history" },
      ],
    },
    {
      name: "Financial Controls",
      icon: "bi-cash-stack",
      items: [
        { name: "Settlement Approvals", path: "/super-admin/finance/settlements", icon: "bi-check-circle" },
        { name: "Financial Adjustments", path: "/super-admin/finance/adjustments", icon: "bi-arrow-left-right" },
        { name: "Approval Limits", path: "/super-admin/finance/limits", icon: "bi-exclamation-triangle" },
        { name: "Reconciliation Oversight", path: "/super-admin/finance/reconciliation", icon: "bi-arrow-repeat" },
      ],
    },
    {
      name: "Risk Policies",
      icon: "bi-shield-check",
      items: [
        { name: "Risk Rules", path: "/super-admin/risk/rules", icon: "bi-list-check" },
        { name: "Review Thresholds", path: "/super-admin/risk/thresholds", icon: "bi-sliders2" },
        { name: "Escalation Policies", path: "/super-admin/risk/escalation", icon: "bi-arrow-up-circle" },
        { name: "Restricted Activities", path: "/super-admin/risk/restrictions", icon: "bi-ban" },
      ],
    },
    {
      name: "Security Centre",
      icon: "bi-lock-fill",
      items: [
        { name: "Login History", path: "/super-admin/security/logins", icon: "bi-clock-history" },
        { name: "Active Sessions", path: "/super-admin/security/sessions", icon: "bi-display" },
        { name: "MFA Policies", path: "/super-admin/security/mfa", icon: "bi-shield" },
        { name: "Suspicious Access", path: "/super-admin/security/alerts", icon: "bi-exclamation-triangle-fill" },
      ],
    },
    {
      name: "Audit & Approvals",
      icon: "bi-journal-text",
      items: [
        { name: "Approvals Queue", path: "/super-admin/approvals/queue", icon: "bi-inbox" },
        { name: "Audit Records", path: "/super-admin/audit/records", icon: "bi-file-earmark-text" },
        { name: "Approval Queues", path: "/super-admin/audit/queues", icon: "bi-list-task" },
        { name: "Change History", path: "/super-admin/audit/history", icon: "bi-clock" },
      ],
    },
    {
      name: "Platform Configuration",
      icon: "bi-gear-fill",
      items: [
        { name: "Feature Flags", path: "/super-admin/settings/features", icon: "bi-flag-fill" },
        { name: "Maintenance Mode", path: "/super-admin/settings/maintenance", icon: "bi-tools" },
        { name: "Notification Templates", path: "/super-admin/settings/notifications", icon: "bi-bell" },
        { name: "Environment Settings", path: "/super-admin/settings/environment", icon: "bi-hdd-network" },
      ],
    },
    {
      name: "System Health",
      icon: "bi-heart-pulse",
      items: [
        { name: "API Availability", path: "/super-admin/health/api", icon: "bi-cloud" },
        { name: "Background Jobs", path: "/super-admin/health/jobs", icon: "bi-gear" },
        { name: "Webhook Processing", path: "/super-admin/health/webhooks", icon: "bi-arrow-repeat" },
        { name: "Error Rates", path: "/super-admin/health/errors", icon: "bi-exclamation-circle" },
        { name: "Service Incidents", path: "/super-admin/health/incidents", icon: "bi-activity" },
      ],
    },
  ];

  const isActive = (path: string) => pathname === path;
  const isGroupActive = (group: NavGroup) => group.items.some(item => pathname.startsWith(item.path));

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
          <ul className="nav flex-column nav-pills gap-1">
            {isAdmin ? (
              // Admin grouped navigation
              adminNavGroups.map((group) => (
                <li className="nav-item" key={group.name}>
                  <button
                    className={`nav-link text-white text-start w-100 d-flex align-items-center justify-content-between ${
                      isGroupActive(group) ? "active bg-primary" : ""
                    }`}
                    onClick={() => toggleGroup(group.name)}
                    style={{ paddingLeft: '12px' }}
                  >
                    <span className="d-flex align-items-center">
                      <i className={`bi ${group.icon} me-2`}></i>
                      {sidebarOpen && <span className="small">{group.name}</span>}
                    </span>
                    {sidebarOpen && (
                      <i className={`bi ${expandedGroups.has(group.name) ? 'bi-chevron-down' : 'bi-chevron-right'} small`}></i>
                    )}
                  </button>
                  {expandedGroups.has(group.name) && sidebarOpen && (
                    <ul className="nav flex-column ms-3 mt-1">
                      {group.items.map((item) => (
                        <li className="nav-item" key={item.path}>
                          <Link
                            href={item.path}
                            className={`nav-link text-white small ${
                              isActive(item.path) ? "active bg-primary" : ""
                            }`}
                          >
                            <i className={`bi ${item.icon} me-2`}></i>
                            {item.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))
            ) : isSuperAdmin ? (
              // Super Admin grouped navigation
              superAdminNavGroups.map((group) => (
                <li className="nav-item" key={group.name}>
                  <button
                    className={`nav-link text-white text-start w-100 d-flex align-items-center justify-content-between ${
                      isGroupActive(group) ? "active bg-primary" : ""
                    }`}
                    onClick={() => toggleGroup(group.name)}
                    style={{ paddingLeft: '12px' }}
                  >
                    <span className="d-flex align-items-center">
                      <i className={`bi ${group.icon} me-2`}></i>
                      {sidebarOpen && <span className="small">{group.name}</span>}
                    </span>
                    {sidebarOpen && (
                      <i className={`bi ${expandedGroups.has(group.name) ? 'bi-chevron-down' : 'bi-chevron-right'} small`}></i>
                    )}
                  </button>
                  {expandedGroups.has(group.name) && sidebarOpen && (
                    <ul className="nav flex-column ms-3 mt-1">
                      {group.items.map((item) => (
                        <li className="nav-item" key={item.path}>
                          <Link
                            href={item.path}
                            className={`nav-link text-white small ${
                              isActive(item.path) ? "active bg-primary" : ""
                            }`}
                          >
                            <i className={`bi ${item.icon} me-2`}></i>
                            {item.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))
            ) : (
              // Flat navigation for Merchant and User
              (isUser ? userNavItems : merchantNavItems).map((item) => (
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
              ))
            )}
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

export default function BootstrapDashboardLayout(props: BootstrapDashboardLayoutProps) {
  return (
    <Suspense fallback={<div className="d-flex" style={{ minHeight: "100vh" }}><div className="spinner-border text-primary m-auto" role="status"><span className="visually-hidden">Loading...</span></div></div>}>
      <BootstrapDashboardLayoutContent {...props} />
    </Suspense>
  );
}
