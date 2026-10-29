"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, AlertTriangle, RefreshCw, ShoppingBag } from "lucide-react";
import { useKantin } from "@/app/kantin-context";

function PaymentReturnContent() {
  const router = useRouter();
  const { cart, hydrated, placeOrder, placeDemoOrder, user, authLoading } = useKantin();
  const executeOrder = placeOrder || placeDemoOrder;

  const [message, setMessage] = useState("Verifying your payment with Cashfree...");
  const [failed, setFailed] = useState(false);
  const [success, setSuccess] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (!hydrated || authLoading || started.current) return;
    started.current = true;

    async function verifyPayment() {
      try {
        const params = new URLSearchParams(window.location.search);
        const orderId = params.get("order_id");

        if (!orderId) {
          throw new Error("No payment order identifier was provided in the return URL.");
        }

        const response = await fetch(
          `/api/payments/verify-order?order_id=${encodeURIComponent(orderId)}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Payment verification failed.");
        }

        if (!data.paid) {
          setFailed(true);
          setMessage(`Payment was not confirmed. Current Cashfree status: ${data.status || "PENDING"}.`);
          return;
        }

        // Retrieve the stored pickup destination from session storage
        const destinationId = sessionStorage.getItem("kantin-pickup");

        if (!destinationId) {
          throw new Error("Payment was verified successfully, but your pickup location is missing. Please contact support.");
        }

        // Ensure cart exists (check backup if state is momentarily empty)
        if (!cart?.quantities || Object.keys(cart.quantities).length === 0) {
          const backup = sessionStorage.getItem("kantin-cart-backup");
          if (backup) {
            try {
              const parsed = JSON.parse(backup);
              if (parsed?.quantities && Object.keys(parsed.quantities).length > 0) {
                window.localStorage.setItem("kantin-cart-v1", backup);
              }
            } catch (e) {
              console.warn("Could not restore cart backup:", e);
            }
          }
        }

        setMessage("Payment verified successfully! Creating your order...");
        setSuccess(true);

        const order = await executeOrder(destinationId);

        if (!order) {
          throw new Error("Payment succeeded, but the order could not be registered. Do not pay again; please contact canteen staff.");
        }

        sessionStorage.removeItem("kantin-pickup");
        sessionStorage.removeItem("kantin-cart-backup");

        const createdOrderId = order.id || order.order?.id;
        if (createdOrderId) {
          router.replace(`/orders/${createdOrderId}`);
        } else {
          router.replace("/orders");
        }
      } catch (error) {
        console.error("Payment return error:", error);
        setFailed(true);
        setMessage(error.message || "Could not verify payment.");
      }
    }

    verifyPayment();
  }, [hydrated, authLoading, executeOrder, router, cart]);

  return (
    <main className="page-stack" style={{ minHeight: "60vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", padding: "40px 20px" }}>
      <div style={{ maxWidth: 440, width: "100%", padding: 32, borderRadius: 16, background: "var(--card, #14241c)", border: "1px solid var(--border, rgba(255,255,255,0.08))" }}>
        {failed ? (
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(224, 140, 130, 0.12)", color: "var(--red, #e08c82)", display: "grid", placeItems: "center", margin: "0 auto 16px" }}>
            <AlertTriangle size={28} />
          </div>
        ) : success ? (
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(145, 212, 168, 0.12)", color: "var(--mint, #91d4a8)", display: "grid", placeItems: "center", margin: "0 auto 16px" }}>
            <CheckCircle2 size={28} />
          </div>
        ) : (
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(145, 212, 168, 0.08)", color: "var(--mint, #91d4a8)", display: "grid", placeItems: "center", margin: "0 auto 16px" }}>
            <RefreshCw size={28} className="spinner" />
          </div>
        )}

        <h1 style={{ fontSize: "1.4rem", margin: "0 0 10px", color: "var(--text, #f3f6f2)" }}>
          {failed ? "Payment Needs Attention" : success ? "Payment Confirmed!" : "Verifying Payment"}
        </h1>

        <p role="status" style={{ color: "var(--muted, #9ba99f)", fontSize: 13, lineHeight: 1.5, margin: "0 0 24px" }}>
          {message}
        </p>

        {failed && (
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <Link href="/cart" className="button button-primary" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <ShoppingBag size={16} /> Return to Cart
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

export default function PaymentReturnPage() {
  return (
    <Suspense fallback={
      <main className="page-stack" style={{ minHeight: "60vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <p style={{ color: "var(--muted)" }}>Loading payment status...</p>
      </main>
    }>
      <PaymentReturnContent />
    </Suspense>
  );
}
