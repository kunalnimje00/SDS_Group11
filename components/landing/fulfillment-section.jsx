import { ArrowRight, MapPin, ShoppingBag } from "lucide-react";

export function FulfillmentSection() {
  return (
    <section className="landing-fulfillment-section" aria-labelledby="fulfillment-title">
      <div className="landing-fulfillment-heading"><p className="landing-section-eyebrow">MADE FOR THE WAY YOU MOVE</p><h2 id="fulfillment-title">Pick up. Or meet us<br /><span>where you are.</span></h2><p>Choose the option that fits the day, where your campus supports it.</p></div>
      <div className="landing-fulfillment-cards">
        <article className="landing-fulfillment-card pickup-card"><div className="fulfillment-icon"><ShoppingBag size={22} strokeWidth={1.7} /></div><span className="fulfillment-kicker">THE CLASSIC</span><h3>Pickup</h3><p>Place an order and collect it from the cafeteria when it is ready.</p><span className="fulfillment-route"><span>Menu</span><i /><span>Counter</span></span></article>
        <article className="landing-fulfillment-card delivery-card"><div className="fulfillment-icon"><MapPin size={22} strokeWidth={1.7} /></div><span className="fulfillment-kicker">WHEN YOUR CAMPUS SUPPORTS IT</span><h3>Campus delivery</h3><p>Choose from supported campus destinations and have the order brought to you.</p><span className="fulfillment-route"><span>Menu</span><i /><span>Campus destination</span></span><span className="fulfillment-footnote"><ArrowRight size={12} /> No live fleet or GPS tracking is shown here.</span></article>
      </div>
    </section>
  );
}
