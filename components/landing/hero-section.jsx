import Link from "next/link";
import { ArrowDown, ArrowRight, Clock3, UtensilsCrossed } from "lucide-react";

export function HeroSection() {
  return (
    <section className="landing-hero" aria-labelledby="landing-hero-title">
      <div className="landing-hero-copy">
        <div className="landing-eyebrow">
          <span className="landing-eyebrow-dot" /> CAMPUS FOOD, SIMPLIFIED
        </div>
        <h1 id="landing-hero-title">
          Your campus cravings.<br />
          <span>One simple order.</span>
        </h1>
        <p className="landing-hero-lede">
          Discover campus cafeterias, explore their menus, and order your favorites without spending your break waiting in line.
        </p>
        <div className="landing-hero-actions">
          <Link className="landing-button landing-button-primary" href="/cafes">
            Explore Cafeterias <ArrowRight size={17} />
          </Link>
          <Link className="landing-button landing-button-secondary" href="/dashboard">
            Student Dashboard
          </Link>
        </div>
        <div className="landing-hero-note">
          <span className="landing-preview-dot" /> Smart Cafeteria System · Order ahead &amp; skip the queue
        </div>
        <a className="landing-scroll-cue" href="#value-proposition">
          <span>Scroll to explore</span>
          <ArrowDown size={14} />
        </a>
      </div>
      <div className="landing-hero-visual">
        <div className="landing-hero-photo-wrap">
          <img
            className="landing-hero-photo"
            src="/landing/campus-meal-hero.jpg"
            alt="Illustrative Indian campus meal with rice, curries, and side dishes"
            fetchPriority="high"
          />
          <div className="landing-photo-vignette" />
          <span className="landing-photo-tag">
            <span /> CAMPUS DINING · READY TO ORDER
          </span>
          <div className="landing-dish-card">
            <div className="landing-dish-icon">
              <UtensilsCrossed size={16} />
            </div>
            <div>
              <span className="landing-card-kicker">FEATURED DISH</span>
              <strong>Masala Dosa</strong>
              <span>Popular canteen favorite</span>
            </div>
          </div>
          <div className="landing-status-card">
            <span className="landing-status-icon">
              <Clock3 size={16} />
            </span>
            <div>
              <span className="landing-card-kicker">LIVE ORDER STATUS</span>
              <strong><i /> Preparing</strong>
              <span>ETA approx. 15 min</span>
            </div>
          </div>
        </div>
        <span className="landing-visual-caption">A glimpse of a simpler campus lunch.</span>
      </div>
    </section>
  );
}
