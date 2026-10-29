"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { load } from "@cashfreepayments/cashfree-js";
import {
  ArrowLeft,
  ChevronDown,
  Clock3,
  MapPin,
  ShoppingBag,
  AlertTriangle,
  CreditCard,
  Building2,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Wallet,
} from "lucide-react";
import { useKantin } from "@/app/kantin-context";
import { destinations as demoDestinations } from "@/lib/demo-data";
import { formatINR } from "@/lib/format";
import { EmptyState, PageHeading } from "./ui";

export function CheckoutPage() {
  const router = useRouter();
  const { cart, hydrated, placeOrder, cafes, menuItems, destinations, user } = useKantin();
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Selected payment method: "online" | "counter"
  const [paymentMethod, setPaymentMethod] = useState("online");

  // Fallback to demoDestinations if database destinations are empty or unconfigured
  const availableDestinations = useMemo(() => {
    if (destinations && destinations.length > 0) {
      return destinations;
    }
    return demoDestinations;
  }, [destinations]);

  const activeDestinations = useMemo(
    () => availableDestinations.filter((entry) => entry.is_active !== false),
    [availableDestinations]
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
          description="You need to sign in to your student account before placing an order."
          action={
            <Link href="/login?next=/checkout" className="button button-primary">
              Sign in to continue
            </Link>
          }
        />
      </div>
    );
  }

  const isOnline = paymentMethod === "online";

  async function handlePlaceOrder(event) {
    event.preventDefault();
    if (submitting) return;

    if (!effectiveDestinationId) {
      setMessage("Please select a pickup or delivery location.");
      return;
    }

    setMessage("");
    setSubmitting(true);

    if (isOnline) {
      try {
        // Send cart item IDs and quantities to Cashfree order creation API
        const response = await fetch("/api/payments/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: lines.map(({ item, quantity }) => ({
              id: item.id,
              quantity,
            })),
            customerEmail: user?.email,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Could not initialize online payment session.");
        }

        // Store pickup location and cart backup in sessionStorage across Cashfree redirect
        sessionStorage.setItem("kantin-pickup", effectiveDestinationId);
        sessionStorage.setItem("kantin-cart-backup", JSON.stringify(cart));
        sessionStorage.setItem("kantin-payment-method", "online");

        // Initialize Cashfree web SDK
        const cashfreeEnv = process.env.NEXT_PUBLIC_CASHFREE_ENV === "PRODUCTION" ? "production" : "sandbox";
        const cashfree = await load({ mode: cashfreeEnv });

        // Launch Cashfree checkout
        await cashfree.checkout({
          paymentSessionId: data.paymentSessionId,
          redirectTarget: "_self",
        });
      } catch (err) {
        console.error("Cashfree checkout error:", err);
        setMessage(err.message || "Could not launch online payment. Please try again.");
        setSubmitting(false);
      }
    } else {
      // Offline / Counter Payment Flow
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
        setSubmitting(false);
      }
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
        eyebrow="ORDER REVIEW & PAYMENT"
        title="Checkout"
        description="Verify your selected pickup spot, choose a payment method, and complete your order."
      />

      <form onSubmit={handlePlaceOrder} className="checkout-layout">
        <div className="checkout-main">
          {/* Step 01: Campus Pickup Location Dropdown */}
          <section className="checkout-section">
            <div className="checkout-section-title">
              <span className="checkout-step">01</span>
              <div>
                <h2>Campus Pickup Point</h2>
                <p>Choose where you&apos;d like your order delivered or picked up.</p>
              </div>
            </div>
            <label className="field-label" htmlFor="destination">
              Pickup / Delivery location (Dropdown)
            </label>
            <div className="select-wrap">
              <MapPin size={16} style={{ color: "var(--mint, #91d4a8)", flexShrink: 0 }} />
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
              <ChevronDown size={15} style={{ flexShrink: 0 }} />
            </div>
            {selectedDest && (
              <p style={{ marginTop: 8, fontSize: 11, color: "var(--muted, #9ba99f)", display: "flex", alignItems: "center", gap: 6 }}>
                <Clock3 size={13} style={{ color: "var(--mint, #91d4a8)" }} />
                <span>
                  Delivery to <strong>{selectedDest.name}</strong> ({selectedDest.campus || "Campus"}): estimated ~{selectedDest.travel_minutes || 0} min transit
                </span>
              </p>
            )}
          </section>

          {/* Step 02: Payment Method Dropdown & Option Selection */}
          <section className="checkout-section">
            <div className="checkout-section-title">
              <span className="checkout-step">02</span>
              <div>
                <h2>Payment Method</h2>
                <p>Select whether to pay online to the cafe or pay offline at the counter.</p>
              </div>
            </div>

            <label className="field-label" htmlFor="payment-method">
              Choose payment option (Dropdown or click option below)
            </label>
            <div className="select-wrap" style={{ marginBottom: 14 }}>
              {isOnline ? (
                <CreditCard size={16} style={{ color: "var(--mint, #91d4a8)", flexShrink: 0 }} />
              ) : (
                <Building2 size={16} style={{ color: "var(--muted, #9ba99f)", flexShrink: 0 }} />
              )}
              <select
                id="payment-method"
                value={paymentMethod}
                onChange={(event) => {
                  setPaymentMethod(event.target.value);
                  setMessage("");
                }}
              >
                <option value="online">Pay Online to Cafe (Cashfree Gateway · UPI, Cards, Net Banking)</option>
                <option value="counter">Pay at Counter (Campus POS · Cash / Canteen Card)</option>
              </select>
              <ChevronDown size={15} style={{ flexShrink: 0 }} />
            </div>

            {/* Clear Clickable Option Selection Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, marginBottom: 14 }}>
              {/* Option 1: Pay Online to Cafe */}
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod("online");
                  setMessage("");
                }}
                style={{
                  textAlign: "left",
                  padding: "14px 16px",
                  borderRadius: 12,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  border: isOnline
                    ? "2px solid var(--mint, #91d4a8)"
                    : "1px solid var(--border, rgba(255,255,255,0.08))",
                  background: isOnline
                    ? "rgba(145, 212, 168, 0.08)"
                    : "rgba(20, 36, 28, 0.5)",
                  boxShadow: isOnline ? "0 0 16px rgba(145, 212, 168, 0.12)" : "none",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        border: isOnline ? "5px solid var(--mint, #91d4a8)" : "2px solid rgba(255,255,255,0.3)",
                        background: "#0d1711",
                        transition: "all 0.2s ease",
                      }}
                    />
                    <strong style={{ fontSize: 13, color: isOnline ? "var(--text, #f3f6f2)" : "var(--muted, #9ba99f)" }}>
                      Pay Online to Cafe
                    </strong>
                  </div>
                  <span
                    className="demo-badge"
                    style={{
                      background: isOnline ? "rgba(145,212,168,0.2)" : "rgba(255,255,255,0.05)",
                      color: isOnline ? "var(--mint, #91d4a8)" : "var(--muted, #9ba99f)",
                      fontSize: 9,
                      fontWeight: 600,
                    }}
                  >
                    INSTANT
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 11, color: "var(--muted, #9ba99f)", lineHeight: 1.4, paddingLeft: 26 }}>
                  Cashfree Gateway · UPI, Cards & Net Banking. Instant order confirmation.
                </p>
              </button>

              {/* Option 2: Pay at Counter */}
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod("counter");
                  setMessage("");
                }}
                style={{
                  textAlign: "left",
                  padding: "14px 16px",
                  borderRadius: 12,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  border: !isOnline
                    ? "2px solid var(--mint, #91d4a8)"
                    : "1px solid var(--border, rgba(255,255,255,0.08))",
                  background: !isOnline
                    ? "rgba(145, 212, 168, 0.08)"
                    : "rgba(20, 36, 28, 0.5)",
                  boxShadow: !isOnline ? "0 0 16px rgba(145, 212, 168, 0.12)" : "none",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        border: !isOnline ? "5px solid var(--mint, #91d4a8)" : "2px solid rgba(255,255,255,0.3)",
                        background: "#0d1711",
                        transition: "all 0.2s ease",
                      }}
                    />
                    <strong style={{ fontSize: 13, color: !isOnline ? "var(--text, #f3f6f2)" : "var(--muted, #9ba99f)" }}>
                      Pay at Counter
                    </strong>
                  </div>
                  <span
                    className="demo-badge"
                    style={{
                      background: !isOnline ? "rgba(145,212,168,0.2)" : "rgba(255,255,255,0.05)",
                      color: !isOnline ? "var(--mint, #91d4a8)" : "var(--muted, #9ba99f)",
                      fontSize: 9,
                      fontWeight: 600,
                    }}
                  >
                    CAMPUS POS
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 11, color: "var(--muted, #9ba99f)", lineHeight: 1.4, paddingLeft: 26 }}>
                  Pay cash or tap campus canteen card at the counter upon order pickup.
                </p>
              </button>
            </div>

            {/* Selected Option Visual Details Box */}
            {isOnline ? (
              <div
                style={{
                  padding: 16,
                  borderRadius: 12,
                  border: "1px solid rgba(145, 212, 168, 0.25)",
                  background: "rgba(145, 212, 168, 0.05)",
                  display: "grid",
                  gap: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(145, 212, 168, 0.15)", display: "grid", placeItems: "center", color: "var(--mint, #91d4a8)" }}>
                      <Zap size={18} />
                    </div>
                    <div>
                      <strong style={{ fontSize: 13, color: "var(--text, #f3f6f2)", display: "block" }}>
                        Pay Online to Cafe via Cashfree
                      </strong>
                      <span style={{ fontSize: 11, color: "var(--muted, #9ba99f)" }}>
                        Instant digital settlement · zero counter wait time
                      </span>
                    </div>
                  </div>
                  <span className="demo-badge" style={{ background: "rgba(145,212,168,0.18)", color: "var(--mint,#91d4a8)", fontSize: 10 }}>
                    ONLINE PAYMENT
                  </span>
                </div>

                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", paddingTop: 4 }}>
                  {["Google Pay", "PhonePe", "Paytm", "BHIM UPI", "Visa", "MasterCard", "RuPay", "Net Banking"].map((badge) => (
                    <span
                      key={badge}
                      style={{
                        fontSize: 10,
                        padding: "3px 8px",
                        borderRadius: 5,
                        background: "rgba(255,255,255,0.06)",
                        color: "#b6c5bb",
                        border: "1px solid rgba(255,255,255,0.08)",
                        fontWeight: 500,
                      }}
                    >
                      {badge}
                    </span>
                  ))}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--muted, #9ba99f)", paddingTop: 2 }}>
                  <ShieldCheck size={14} style={{ color: "var(--mint, #91d4a8)" }} />
                  <span>256-Bit SSL Encrypted checkout. Processed securely by Cashfree Payments.</span>
                </div>
              </div>
            ) : (
              <div
                style={{
                  padding: 16,
                  borderRadius: 12,
                  border: "1px solid var(--border, rgba(255,255,255,0.08))",
                  background: "var(--card, #14241c)",
                  display: "grid",
                  gap: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255, 255, 255, 0.05)", display: "grid", placeItems: "center", color: "var(--muted, #9ba99f)" }}>
                      <Building2 size={18} />
                    </div>
                    <div>
                      <strong style={{ fontSize: 13, color: "var(--text, #f3f6f2)", display: "block" }}>
                        Pay at Canteen Counter
                      </strong>
                      <span style={{ fontSize: 11, color: "var(--muted, #9ba99f)" }}>
                        Show your order number at the counter to settle
                      </span>
                    </div>
                  </div>
                  <span className="demo-badge" style={{ background: "rgba(255,255,255,0.08)", color: "var(--muted,#9ba99f)", fontSize: 10 }}>
                    CAMPUS POS
                  </span>
                </div>

                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", paddingTop: 4 }}>
                  {["Cash at Counter", "Canteen Card", "Counter QR"].map((badge) => (
                    <span
                      key={badge}
                      style={{
                        fontSize: 10,
                        padding: "3px 8px",
                        borderRadius: 5,
                        background: "rgba(255,255,255,0.04)",
                        color: "#9ba99f",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Step 03: Order Summary */}
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

        {/* Sidebar Summary */}
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
          <div className="summary-row">
            <span>Payment Method</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: isOnline ? "var(--mint, #91d4a8)" : "var(--text, #f3f6f2)" }}>
              {isOnline ? "Pay Online (Cashfree)" : "Pay at Counter"}
            </span>
          </div>
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
            {submitting ? (
              isOnline ? "Opening Cashfree…" : "Placing order…"
            ) : isOnline ? (
              `Pay Online via Cashfree (${formatINR(subtotal)})`
            ) : (
              `Confirm Order · Pay at Counter (${formatINR(subtotal)})`
            )} <span>→</span>
          </button>
          <p className="summary-footnote">
            Linked to student account: {user.email}
          </p>
        </aside>
      </form>
    </div>
  );
}
