import Link from "next/link";
import { ArrowUpRight, Clock3, UtensilsCrossed } from "lucide-react";

export function CafeCard({ cafe }) {
  return (
    <article className="cafe-card">
      <div className="cafe-card-art">
        <span className="cafe-art-ring" />
        <span className="cafe-art-icon">
          <UtensilsCrossed size={25} strokeWidth={1.65} />
        </span>
        <span className="demo-label">CAMPUS CAFE</span>
      </div>
      <div className="cafe-card-content">
        <div className="cafe-card-title-row">
          <div>
            <p className="eyebrow">CAMPUS CANTEEN</p>
            <h3>{cafe.name}</h3>
          </div>
          <span className="status-dot-label">
            <span className="status-dot" />
            {cafe.is_accepting_orders ? "Accepting orders" : "Not accepting orders"}
          </span>
        </div>
        <p className="cafe-card-description">Freshly prepared meals and refreshments on campus.</p>
        <div className="cafe-card-footer">
          <span>
            <Clock3 size={15} /> Open daily · see hours
          </span>
          <Link href={`/cafes/${cafe.id}`} className="button button-secondary button-small">
            View menu <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
    </article>
  );
}
