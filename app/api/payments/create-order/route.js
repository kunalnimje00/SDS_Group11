
import { Cashfree } from "cashfree-pg";
import { menuItems } from "@/lib/demo-data";

const cashfree = new Cashfree(
    process.env.CASHFREE_ENV === "SANDBOX"
        ? Cashfree.SANDBOX
        : Cashfree.PRODUCTION,
    process.env.CASHFREE_CLIENT_ID,
    process.env.CASHFREE_CLIENT_SECRET
);

export async function POST (request) {
    try {
        // Ensure Cashfree credentials are configured.
        if (
            !process.env.CASHFREE_CLIENT_ID ||
            !process.env.CASHFREE_CLIENT_SECRET
        ) {
            return Response.json(
                { error: "Cashfree credentials are not configured." },
                { status: 500 }
            );
        }

        // Read the cart submitted by the frontend.
        const { items } = await request.json();

        if (!Array.isArray(items) || items.length === 0) {
            return Response.json(
                { error: "Your cart is empty." },
                { status: 400 }
            );
        }

        // Calculate the total using server-side menu data.
        let totalPaise = 0;

        for (const entry of items) {
            const item = menuItems.find(
                (menuItem) => menuItem.id === entry.id
            );

            if (
                !item ||
                !item.is_available ||
                !Number.isSafeInteger(entry.quantity) ||
                entry.quantity < 1 ||
                entry.quantity > 20
            ) {
                return Response.json(
                    { error: "Invalid or unavailable cart item." },
                    { status: 400 }
                );
            }

            if (
                !Number.isSafeInteger(item.price_paise) ||
                item.price_paise <= 0
            ) {
                return Response.json(
                    { error: "Invalid menu item price." },
                    { status: 500 }
                );
            }

            totalPaise += item.price_paise * entry.quantity;
        }

        if (!Number.isSafeInteger(totalPaise) || totalPaise <= 0) {
            return Response.json(
                { error: "Invalid order total." },
                { status: 400 }
            );
        }

        // Generate a unique Cashfree order ID.
        const orderId =
            `kantin_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;

        // Create the order through Cashfree's server-side SDK.
        const response = await cashfree.PGCreateOrder({
            order_id: orderId,
            order_amount: Number((totalPaise / 100).toFixed(2)),
            order_currency: "INR",

            customer_details: {
                customer_id: `student_${crypto.randomUUID()}`,
                customer_phone: "9999999999",
            },

            order_meta: {
                return_url:
                    `${process.env.NEXT_PUBLIC_APP_URL}/payment/return?order_id={order_id}`,
            },

            order_note: "Kantin demo checkout",
        });

        // Return the payment session to the frontend.
        return Response.json({
            orderId: response.data.order_id,
            paymentSessionId: response.data.payment_session_id,
            amount: response.data.order_amount,
        });

    } catch (error) {
        // Print detailed diagnostic information in the server terminal.
        console.error("Cashfree error details:", {
            message: error?.message,
            status: error?.response?.status,
            data: error?.response?.data,
            errors: error?.response?.data?.errors,
        });

        return Response.json(
            {
                error:
                    error?.response?.data?.message ||
                    error?.message ||
                    "Could not create payment order.",
            },
            { status: 500 }
        );
    }
}
