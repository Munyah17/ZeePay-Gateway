"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { UIProvider } from "@/components/ui/UIProvider";
import { useActivity, markAllActivityRead, clearActivity, timeAgo, currentUser } from "@/lib/store/activity";
import { Avatar } from "@/components/ui/records";
import { adminNavGroups, merchantNavItems, superAdminNavGroups, userNavItems, NavGroup, NavItem } from "./navConfig";

interface BootstrapDashboardLayoutProps {
  children: React.ReactNode;
  isAdmin?: boolean;
  isUser?: boolean;
  isSuperAdmin?: boolean;
}

type Portal = "admin" | "super-admin" | "user" | "merchant";

const PORTALS: Record<Portal, { label: string; home: string; settings: string; accent: string }> = {
  merchant: { label: "Merchant", home: "/dashboard", settings: "/dashboard/settings", accent: "#6366f1" },
  admin: { label: "Admin Console", home: "/admin", settings: "/admin/settings/general", accent: "#0ea5e9" },
  "super-admin": { label: "Super Admin", home: "/super-admin", settings: "/super-admin/organisation/profile", accent: "#a855f7" },
  user: { label: "Personal", home: "/user", settings: "/user/settings", accent: "#10b981" },
};

function useOutside(ref: React.RefObject<HTMLElement | null>, onOut: () => void, active: boolean) {
  useEffect(() => {
    if (!active) return;
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && onOut();
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [ref, onOut, active]);
}

function DashboardShell({ children, isAdmin = false, isUser = false, isSuperAdmin = false }: BootstrapDashboardLayoutProps) {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const portal: Portal = isSuperAdmin ? "super-admin" : isAdmin ? "admin" : isUser ? "user" : "merchant";
  const meta = PORTALS[portal];

  const groups: NavGroup[] = useMemo(() => {
    if (isSuperAdmin) return superAdminNavGroups;
    if (isAdmin) return adminNavGroups;
    return [{ name: isUser ? "Personal" : "Merchant", icon: "bi-grid", items: (isUser ? userNavItems : merchantNavItems) as NavItem[] }];
  }, [isAdmin, isSuperAdmin, isUser]);
  const grouped = isAdmin || isSuperAdmin;
  const allItems = useMemo(() => groups.flatMap((g) => g.items.map((i) => ({ ...i, group: g.name }))), [groups]);

  // Longest matching nav path wins so "/admin" doesn't light up on every admin page.
  const activePath = useMemo(() => {
    let best = "";
    for (const i of allItems) {
      if ((pathname === i.path || pathname.startsWith(i.path + "/")) && i.path.length > best.length) best = i.path;
    }
    return best;
  }, [allItems, pathname]);
  const activeItem = allItems.find((i) => i.path === activePath);

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [navFilter, setNavFilter] = useState("");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [user, setUser] = useState({ name: "User", email: "", role: portal as string });
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  useOutside(notifRef, () => setNotifOpen(false), notifOpen);
  useOutside(profileRef, () => setProfileOpen(false), profileOpen);

  const activity = useActivity();
  const unread = activity.filter((a) => !a.read).length;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUser(currentUser());
    setCollapsed(localStorage.getItem("zeepay:sidebar") === "collapsed");
    const theme = localStorage.getItem("zeepay:theme");
    const isDark = theme === "dark";
    setDark(isDark);
    document.documentElement.setAttribute("data-bs-theme", isDark ? "dark" : "light");
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (activeItem) setExpanded((p) => (p.has(activeItem.group) ? p : new Set(p).add(activeItem.group)));
    setMobileOpen(false);
  }, [activeItem]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("zeepay:theme", next ? "dark" : "light");
    document.documentElement.setAttribute("data-bs-theme", next ? "dark" : "light");
  };

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("zeepay:sidebar", next ? "collapsed" : "open");
  };

  const signOut = () => {
    localStorage.removeItem("zeepay_authed");
    localStorage.removeItem("zeepay_user");
    router.push("/auth/login");
  };

  const filter = navFilter.trim().toLowerCase();
  const visibleGroups = groups
    .map((g) => ({ ...g, items: g.items.filter((i) => !filter || i.name.toLowerCase().includes(filter) || g.name.toLowerCase().includes(filter)) }))
    .filter((g) => g.items.length);

  const crumbs = [
    { label: meta.label, href: meta.home },
    ...(grouped && activeItem && activeItem.path !== meta.home ? [{ label: activeItem.group, href: "" }] : []),
    ...(activeItem && activeItem.path !== meta.home ? [{ label: activeItem.name, href: activeItem.path }] : []),
    ...(activeItem && pathname !== activeItem.path ? [{ label: decodeURIComponent(pathname.slice(activeItem.path.length + 1)), href: "" }] : []),
  ];

  return (
    <UIProvider>
      <div className={`zp-shell ${collapsed ? "zp-collapsed" : ""} ${mobileOpen ? "zp-mobile-open" : ""}`} style={{ ["--zp-accent" as string]: meta.accent }}>
        <aside className="zp-sidebar" aria-label="Main navigation">
          <div className="zp-brand">
            <Link href={meta.home} className="zp-brand-link">
              <span className="zp-logo"><i className="bi bi-lightning-charge-fill"></i></span>
              <span className="zp-brand-text">Zee<span>Pay</span></span>
            </Link>
            <button className="zp-side-close d-lg-none" aria-label="Close menu" onClick={() => setMobileOpen(false)}>
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
          <div className="zp-portal-pill">
            <span className="zp-portal-dot" />
            <span className="zp-hide-collapsed">{meta.label}</span>
          </div>
          <div className="zp-side-search zp-hide-collapsed">
            <i className="bi bi-search"></i>
            <input placeholder="Filter menu…" aria-label="Filter menu" value={navFilter} onChange={(e) => setNavFilter(e.target.value)} />
          </div>
          <nav className="zp-nav">
            {visibleGroups.map((group) => {
              const open = !grouped || !!filter || expanded.has(group.name);
              const groupActive = group.items.some((i) => i.path === activePath);
              return (
                <div key={group.name} className="zp-nav-group">
                  {grouped && (
                    <button
                      className={`zp-nav-group-btn ${groupActive ? "is-active" : ""}`}
                      aria-expanded={open}
                      title={group.name}
                      onClick={() =>
                        setExpanded((p) => {
                          const n = new Set(p);
                          if (n.has(group.name)) n.delete(group.name);
                          else n.add(group.name);
                          return n;
                        })
                      }
                    >
                      <i className={`bi ${group.icon} zp-nav-icon`}></i>
                      <span className="zp-hide-collapsed flex-grow-1 text-start">{group.name}</span>
                      <i className={`bi bi-chevron-down zp-chevron zp-hide-collapsed ${open ? "is-open" : ""}`}></i>
                    </button>
                  )}
                  {open && (
                    <div className={grouped ? "zp-nav-sub" : ""}>
                      {group.items.map((item) => (
                        <Link key={item.path} href={item.path} title={item.name} className={`zp-nav-link ${item.path === activePath ? "is-active" : ""}`}>
                          <i className={`bi ${item.icon} zp-nav-icon`}></i>
                          <span className="zp-hide-collapsed">{item.name}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {visibleGroups.length === 0 && <div className="small text-white-50 px-3">No menu items match “{navFilter}”.</div>}
          </nav>
          <div className="zp-side-foot">
            <button className="zp-collapse-btn d-none d-lg-flex" onClick={toggleCollapsed} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
              <i className={`bi ${collapsed ? "bi-layout-sidebar-inset" : "bi-layout-sidebar"}`}></i>
              <span className="zp-hide-collapsed">Collapse</span>
            </button>
          </div>
        </aside>
        <div className="zp-backdrop" onClick={() => setMobileOpen(false)} />

        <div className="zp-main">
          <header className="zp-topbar">
            <button className="zp-top-btn d-lg-none" aria-label="Open menu" onClick={() => setMobileOpen(true)}>
              <i className="bi bi-list"></i>
            </button>
            <nav aria-label="breadcrumb" className="zp-crumbs d-none d-md-block">
              <ol>
                {crumbs.map((c, i) => (
                  <li key={i} className={i === crumbs.length - 1 ? "is-current" : ""}>
                    {c.href && i !== crumbs.length - 1 ? <Link href={c.href}>{c.label}</Link> : <span>{c.label}</span>}
                  </li>
                ))}
              </ol>
            </nav>
            <button className="zp-cmd" onClick={() => setPaletteOpen(true)} aria-label="Search">
              <i className="bi bi-search"></i>
              <span className="d-none d-sm-inline">Search pages, actions…</span>
              <kbd className="d-none d-md-inline">Ctrl K</kbd>
            </button>
            <div className="d-flex align-items-center gap-1 ms-auto">
              <button className="zp-top-btn" onClick={toggleDark} aria-label="Toggle dark mode" title={dark ? "Light mode" : "Dark mode"}>
                <i className={`bi ${dark ? "bi-sun" : "bi-moon-stars"}`}></i>
              </button>
              <Link href="/docs" className="zp-top-btn d-none d-sm-inline-flex" aria-label="Help & API docs" title="Help & API docs">
                <i className="bi bi-question-circle"></i>
              </Link>
              <div className="position-relative" ref={notifRef}>
                <button className="zp-top-btn" aria-label="Notifications" onClick={() => setNotifOpen((o) => !o)}>
                  <i className="bi bi-bell"></i>
                  {unread > 0 && <span className="zp-dot-count">{unread > 9 ? "9+" : unread}</span>}
                </button>
                {notifOpen && (
                  <div className="zp-pop zp-pop-notif">
                    <div className="zp-pop-head">
                      <strong>Activity</strong>
                      <div className="d-flex gap-2">
                        <button className="btn btn-link btn-sm p-0 text-decoration-none" onClick={markAllActivityRead}>Mark all read</button>
                        <button className="btn btn-link btn-sm p-0 text-decoration-none text-danger" onClick={clearActivity}>Clear</button>
                      </div>
                    </div>
                    <div className="zp-pop-body">
                      {activity.length === 0 ? (
                        <div className="text-center text-muted small py-4">
                          <i className="bi bi-bell-slash fs-3 d-block mb-2"></i>
                          You&apos;re all caught up. Changes you make across the console show up here.
                        </div>
                      ) : (
                        activity.slice(0, 25).map((a) => (
                          <div key={a.id} className={`zp-notif ${a.read ? "" : "is-unread"}`}>
                            <span className={`zp-notif-dot zp-tone-${a.tone === "danger" ? "danger" : a.tone === "warning" ? "warning" : a.tone === "success" ? "success" : "info"}`}></span>
                            <div className="min-w-0">
                              <div className="small fw-semibold text-truncate">{a.action}{a.target ? ` · ${a.target}` : ""}</div>
                              <div className="small text-muted">{a.actor} · {timeAgo(a.at)}</div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="position-relative" ref={profileRef}>
                <button className="zp-profile-btn" onClick={() => setProfileOpen((o) => !o)} aria-label="Account menu">
                  <Avatar name={user.name} size={32} />
                  <span className="d-none d-md-flex flex-column text-start lh-sm">
                    <span className="small fw-semibold">{user.name}</span>
                    <span className="zp-role">{meta.label}</span>
                  </span>
                  <i className="bi bi-chevron-down small d-none d-md-inline"></i>
                </button>
                {profileOpen && (
                  <div className="zp-pop zp-pop-profile">
                    <div className="zp-pop-head flex-column align-items-start">
                      <strong>{user.name}</strong>
                      <span className="small text-muted">{user.email || "signed in"}</span>
                    </div>
                    <Link href={meta.settings} className="zp-menu-item" onClick={() => setProfileOpen(false)}>
                      <i className="bi bi-person-gear"></i>Profile &amp; settings
                    </Link>
                    <Link href="/docs" className="zp-menu-item" onClick={() => setProfileOpen(false)}>
                      <i className="bi bi-journal-code"></i>API documentation
                    </Link>
                    <button className="zp-menu-item" onClick={toggleDark}>
                      <i className={`bi ${dark ? "bi-sun" : "bi-moon-stars"}`}></i>{dark ? "Light mode" : "Dark mode"}
                    </button>
                    <div className="zp-menu-divider" />
                    <button className="zp-menu-item text-danger" onClick={signOut}>
                      <i className="bi bi-box-arrow-right"></i>Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          <main className="zp-content">{children}</main>
        </div>

        {paletteOpen && <CommandPalette items={allItems} onClose={() => setPaletteOpen(false)} onGo={(p) => { setPaletteOpen(false); router.push(p); }} />}
      </div>
    </UIProvider>
  );
}

function CommandPalette({ items, onClose, onGo }: { items: (NavItem & { group: string })[]; onClose: () => void; onGo: (path: string) => void }) {
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const results = items.filter((i) => `${i.name} ${i.group}`.toLowerCase().includes(q.toLowerCase())).slice(0, 12);
  return (
    <div className="zp-overlay zp-overlay-top" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="zp-palette" role="dialog" aria-label="Search">
        <div className="zp-palette-input">
          <i className="bi bi-search"></i>
          <input
            autoFocus
            placeholder="Jump to a page…"
            value={q}
            onChange={(e) => { setQ(e.target.value); setIdx(0); }}
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(results.length - 1, i + 1)); }
              if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(0, i - 1)); }
              if (e.key === "Enter" && results[idx]) onGo(results[idx].path);
            }}
          />
          <kbd>Esc</kbd>
        </div>
        <div className="zp-palette-list">
          {results.length === 0 && <div className="text-muted small p-3">No pages match “{q}”.</div>}
          {results.map((r, i) => (
            <button key={r.path} className={`zp-palette-item ${i === idx ? "is-active" : ""}`} onMouseEnter={() => setIdx(i)} onClick={() => onGo(r.path)}>
              <i className={`bi ${r.icon}`}></i>
              <span className="flex-grow-1 text-start">{r.name}</span>
              <span className="small text-muted">{r.group}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function BootstrapDashboardLayout(props: BootstrapDashboardLayoutProps) {
  return (
    <Suspense fallback={<div className="d-flex" style={{ minHeight: "100vh" }}><div className="spinner-border text-primary m-auto" role="status"><span className="visually-hidden">Loading...</span></div></div>}>
      <DashboardShell {...props} />
    </Suspense>
  );
}
