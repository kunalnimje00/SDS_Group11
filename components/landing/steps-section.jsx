import { ArrowDownRight, Check, Compass, Search, ShoppingBag, Timer } from "lucide-react";

const steps = [
  { icon: Search, title: "Discover", body: "Find a cafeteria and browse its menu." },
  { icon: Compass, title: "Choose", body: "Select your food and shape a cart that feels right." },
  { icon: ShoppingBag, title: "Order", body: "Review the order and choose pickup or an available destination." },
  { icon: Timer, title: "Track", body: "Follow order status and view a saved ETA when available." },
];

export function StepsSection() {
  return (
    <section className="landing-steps-section" id="how-it-works" aria-labelledby="steps-title">
      <div className="landing-steps-topline"><p className="landing-section-eyebrow">FROM CRAVING TO PICKUP</p><span className="landing-steps-prototype"><Check size={13} /> Four simple steps</span></div>
      <div className="landing-section-heading landing-steps-heading"><h2 id="steps-title">The lunch break,<br /><span>reimagined.</span></h2><p>One clear path from “what sounds good?” to “that hit the spot.”</p></div>
      <div className="landing-steps-grid">
        {steps.map(({ icon: Icon, title, body }, index) => (
          <article className="landing-step-card" key={title}>
            <div className="landing-step-top"><span className="landing-step-number">0{index + 1}</span><span className="landing-step-icon"><Icon size={19} strokeWidth={1.7} /></span></div>
            <h3>{title}</h3><p>{body}</p>
            {index < steps.length - 1 && <ArrowDownRight className="landing-step-connector" size={20} aria-hidden="true" />}
          </article>
        ))}
      </div>
      <p className="landing-steps-note">Product journey preview. Exact pickup, delivery, and status behavior depends on each campus service.</p>
    </section>
  );
}
