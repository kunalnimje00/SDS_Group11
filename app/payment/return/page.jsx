
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useKantin } from "@/app/kantin-context";

export default function PaymentReturnPage () {
    const router = useRouter();
    const { hydrated, placeDemoOrder } = useKantin();

    const [message, setMessage] = useState("Verifying your payment...");
    const [failed, setFailed] = useState(false);
    const started = useRef(false);

    useEffect(() => {
        if (!hydrated || started.current) return;
        started.current = true;

        async function verifyPayment () {
            try {
                const orderId = new URLSearchParams(
                    window.location.search
                ).get("order_id");

                if (!orderId) {
                    throw new Error("No payment order was provided.");
                }

                const response = await fetch(
                    `/api/payments/verify-order?order_id=${encodeURIComponent(orderId)}`
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || "Verification failed.");
                }

                if (!data.paid) {
                    setFailed(true);
                    setMessage(
                        `Payment is not confirmed. Current status: ${data.status}.`
                    );
                    return;
                }

                const destinationId =
                    sessionStorage.getItem("kantin-pickup");

                if (!destinationId) {
                    throw new Error(
                        "Payment was verified, but the pickup location is missing. Contact support before retrying."
                    );
                }

                // Demo only: create the local order after verification.
                const order = await placeDemoOrder(destinationId);

                if (!order) {
                    throw new Error(
                        "Payment succeeded, but the demo order could not be created. Do not pay again; contact support."
                    );
                }

                sessionStorage.removeItem("kantin-pickup");
                router.replace(`/orders/${order.id}`);
            } catch (error) {
                setFailed(true);
                setMessage(error.message || "Could not verify payment.");
            }
        }

        verifyPayment();
    }, [hydrated, placeDemoOrder, router]);

    return (
        <main className="page-stack">
            <h1>{failed ? "Payment needs attention" : "Payment status"}</h1>
            <p role="status">{message}</p>

            {failed && (
                <Link href="/cart" className="button button-primary">
                    Return to cart
                </Link>
            )}
        </main>
    );
}
