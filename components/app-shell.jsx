"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BookOpen, ChevronRight, CircleUserRound, ClipboardList, Menu, ShoppingBasket, UtensilsCrossed, X, LogIn } from "lucide-react";
import { useKantin } from "@/app/kantin-context";

const navigation = [
  { href: "/", label: "Home", icon: BookOpen },
  { href: "/cafes", label: "Browse canteens", icon: UtensilsCrossed },
  { href: "/cart", label: "My cart", icon: ShoppingBasket, cart: true },
  { href: "/orders", label: "My orders", icon: ClipboardList },
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

export function AppShell({ children }) {
  const pathname = usePathname();
  const { cart, user } = useKantin();
  const [mobileOpen, setMobileOpen] = useState(false);
  const itemCount = Object.values(cart.quantities).reduce((sum, count) => sum + Number(count || 0), 0);

  function closeMobile() {
    setMobileOpen(false);
  }

  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Student preview";
  const userSubtitle = user ? (user.email || "Active student") : "Sign in / Profile";

  return (
    <div className="app-frame">
      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`} aria-label="Student navigation">
        <div className="sidebar-brand-row">
          <Link className="brand-lockup" href="/" onClick={closeMobile}>
            <KantinMark />
            <span className="brand-name">
              kantin<span className="brand-period">.</span>
            </span>
          </Link>
          <button className="icon-button sidebar-close" type="button" aria-label="Close navigation" onClick={closeMobile}>
            <X size={19} />
          </button>
        </div>
        <div className="sidebar-section-label">STUDENT SPACE</div>
        <nav className="side-nav">
          {navigation.map(({ href, label, icon: Icon, cart: isCart }) => {
            const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                className={`nav-link ${active ? "nav-link-active" : ""}`}
                href={href}
                onClick={closeMobile}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={19} strokeWidth={1.85} aria-hidden="true" />
                <span>{label}</span>
                {isCart && itemCount > 0 && (
                  <span className="nav-count" aria-label={`${itemCount} items`}>
                    {itemCount}
                  </span>
                )}
                {active && <ChevronRight className="nav-chevron" size={15} aria-hidden="true" />}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-demo-card">
          <div className="sidebar-demo-icon">
            <UtensilsCrossed size={17} />
          </div>
          <p className="sidebar-demo-title">A little lunch, a lot easier.</p>
          <p className="sidebar-demo-copy">Smart Cafeteria System</p>
          <Link href="/cafes" className="sidebar-demo-link" onClick={closeMobile}>
            Explore menu <ChevronRight size={14} />
          </Link>
        </div>
        <Link
          href="/profile"
          className={`profile-link ${pathname === "/profile" ? "profile-link-active" : ""}`}
          onClick={closeMobile}
        >
          <span className="profile-avatar">
            <CircleUserRound size={20} />
          </span>
          <span className="profile-link-text">
            <strong>{displayName}</strong>
            <small>{userSubtitle}</small>
          </span>
          <ChevronRight size={15} className="profile-link-arrow" />
        </Link>
      </aside>

      {mobileOpen && (
        <button type="button" className="mobile-scrim" aria-label="Close navigation" onClick={closeMobile} />
      )}

      <div className="workspace">
        <header className="topbar">
          <button
            className="icon-button mobile-menu-button"
            type="button"
            aria-label="Open navigation"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={21} />
          </button>
          <div className="topbar-context">
            <span className="topbar-dot" /> <span>STUDENT DASHBOARD</span>
            <span className="topbar-divider">/</span>
            <span className="topbar-current">{user ? "Live Session" : "Preview"}</span>
          </div>
          <Link href="/profile" className="topbar-profile" aria-label="Open profile">
            <span className="topbar-profile-avatar">
              <CircleUserRound size={18} />
            </span>
            <span>{user ? displayName : "Student"}</span>
          </Link>
        </header>
        <main className="main-content">{children}</main>
        <footer className="site-footer">
          <span>Made for the in-between moments.</span>
          <span>Kantin <i>·</i> Smart Cafeteria System</span>
        </footer>
      </div>
    </div>
  );
}
