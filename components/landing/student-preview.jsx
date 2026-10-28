"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Check, Clock3, Minus, Plus, Search, ShoppingBag, Utensils } from "lucide-react";

const menu = [
  { id: "wrap", name: "Paneer Tikka Wrap", price: 120, category: "Wraps", image: "/landing/paneer-wrap.jpg", alt: "Illustrative vegetable wrap held against a leafy green backdrop" },
  { id: "sandwich", name: "Veggie Cheese Sandwich", price: 90, category: "Sandwiches", image: "/landing/grilled-sandwich.jpg", alt: "Illustrative grilled sandwich triangles with dipping sauce" },
  { id: "coffee", name: "Cold Coffee", price: 80, category: "Drinks", image: "/landing/cold-coffee.jpg", alt: "Illustrative iced coffee in a clear glass" },
  { id: "dosa", name: "Masala Dosa", price: 100, category: "South Indian", image: "/landing/masala-dosa.jpg", alt: "Illustrative masala dosa with chutney and sides" },
];
const categories = ["All", "Wraps", "Sandwiches", "Drinks", "South Indian"];
const inr = (amount) => `₹${amount}`;

function TrackingPreview() {
  const statuses = ["Accepted", "Preparing", "Ready"];
  return (
    <section className="student-tracking-card" aria-label="Sample order tracking preview">
      <div className="student-tracking-header">
        <span className="student-tracking-icon"><Clock3 size={16} /></span>
        <div><span className="preview-label">LIVE STATUS SYSTEM</span><h3>Order progress</h3></div>
        <span className="student-tracking-eta">~15 min</span>
      </div>
      <ol className="student-tracking-steps">
        {statuses.map((status, index) => (
          <li className={index < 2 ? "student-track-complete" : "student-track-ready"} key={status}>
            <span className="student-track-dot">{index < 2 ? <Check size={10} /> : null}</span>
            <span>{status}</span>
            {index < statuses.length - 1 && <i aria-hidden="true" />}
          </li>
        ))}
      </ol>
      <p className="student-tracking-foot">Status updates and kitchen ETA saved in real time.</p>
    </section>
  );
}

export function StudentPreview() {
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState({});
  const [announcement, setAnnouncement] = useState("");
  const visibleMenu = useMemo(() => menu.filter((item) => {
    const matchesCategory = category === "All" || item.category === category;
    const matchesSearch = item.name.toLowerCase().includes(query.trim().toLowerCase());
    return matchesCategory && matchesSearch;
  }), [category, query]);
  const cartLines = menu.filter((item) => cart[item.id]);
  const cartCount = cartLines.reduce((total, item) => total + cart[item.id], 0);
  const subtotal = cartLines.reduce((total, item) => total + item.price * cart[item.id], 0);

  function add(item) {
    setCart((current) => ({ ...current, [item.id]: (current[item.id] || 0) + 1 }));
    setAnnouncement(`${item.name} added to cart.`);
  }

  function remove(item) {
    setCart((current) => {
      const next = { ...current };
      if (next[item.id] <= 1) delete next[item.id];
      else next[item.id] -= 1;
      return next;
    });
    setAnnouncement(`${item.name} quantity updated.`);
  }

  return (
    <section className="landing-student-section" id="student-showcase" aria-labelledby="student-preview-title">
      <div className="landing-showcase-header">
        <div>
          <p className="landing-section-eyebrow">A STUDENT&apos;S SIDE OF CAMPUS</p>
          <h2 id="student-preview-title">Your campus,<br /><span>on the menu.</span></h2>
        </div>
        <div className="landing-showcase-intro">
          <p>Explore cafeteria menus, build your meal, and track your order in real time.</p>
          <span className="showcase-disclaimer">
            <i /> Connected to live canteen inventory &amp; queue status.
          </span>
        </div>
      </div>

      <div className="student-showcase-frame">
        <div className="student-window-topbar">
          <div className="student-window-brand">
            <span className="student-window-mark"><Utensils size={13} /></span>
            <strong>kantin<span>.</span></strong>
          </div>
          <span className="student-window-title">STUDENT INTERFACE</span>
          <div className="student-window-cart">
            <ShoppingBag size={15} />
            <span>Cart</span>
            <b aria-live="polite">{cartCount}</b>
          </div>
        </div>
        <div className="student-window-body">
          <div className="student-window-main">
            <div className="student-preview-welcome">
              <div>
                <span className="preview-label">CAMPUS CANTEEN</span>
                <h3>Fresh meals made to order</h3>
                <p>Browse dishes, customize items, and skip the waiting line</p>
              </div>
              <div className="student-cafe-avatar"><Utensils size={18} /></div>
            </div>
            <label className="student-search">
              <Search size={15} />
              <span className="sr-only">Search dishes</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search dishes or categories..." />
            </label>
            <div className="student-category-row" aria-label="Sample food categories">
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`student-category ${category === item ? "student-category-active" : ""}`}
                  aria-pressed={category === item}
                  onClick={() => setCategory(item)}
                >
                  {item}
                </button>
              ))}
            </div>
            {visibleMenu.length ? (
              <div className="student-menu-grid">
                {visibleMenu.map((item) => (
                  <article className="student-menu-card" key={item.id}>
                    <div className="student-menu-image">
                      <img src={item.image} alt={item.alt} loading="lazy" />
                      <span className="student-menu-category">{item.category}</span>
                    </div>
                    <div className="student-menu-copy">
                      <h4>{item.name}</h4>
                      <div className="student-menu-bottom">
                        <strong>{inr(item.price)}</strong>
                        {cart[item.id] ? (
                          <div className="student-quantity">
                            <button type="button" aria-label={`Remove one ${item.name}`} onClick={() => remove(item)}><Minus size={12} /></button>
                            <span>{cart[item.id]}</span>
                            <button type="button" aria-label={`Add another ${item.name}`} onClick={() => add(item)}><Plus size={12} /></button>
                          </div>
                        ) : (
                          <button className="student-add-button" type="button" onClick={() => add(item)}>Add <Plus size={13} /></button>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="student-empty-result">No items match your search. Try another category.</div>
            )}
          </div>
          <aside className="student-window-aside">
            <section className="student-cart-preview">
              <div className="student-cart-title">
                <span className="student-aside-icon"><ShoppingBag size={15} /></span>
                <div><span className="preview-label">INTERACTIVE CART</span><h3>Cart preview</h3></div>
              </div>
              {cartLines.length ? (
                <div className="student-cart-lines">
                  {cartLines.map((item) => (
                    <div className="student-cart-line" key={item.id}>
                      <span><b>{cart[item.id]}×</b> {item.name}</span>
                      <strong>{inr(cart[item.id] * item.price)}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="student-cart-empty">Add a dish to test the cart interaction.</p>
              )}
              <div className="student-cart-total">
                <span>Subtotal</span>
                <strong>{inr(subtotal)}</strong>
              </div>
              <Link href="/cafes" className="landing-button landing-button-primary" style={{ width: "100%", justifyContent: "center", minHeight: 38, fontSize: 11, marginTop: 8 }}>
                Go to Campus Canteens <ArrowRight size={13} />
              </Link>
            </section>
            <TrackingPreview />
          </aside>
        </div>
      </div>
      <p className="student-announcement" aria-live="polite">{announcement}</p>
    </section>
  );
}
