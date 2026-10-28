"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight, Clock3, Sparkles, UtensilsCrossed } from "lucide-react";
import { useKantin } from "@/app/kantin-context";
import { CafeCard } from "./cafe-card";
import { MenuItemCard } from "./menu-item-card";
import { DemoNotice, SectionHeading } from "./ui";

export function StudentHome() {
  const { cafes, menuItems, user } = useKantin();
  const cafe = cafes[0];
  const userGreeting = user?.user_metadata?.display_name
    ? `Welcome back, ${user.user_metadata.display_name}`
    : "Your lunch break, better spent.";

  // Guard: cafes haven't loaded from Supabase yet (or during static prerender)
  if (!cafe) {
    return (
      <div className="page-stack dashboard-page">
        <div className="home-welcome-row">
          <div>
            <p className="eyebrow">CAMPUS DINING EXPERIENCE</p>
            <h1>{userGreeting}</h1>
            <p className="home-lede">
              Loading campus cafeteria…
            </p>
          </div>
        </div>
        <div className="skeleton-card" style={{ height: 200 }} />
      </div>
    );
  }

  return (
    <div className="page-stack dashboard-page">
      <div className="home-welcome-row">
        <div>
          <p className="eyebrow">CAMPUS DINING EXPERIENCE</p>
          <h1>{userGreeting}</h1>
          <p className="home-lede">
            A delicious meal is just a few taps away. Skip the queue and pick up your order fresh.
          </p>
        </div>
        {!user && (
          <DemoNotice>
            You are browsing as a guest. <Link href="/login" style={{ color: "var(--mint)", fontWeight: 700 }}>Sign in</Link> with your student account for personalized orders.
          </DemoNotice>
        )}
      </div>

      <section className="home-hero" aria-labelledby="hero-title">
        <div className="hero-content">
          <div className="hero-kicker">
            <span className="hero-kicker-dot" /> SMART CAFETERIA ORDERING
          </div>
          <h2 id="hero-title">
            A little lunch.<br />
            <span>A lot easier.</span>
          </h2>
          <p>Explore today&apos;s campus cafe menus and place your meal orders without the crowd.</p>
          <Link className="button button-primary" href={`/cafes/${cafe.id}`}>
            Explore the menu <ArrowRight size={17} />
          </Link>
        </div>
        <div className="hero-side-card">
          <div className="hero-bowl-art">
            <span className="hero-bowl-ring" />
            <span className="hero-bowl-icon">
              <UtensilsCrossed size={32} strokeWidth={1.4} />
            </span>
            <Sparkles className="hero-sparkle" size={19} />
          </div>
          <div className="hero-side-copy">
            <span className="tiny-label">FEATURED CAFE</span>
            <strong>{cafe.name}</strong>
            <span>
              <Clock3 size={14} /> Open daily · Fresh batches
            </span>
          </div>
        </div>
        <div className="hero-decoration hero-decoration-one" />
        <div className="hero-decoration hero-decoration-two" />
      </section>

      <div className="section-heading-row">
        <SectionHeading
          title="Campus Canteen"
          action={
            <Link className="text-link" href="/cafes">
              Browse all <ArrowUpRight size={15} />
            </Link>
          }
        />
      </div>
      <CafeCard cafe={cafe} />

      <div className="section-heading-row menu-section-heading">
        <SectionHeading
          title="Popular Items"
          action={
            <Link className="text-link" href={`/cafes/${cafe.id}`}>
              See full menu <ArrowUpRight size={15} />
            </Link>
          }
        />
        <p className="section-subtitle">Freshly available today from the cafeteria.</p>
      </div>
      <div className="menu-grid menu-grid-home">
        {menuItems.slice(0, 3).map((item, index) => (
          <MenuItemCard key={item.id} item={item} index={index} compact />
        ))}
      </div>

      <div className="home-bottom-link">
        <span>
          <span className="bottom-link-icon">
            <UtensilsCrossed size={17} />
          </span>
          <span>
            <strong>Looking for more options?</strong>
            <small>See all items, prices, and prep time estimates.</small>
          </span>
        </span>
        <Link href={`/cafes/${cafe.id}`} className="icon-button icon-button-outline" aria-label="Browse full menu">
          <ArrowUpRight size={18} />
        </Link>
      </div>
    </div>
  );
}
