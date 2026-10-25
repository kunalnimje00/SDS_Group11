"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, ClipboardList, UtensilsCrossed, Package, Clock,
  History, BarChart3, Settings, ChevronRight, CircleUserRound,
  Menu, X, LogOut,
} from "lucide-react";
import { useCafe } from "@/app/cafe/providers";

const navigation = [
  { href: "/cafe", label: "Overview", icon: LayoutDashboard },
  { href: "/cafe/orders", label: "Orders", icon: ClipboardList, badge: true },
  { href: "/cafe/menu", label: "Menu Management", icon: UtensilsCrossed },
  { href: "/cafe/inventory", label: "Inventory", icon: Package },
  { href: "/cafe/hours", label: "Operating Hours", icon: Clock },
  { href: "/cafe/history", label: "Order History", icon: History },
  { href: "/cafe/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/cafe/settings", label: "Settings", icon: Settings },
];

function KantinMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

export function CafeShell({ children }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState("");

  const { user, cafeName, pendingOrdersCount, signOut } = useCafe();

  useEffect(() => {
    try {
      const formatted = new Intl.DateTimeFormat("en-IN", {
        weekday: "short", day: "numeric", month: "short", year: "numeric",
      }).format(new Date());
      setCurrentDate(formatted);
    } catch {
      setCurrentDate("");
    }
  }, []);

  function closeMobile() { setMobileOpen(false); }

  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Cafe Staff";

  return (
    <div className="app-frame">
      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`} aria-label="Cafeteria navigation">
        <div className="sidebar-brand-row">
          <Link className="brand-lockup" href="/cafe" onClick={closeMobile}>
            <KantinMark />
            <span className="brand-name">kantin<span className="brand-period">.</span></span>
          </Link>
          <button className="icon-button sidebar-close" type="button" aria-label="Close navigation" onClick={closeMobile}>
            <X size={19} />
          </button>
        </div>

        <div className="sidebar-section-label">CAFETERIA OPS</div>

        <nav className="side-nav">
          {navigation.map(({ href, label, icon: Icon, badge }) => {
            const active = href === "/cafe" ? pathname === "/cafe" : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link key={href} className={`nav-link ${active ? "nav-link-active" : ""}`} href={href} onClick={closeMobile} aria-current={active ? "page" : undefined}>
                <Icon size={19} strokeWidth={1.85} aria-hidden="true" />
                <span>{label}</span>
                {badge && pendingOrdersCount > 0 && (
                  <span className="nav-count" aria-label={`${pendingOrdersCount} pending orders`}>{pendingOrdersCount}</span>
                )}
                {active && <ChevronRight className="nav-chevron" size={15} aria-hidden="true" />}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-spacer" />

        <div style={{ borderTop: "1px solid var(--border)", display: "flex", alignItems: "center" }}>
          <Link href="/cafe/settings" className={`profile-link ${pathname === "/cafe/settings" ? "profile-link-active" : ""}`} style={{ flex: 1, borderTop: 0, marginTop: 0 }} onClick={closeMobile}>
            <span className="profile-avatar"><CircleUserRound size={20} /></span>
            <span className="profile-link-text">
              <strong>{displayName}</strong>
              <small>Cafe Staff</small>
            </span>
            <ChevronRight size={15} className="profile-link-arrow" />
          </Link>
          {signOut && (
            <button type="button" className="icon-button" title="Sign out" aria-label="Sign out" onClick={() => signOut()} style={{ marginRight: 6 }}>
              <LogOut size={16} />
            </button>
          )}
        </div>
      </aside>

      {mobileOpen && <button type="button" className="mobile-scrim" aria-label="Close navigation" onClick={closeMobile} />}

      <div className="workspace">
        <header className="topbar">
          <button className="icon-button mobile-menu-button" type="button" aria-label="Open navigation" aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)}>
            <Menu size={21} />
          </button>
          <div className="topbar-context">
            <span className="topbar-dot" />
            <span>CAFETERIA DASHBOARD</span>
            <span className="topbar-divider">/</span>
            <span className="topbar-current">{cafeName}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {currentDate && <span style={{ color: "var(--muted)", fontSize: 11, fontWeight: 500 }}>{currentDate}</span>}
            <Link href="/cafe/settings" className="topbar-profile" aria-label="Staff settings">
              <span className="topbar-profile-avatar"><CircleUserRound size={18} /></span>
              <span>{displayName}</span>
            </Link>
          </div>
        </header>
        <main className="main-content">{children}</main>
        <footer className="site-footer">
          <span>Cafeteria Operations · Kantin</span>
          <span>Kantin <i>·</i> Smart Cafeteria System</span>
        </footer>
      </div>
    </div>
  );
}
