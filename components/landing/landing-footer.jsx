"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, MessageCircle, Soup } from "lucide-react";

export function FinalCallToAction() {
  return (
    <section className="landing-final-cta" aria-labelledby="final-cta-title">
      <div className="landing-final-orbit landing-final-orbit-one" />
      <div className="landing-final-orbit landing-final-orbit-two" />
      <div className="landing-final-content">
        <p className="landing-section-eyebrow">A BETTER KIND OF BREAK</p>
        <h2 id="final-cta-title">
          Make your next campus<br />
          <span>meal simpler.</span>
        </h2>
        <p>Explore campus food options, order ahead, and skip the lunchtime rush.</p>
        <div className="landing-hero-actions">
          <Link className="landing-button landing-button-light" href="/cafes">
            Browse Cafeterias <ArrowUpRight size={16} />
          </Link>
          <Link className="landing-button landing-button-final-secondary" href="/cafe">
            Cafe Manager Portal <ArrowUpRight size={16} />
          </Link>
        </div>
        <span className="landing-final-note">Smart Cafeteria Ordering System · Kantin</span>
      </div>
    </section>
  );
}

const footerLinks = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "For Students", href: "#student-showcase" },
  { label: "For Cafeterias", href: "#manager-showcase" },
];

export function LandingFooter() {
  const [showSupportNote, setShowSupportNote] = useState(false);
  return (
    <footer className="landing-footer" id="support">
      <div className="landing-footer-main">
        <div className="landing-footer-brand-col">
          <Link href="/" className="landing-brand">
            <span className="landing-brand-mark">
              <Soup size={19} strokeWidth={1.8} />
            </span>
            <span>
              Kantin<span className="landing-brand-period">.</span>
            </span>
          </Link>
          <p>Campus food, thoughtfully connected.</p>
          <span className="landing-footer-demo">
            <i /> Smart Cafeteria System
          </span>
        </div>
        <div className="landing-footer-link-col">
          <p>EXPLORE</p>
          {footerLinks.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </div>
        <div className="landing-footer-link-col">
          <p>STUDENT ACCESS</p>
          <Link href="/dashboard">Student Dashboard</Link>
          <Link href="/cafes">Browse Cafeterias</Link>
          <Link href="/orders">My Orders</Link>
          <Link href="/cart">Cart</Link>
          <Link href="/login">Sign In / Register</Link>
        </div>
        <div className="landing-footer-link-col">
          <p>CAFE MANAGEMENT</p>
          <Link href="/cafe">Cafe Dashboard</Link>
          <Link href="/cafe/orders">Live Orders Queue</Link>
          <Link href="/cafe/menu">Menu Management</Link>
          <Link href="/cafe/login">Staff Login</Link>
          <Link href="/cafe/register">Register New Cafe</Link>
        </div>
        <div className="landing-footer-link-col landing-footer-support">
          <p>SUPPORT</p>
          <button type="button" onClick={() => setShowSupportNote((value) => !value)}>
            <MessageCircle size={15} /> Campus Helpdesk
          </button>
          {showSupportNote && (
            <span className="landing-support-note" role="status">
              For canteen assistance, contact your campus facility office or cafeteria manager.
            </span>
          )}
        </div>
      </div>
      <div className="landing-footer-bottom">
        <span>&copy; 2026 Kantin · Smart Cafeteria Ordering System</span>
        <span>Made for faster breaks &amp; happier queues</span>
        <a href="#main-content">
          Back to top <ArrowUpRight size={13} />
        </a>
      </div>
    </footer>
  );
}
