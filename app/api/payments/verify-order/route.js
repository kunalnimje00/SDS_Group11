
import { Cashfree } from "cashfree-pg";

const cashfree = new Cashfree(
    process.env.CASHFREE_ENV === "SANDBOX"
        ? Cashfree.SANDBOX
        : Cashfree.PRODUCTION,
    process.env.CASHFREE_CLIENT_ID,
    process.env.CASHFREE_CLIENT_SECRET
);

export async function GET (request) {
    try {
        if (
            !process.env.CASHFREE_CLIENT_ID ||
            !process.env.CASHFREE_CLIENT_SECRET
        ) {
            return Response.json(
                { error: "Cashfree credentials are not configured." },
                { status: 500 }
            );
        }

        const { searchParams } = new URL(request.url);
        const orderId = searchParams.get("order_id");

        if (
            !orderId ||
            !/^kantin_[A-Za-z0-9_-]{1,50}$/.test(orderId)
        ) {
            return Response.json(
                { error: "Missing or invalid order ID." },
                { status: 400 }
            );
        }

        // Fetch the order directly from Cashfree.
        const response = await cashfree.PGFetchOrder(orderId);
        const order = response.data;

        console.log("Cashfree verification result:", {
            orderId: order.order_id,
            status: order.order_status,
            amount: order.order_amount,
            currency: order.order_currency,
        });

        return Response.json({
            orderId: order.order_id,
            status: order.order_status,
            paid: order.order_status === "PAID",
        });

    } catch (error) {
        const details = {
            message: error?.message,
            status: error?.response?.status,
            data: error?.response?.data,
        };

        // Never log API secrets.
        console.error("Cashfree verification error:", details);

        return Response.json(
            {
                error:
                    error?.response?.data?.message ||
                    error?.message ||
                    "Unable to verify payment.",
            },
            { status: 502 }
        );
    }
}
