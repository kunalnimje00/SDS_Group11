"use client";

import { load } from "@cashfreepayments/cashfree-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Check, ChevronDown, Clock3, MapPin, ShoppingBag } from "lucide-react";
import { useKantin } from "@/app/kantin-context";
import { destinations } from "@/lib/demo-data";
import { formatINR } from "@/lib/format";
import { EmptyState, PageHeading } from "./ui";

export function CheckoutPage () {
  const router = useRouter();
  const { cart, hydrated, placeDemoOrder, cafes, menuItems, user } = useKantin();
  const [destinationId, setDestinationId] = useState(destinations[0]?.id || "");
  const [message, setMessage] = useState("");
  const [paying, setPaying] = useState(false);

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


  async function placeOrder (event) {
    event.preventDefault();

    if (!destinationId) {
      setMessage("Please choose a campus pickup location.");
      return;
    }

    if (paying) return;

    setPaying(true);
    setMessage("");

    try {
      // Send cart item IDs and quantities to the backend.
      const response = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lines.map(({ item, quantity }) => ({
            id: item.id,
            quantity,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not create payment.");
      }

      // Remember the pickup point across Cashfree's redirect.
      sessionStorage.setItem("kantin-pickup", destinationId);

      // Open Cashfree's sandbox checkout.
      const cashfree = await load({ mode: "sandbox" });

      await cashfree.checkout({
        paymentSessionId: data.paymentSessionId,
        redirectTarget: "_self",
      });
    } catch (error) {
      setMessage(error.message || "Could not start payment.");
      setPaying(false);
    }
  }


  const maxPrepMinutes = Math.max(...lines.map(({ item }) => item.prep_minutes || 10));

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

      <form onSubmit={placeOrder} className="checkout-layout">
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
                value={destinationId}
                onChange={(event) => {
                  setDestinationId(event.target.value);
                  setMessage("");
                }}
              >
                <option value="">Select a campus location</option>
                {destinations
                  .filter((entry) => entry.is_active)
                  .map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.name} · {entry.campus} · ~{entry.travel_minutes} min transit
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
          <div className="summary-divider" />
          <div className="summary-row summary-total">
            <span>Total amount</span>
            <strong>{formatINR(subtotal)}</strong>
          </div>
          {message && <p className="inline-error" role="alert">{message}</p>}
          <button
            type="submit"
            disabled={paying}
            className="button button-primary button-full"
          >
            {paying ? "Opening payment..." : "Pay with Cashfree"}
            {!paying && <span> →</span>}
          </button>
          <p className="summary-footnote">
            {user
              ? `Linked to student account: ${user.email}`
              : "Placed as guest. Sign in to sync your order history."}
          </p>
        </aside>
      </form>
    </div>
  );
}
