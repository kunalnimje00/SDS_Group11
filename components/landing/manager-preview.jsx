"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Clock3, Eye, EyeOff, SlidersHorizontal, UtensilsCrossed } from "lucide-react";

const initialOrders = [
  { id: "A1", label: "Order #ORD-1042", detail: "Pickup at main counter", status: "Accepted" },
  { id: "B2", label: "Order #ORD-1043", detail: "Library 2nd floor delivery", status: "Preparing" },
];
const initialMenu = [
  { id: "wrap", name: "Paneer Tikka Wrap", price: 120, available: true },
  { id: "sandwich", name: "Veggie Cheese Sandwich", price: 90, available: true },
  { id: "coffee", name: "Cold Coffee", price: 80, available: false },
];
const statuses = ["Accepted", "Preparing", "Ready"];

export function ManagerPreview() {
  const [orders, setOrders] = useState(initialOrders);
  const [menu, setMenu] = useState(initialMenu);
  const [eta, setEta] = useState("15");
  const [savedEta, setSavedEta] = useState("15");
  const [feedback, setFeedback] = useState("");

  function updateStatus(id, status) {
    setOrders((current) => current.map((order) => order.id === id ? { ...order, status } : order));
    setFeedback(`Order status updated to ${status}.`);
  }

  function toggleMenu(itemId) {
    setMenu((current) => current.map((item) => item.id === itemId ? { ...item, available: !item.available } : item));
    setFeedback("Menu availability toggled.");
  }

  function saveEta(event) {
    event.preventDefault();
    setSavedEta(eta);
    setFeedback(`Preparation estimate set to ${eta} minutes.`);
  }

  return (
    <section className="landing-manager-section" id="manager-showcase" aria-labelledby="manager-title">
      <div className="landing-manager-copy">
        <p className="landing-section-eyebrow">A CAFETERIA TEAM&apos;S SIDE OF CAMPUS</p>
        <h2 id="manager-title">Run your cafeteria.<br /><span>Not the chaos.</span></h2>
        <p className="landing-manager-lede">Manage your menu, organize incoming orders in a live queue, and keep students informed with real-time ETAs.</p>
        <div className="manager-points">
          <span><i /> Real-time menu &amp; availability controls</span>
          <span><i /> Live order queue &amp; status transitions</span>
          <span><i /> Kitchen preparation estimate management</span>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24 }}>
          <Link className="landing-button landing-button-secondary" href="/cafe">
            Open Cafe Dashboard <ArrowRight size={16} />
          </Link>
          <Link className="landing-button landing-button-final-secondary" href="/cafe/register">
            Register New Cafe
          </Link>
        </div>
        <p className="landing-manager-note">Interactive preview below. Use the buttons above to log in to the actual cafe manager dashboard.</p>
      </div>

      <div className="manager-preview-wrap" id="manager-preview">
        <div className="manager-window">
          <div className="manager-window-topbar">
            <div className="manager-window-brand">
              <span className="manager-window-mark"><UtensilsCrossed size={14} /></span>
              <div><strong>Cafe workspace</strong><span>Manager portal</span></div>
            </div>
            <span className="manager-mode-pill"><i /> LIVE PREVIEW</span>
          </div>
          <div className="manager-preview-body">
            <div className="manager-orders-panel">
              <div className="manager-panel-heading">
                <div><span className="preview-label">KITCHEN QUEUE</span><h3>Incoming orders</h3></div>
                <span className="manager-panel-icon"><SlidersHorizontal size={15} /></span>
              </div>
              <div className="manager-orders-list">
                {orders.map((order) => (
                  <article className="manager-order-card" key={order.id}>
                    <div className="manager-order-main">
                      <span className={`manager-order-marker manager-marker-${order.status.toLowerCase()}`} />
                      <div><strong>{order.label}</strong><span>{order.detail}</span></div>
                      <span className={`manager-status-label manager-status-${order.status.toLowerCase()}`}>{order.status}</span>
                    </div>
                    <label className="manager-select-label">
                      Update status
                      <select aria-label={`Change ${order.label} status`} value={order.status} onChange={(event) => updateStatus(order.id, event.target.value)}>
                        {statuses.map((status) => <option key={status}>{status}</option>)}
                      </select>
                    </label>
                  </article>
                ))}
              </div>
            </div>

            <div className="manager-tools-grid">
              <section className="manager-tools-card">
                <div className="manager-panel-heading">
                  <div><span className="preview-label">MENU CONTROLS</span><h3>Daily availability</h3></div>
                  <span className="manager-panel-icon"><UtensilsCrossed size={15} /></span>
                </div>
                <div className="manager-menu-list">
                  {menu.map((item) => (
                    <div className="manager-menu-row" key={item.id}>
                      <div className="manager-menu-name">
                        <strong>{item.name}</strong>
                        <span>Price · ₹{item.price}</span>
                      </div>
                      <button
                        type="button"
                        className={`availability-toggle ${item.available ? "availability-on" : "availability-off"}`}
                        aria-pressed={item.available}
                        aria-label={`${item.available ? "Pause" : "Make available"} ${item.name}`}
                        onClick={() => toggleMenu(item.id)}
                      >
                        {item.available ? <><Eye size={13} /> Available</> : <><EyeOff size={13} /> Paused</>}
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              <form className="manager-tools-card manager-eta-card" onSubmit={saveEta}>
                <div className="manager-panel-heading">
                  <div><span className="preview-label">KITCHEN ETA</span><h3>Ready in about</h3></div>
                  <span className="manager-panel-icon"><Clock3 size={15} /></span>
                </div>
                <label className="manager-eta-input">
                  <span className="sr-only">Approximate preparation estimate in minutes</span>
                  <input type="number" min="1" max="90" value={eta} onChange={(event) => setEta(event.target.value)} inputMode="numeric" />
                  <span>min</span>
                </label>
                <button className="manager-eta-save" type="submit">Update kitchen estimate</button>
                <p className="manager-eta-result">Shown to students: <strong>~{savedEta || "—"} min</strong></p>
              </form>
            </div>
          </div>
          <p className="manager-feedback" aria-live="polite">{feedback || "Try toggling dish availability or updating order status above."}</p>
        </div>
      </div>
    </section>
  );
}
