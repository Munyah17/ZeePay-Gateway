"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/utils";
import { useSidebar } from "@/context/SidebarContext";
import { ChevronDownIcon } from "@/icons";
import { useCallback, useEffect, useRef, useState } from "react";

type NavItem = {
  key: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: {
    key: string;
    path: string;
  }[];
};

interface DashboardSidebarProps {
  isAdmin?: boolean;
}

export default function DashboardSidebar({ isAdmin = false }: DashboardSidebarProps) {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();

  const merchantNavItems: NavItem[] = [
    {
      icon: <span className="text-lg">⊞</span>,
      key: "dashboard",
      path: "/dashboard",
    },
    {
      icon: <span className="text-lg">▤</span>,
      key: "transactions",
      path: "/dashboard/transactions",
    },
    {
      icon: <span className="text-lg">👤</span>,
      key: "customers",
      path: "/dashboard/customers",
    },
    {
      icon: <span className="text-lg">💳</span>,
      key: "methods",
      path: "/dashboard/methods",
    },
    {
      icon: <span className="text-lg">↩</span>,
      key: "refunds",
      path: "/dashboard/refunds",
    },
    {
      icon: <span className="text-lg">⚙</span>,
      key: "settings",
      subItems: [
        { key: "apiKeys", path: "/dashboard/settings" },
        { key: "webhooks", path: "/dashboard/settings" },
      ],
    },
    {
      icon: <span className="text-lg">▶</span>,
      key: "simulator",
      path: "/dashboard/simulator",
    },
  ];

  const adminNavItems: NavItem[] = [
    {
      icon: <span className="text-lg">⊞</span>,
      key: "overview",
      path: "/admin",
    },
    {
      icon: <span className="text-lg">👤</span>,
      key: "merchants",
      path: "/admin/merchants",
    },
    {
      icon: <span className="text-lg">▤</span>,
      key: "transactions",
      path: "/admin/transactions",
    },
    {
      icon: <span className="text-lg">💳</span>,
      key: "providers",
      path: "/admin/providers",
    },
    {
      icon: <span className="text-lg">💰</span>,
      key: "settlements",
      path: "/admin/settlements",
    },
    {
      icon: <span className="text-lg">⚙</span>,
      key: "settings",
      path: "/admin/settings",
    },
  ];

  const navItems = isAdmin ? adminNavItems : merchantNavItems;

  const [openSubmenu, setOpenSubmenu] = useState<{ index: number } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback((path: string) => path === pathname, [pathname]);

  useEffect(() => {
    let submenuMatched = false;
    navItems.forEach((nav, index) => {
      if (nav.subItems) {
        nav.subItems.forEach((subItem) => {
          if (isActive(subItem.path)) {
            setOpenSubmenu({ index });
            submenuMatched = true;
          }
        });
      }
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [pathname, isActive, navItems]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number) => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (prevOpenSubmenu && prevOpenSubmenu.index === index) {
        return null;
      }
      return { index };
    });
  };

  const renderMenuItems = (navItems: NavItem[]) => (
    <ul className="flex flex-col gap-1">
      {navItems.map((nav, index) => (
        <li key={nav.key}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index)}
              className={cn(
                "group menu-item cursor-pointer",
                openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive",
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start",
              )}
            >
              <span
                className={cn(
                  openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive",
                )}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">{nav.key.charAt(0).toUpperCase() + nav.key.slice(1)}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={cn(
                    "ms-auto h-5 w-5 transition-transform duration-200",
                    openSubmenu?.index === index
                      ? "rotate-180 text-gray-900"
                      : "",
                  )}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                href={nav.path}
                className={cn(
                  "group menu-item",
                  isActive(nav.path)
                    ? "menu-item-active"
                    : "menu-item-inactive",
                )}
              >
                <span
                  className={cn(
                    isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive",
                  )}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">
                    {nav.key.charAt(0).toUpperCase() + nav.key.slice(1)}
                  </span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.index === index
                    ? `${subMenuHeight[`${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="ms-9 mt-2 space-y-1">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.key}>
                    <Link
                      href={subItem.path}
                      className={`menu-dropdown-item ${
                        isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                      }`}
                    >
                      {subItem.key.charAt(0).toUpperCase() + subItem.key.slice(1)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed top-0 left-0 z-50 flex h-full flex-col border-r border-gray-200 bg-white px-5 text-gray-900 transition-all duration-300 ease-in-out xl:mt-0 ${
        isExpanded || isMobileOpen ? "w-72" : isHovered ? "w-72" : "w-20"
      } ${
        isMobileOpen
          ? "translate-x-0"
          : "-translate-x-full"
      } xl:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`flex py-8 ${
          !isExpanded && !isHovered ? "xl:justify-center" : "justify-start"
        }`}
      >
        <Link href="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <span className="text-sm font-semibold text-gray-900">ZeePay</span>
          ) : (
            <span className="text-sm font-semibold text-gray-900">Z</span>
          )}
        </Link>
      </div>
      <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 flex text-xs leading-5 text-gray-400 uppercase ${
                  !isExpanded && !isHovered
                    ? "xl:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  isAdmin ? "Admin" : "Merchant"
                ) : (
                  <span className="text-gray-400">•••</span>
                )}
              </h2>
              {renderMenuItems(navItems)}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
}
