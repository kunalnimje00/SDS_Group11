"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, Menu, Soup, X } from "lucide-react";
import { useKantin } from "@/app/kantin-context";

const links = [
  { href: "#how-it-works", label: "How It Works" },
  { href: "#student-showcase", label: "For Students" },
  { href: "#manager-showcase", label: "For Cafeterias" },
];

export function LandingNav() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const closeMenu = () => setOpen(false);
  const { user } = useKantin();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <a className="landing-skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="landing-nav-wrap">
        <div className="landing-nav">
          <Link className="landing-brand" href="/" aria-label="Kantin home" onClick={closeMenu}>
            <span className="landing-brand-mark">
              <Soup size={19} strokeWidth={1.8} aria-hidden="true" />
            </span>
            <span>
              Kantin<span className="landing-brand-period">.</span>
            </span>
          </Link>
          <button
            className="landing-mobile-toggle"
            type="button"
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-controls="landing-navigation"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X size={21} /> : <Menu size={21} />}
          </button>
          <nav
            id="landing-navigation"
            className={`landing-nav-links ${open ? "landing-nav-open" : ""}`}
            aria-label="Main navigation"
          >
            {links.map((link) => (
              <a key={link.href} href={link.href} onClick={closeMenu}>
                {link.label}
              </a>
            ))}
            {mounted && user ? (
              <Link className="landing-signin" href="/dashboard" onClick={closeMenu}>
                Dashboard
              </Link>
            ) : (
              <Link className="landing-signin" href="/login" onClick={closeMenu}>
                Sign In
              </Link>
            )}
            <Link className="landing-nav-cta" href="/cafes" onClick={closeMenu}>
              Explore Cafeterias <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          </nav>
        </div>
      </header>
      {open && (
        <button
          className="landing-mobile-scrim"
          aria-label="Close navigation"
          type="button"
          onClick={closeMenu}
        />
      )}
    </>
  );
}
