"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { ArrowLeft, Check, ChevronDown, Clock3, MapPin, ShoppingBag, AlertTriangle } from "lucide-react";
import { useKantin } from "@/app/kantin-context";
import { formatINR } from "@/lib/format";
import { EmptyState, PageHeading } from "./ui";

export function CheckoutPage() {
  const router = useRouter();
  const { cart, hydrated, placeOrder, cafes, menuItems, destinations, user } = useKantin();
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const activeDestinations = useMemo(
    () => (destinations || []).filter((entry) => entry.is_active),
    [destinations]
  );

  // Default to counter/pickup destination (travel_minutes === 0) or first available
  const defaultDestination = useMemo(() => {
    const counter = activeDestinations.find(
      (d) => d.travel_minutes === 0 || d.name?.toLowerCase().includes("counter")
    );
    return counter?.id || activeDestinations[0]?.id || "";
  }, [activeDestinations]);

  const [destinationId, setDestinationId] = useState("");

  // Resolve effective destination: use selected, or default once destinations load
  const effectiveDestinationId = destinationId || defaultDestination;

  if (!hydrated) {
    return (
      <div className="page-stack">
        <div className="skeleton-block" />
      </div>
    );
  }

  const cafe = cafes.find((c) => c.id === cart.cafeId);
  const lines = Object.entries(cart.quantities)
    .map(([id, quantity]) => ({
      item: menuItems.find((item) => item.id === id),
      quantity,
    }))
    .filter((line) => line.item);

  const subtotal = lines.reduce((sum, line) => sum + line.item.price_paise * line.quantity, 0);

  if (!lines.length) {
    return (
      <div className="page-stack">
        <PageHeading eyebrow="ORDER CHECKOUT" title="Checkout" />
        <EmptyState
          icon={ShoppingBag}
          title="No items in checkout"
          description="Please add items from the menu before placing an order."
          action={
            <Link href="/cafes" className="button button-primary">
              Browse menu
            </Link>
          }
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page-stack">
        <PageHeading eyebrow="ORDER CHECKOUT" title="Checkout" />
        <EmptyState
          icon={AlertTriangle}
          title="Sign in required"
          description="You need to sign in before placing an order."
          action={
            <Link href="/login" className="button button-primary">
              Sign in
            </Link>
          }
        />
      </div>
    );
  }

  async function handlePlaceOrder(event) {
    event.preventDefault();
    if (submitting) return;

    if (!effectiveDestinationId) {
      setMessage("Please select a pickup or delivery location.");
      return;
    }

    setMessage("");
    setSubmitting(true);
    try {
      const order = await placeOrder(effectiveDestinationId);
      const orderId = order?.id || order?.order?.id;
      if (orderId) {
        router.push(`/orders/${orderId}`);
      } else {
        router.push("/orders");
      }
    } catch (err) {
      setMessage(err.message || "Order could not be placed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const maxPrepMinutes = Math.max(...lines.map(({ item }) => item.prep_minutes || 10));
  const selectedDest = activeDestinations.find((d) => d.id === effectiveDestinationId);

  return (
    <div className="page-stack">
      <Link href="/cart" className="back-link">
        <ArrowLeft size={15} /> Back to cart
      </Link>
      <PageHeading
        eyebrow="ORDER REVIEW"
        title="Checkout"
        description="Verify your selected pickup spot and place your order."
      />

      <form onSubmit={handlePlaceOrder} className="checkout-layout">
        <div className="checkout-main">
          <section className="checkout-section">
            <div className="checkout-section-title">
              <span className="checkout-step">01</span>
              <div>
                <h2>Campus Pickup Point</h2>
                <p>Choose where you&apos;d like your order delivered or picked up.</p>
              </div>
            </div>
            <label className="field-label" htmlFor="destination">
              Pickup / Delivery location
            </label>
            <div className="select-wrap">
              <MapPin size={16} />
              <select
                id="destination"
                value={effectiveDestinationId}
                onChange={(event) => {
                  setDestinationId(event.target.value);
                  setMessage("");
                }}
                required
              >
                {activeDestinations.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.name}{entry.campus ? ` · ${entry.campus}` : ""}{entry.travel_minutes ? ` · ~${entry.travel_minutes} min transit` : ""}
                  </option>
                ))}
              </select>
              <ChevronDown size={15} />
            </div>
          </section>

          <section className="checkout-section">
            <div className="checkout-section-title">
              <span className="checkout-step">02</span>
              <div>
                <h2>Payment Method</h2>
                <p>Campus canteen payment options.</p>
              </div>
            </div>
            <div className="payment-placeholder">
              <span className="payment-placeholder-icon">
                <Check size={17} />
              </span>
              <span>
                <strong>Pay at Counter / Campus UPI</strong>
                <small>Show order token at counter to pay and pick up</small>
              </span>
              <span className="demo-badge">CAMPUS POS</span>
            </div>
          </section>

          <section className="checkout-section">
            <div className="checkout-section-title">
              <span className="checkout-step">03</span>
              <div>
                <h2>Order Summary ({cafe?.name || "Campus Cafe"})</h2>
                <p>{lines.length} {lines.length === 1 ? "item" : "items"} ready to be prepared.</p>
              </div>
            </div>
            <div className="checkout-items">
              {lines.map(({ item, quantity }) => (
                <div className="checkout-item" key={item.id}>
                  <span>
                    {quantity} × {item.name}
                  </span>
                  <strong>{formatINR(item.price_paise * quantity)}</strong>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="summary-card checkout-summary">
          <p className="eyebrow">TOTAL DUE</p>
          <h2>Order total</h2>
          <div className="summary-row">
            <span>Items subtotal</span>
            <strong>{formatINR(subtotal)}</strong>
          </div>
          <div className="summary-row">
            <span>Est. preparation</span>
            <span className="muted-value">
              <Clock3 size={14} /> ~{maxPrepMinutes} min
            </span>
          </div>
          {selectedDest && selectedDest.travel_minutes > 0 && (
            <div className="summary-row">
              <span>Delivery to {selectedDest.name}</span>
              <span className="muted-value">
                <MapPin size={14} /> ~{selectedDest.travel_minutes} min
              </span>
            </div>
          )}
          <div className="summary-divider" />
          <div className="summary-row summary-total">
            <span>Total amount</span>
            <strong>{formatINR(subtotal)}</strong>
          </div>
          <p className="summary-footnote" style={{ fontSize: 9, color: "var(--muted)" }}>
            Final total is calculated by the server from authoritative menu prices.
          </p>
          {message && <p className="inline-error" role="alert">{message}</p>}
          <button type="submit" className="button button-primary button-full" disabled={submitting}>
            {submitting ? "Placing order…" : "Confirm and place order"} <span>→</span>
          </button>
          <p className="summary-footnote">
            Linked to student account: {user.email}
          </p>
        </aside>
      </form>
    </div>
  );
}
