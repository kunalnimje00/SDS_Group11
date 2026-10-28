import { Clock3, Compass, MapPin, MoveRight, SearchCheck } from "lucide-react";

const benefits = [
  { icon: Compass, title: "Find your favorites", body: "Explore food options across campus cafeterias from one convenient place." },
  { icon: SearchCheck, title: "Skip the uncertainty", body: "Browse menus and place an order request through a single interface." },
  { icon: Clock3, title: "Stay in the loop", body: "See order progress and a saved estimate when those details are available." },
  { icon: MapPin, title: "Choose what works", body: "Collect from the counter or choose a supported campus destination." },
];

export function ValueSection() {
  return (
    <section className="landing-value-section" id="value-proposition" aria-labelledby="value-title">
      <div className="landing-section-heading landing-value-heading">
        <div><p className="landing-section-eyebrow">A BETTER BREAK, BY DESIGN</p><h2 id="value-title">Good food.<br /><span>Less guesswork.</span></h2></div>
        <p>Campus lunch has its own rhythm. Kantin is designed to help students and cafeteria teams find theirs.</p>
      </div>
      <div className="landing-benefit-list">
        {benefits.map(({ icon: Icon, title, body }, index) => (
          <article className="landing-benefit" key={title}>
            <span className="landing-benefit-number">0{index + 1}</span>
            <span className="landing-benefit-icon"><Icon size={19} strokeWidth={1.7} /></span>
            <h3>{title}</h3><p>{body}</p>
            <MoveRight className="landing-benefit-arrow" size={16} aria-hidden="true" />
          </article>
        ))}
      </div>
    </section>
  );
}
