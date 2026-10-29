import { Cashfree } from "cashfree-pg";
import { menuItems as demoMenuItems } from "@/lib/demo-data";
import { createClient } from "@supabase/supabase-js";

function getCashfreeClient() {
  return new Cashfree(
    process.env.CASHFREE_ENV === "SANDBOX"
      ? Cashfree.SANDBOX
      : Cashfree.PRODUCTION,
    process.env.CASHFREE_CLIENT_ID,
    process.env.CASHFREE_CLIENT_SECRET
  );
}

export async function POST(request) {
  try {
    // Ensure Cashfree credentials are configured.
    if (!process.env.CASHFREE_CLIENT_ID || !process.env.CASHFREE_CLIENT_SECRET) {
      return Response.json(
        { error: "Cashfree credentials are not configured." },
        { status: 500 }
      );
    }

    // Read the cart submitted by the frontend.
    const { items, customerEmail, customerPhone } = await request.json();

    if (!Array.isArray(items) || items.length === 0) {
      return Response.json(
        { error: "Your cart is empty." },
        { status: 400 }
      );
    }

    // Try fetching authoritative menu items from Supabase first
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    let dbItems = [];

    if (supabaseUrl && supabaseAnonKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        const itemIds = items.map((entry) => entry.id).filter(Boolean);
        if (itemIds.length > 0) {
          const { data, error } = await supabase
            .from("menu_items")
            .select("*")
            .in("id", itemIds);
          if (!error && Array.isArray(data)) {
            dbItems = data;
          }
        }
      } catch (err) {
        console.warn("Could not query Supabase menu items for payment verification:", err);
      }
    }

    // Calculate the total using server-side menu data.
    let totalPaise = 0;

    for (const entry of items) {
      const item =
        dbItems.find((menuItem) => menuItem.id === entry.id) ||
        demoMenuItems.find((menuItem) => menuItem.id === entry.id);

      if (
        !item ||
        item.is_available === false ||
        !Number.isSafeInteger(entry.quantity) ||
        entry.quantity < 1 ||
        entry.quantity > 50
      ) {
        return Response.json(
          { error: `Item "${item?.name || entry.id}" is unavailable or has invalid quantity.` },
          { status: 400 }
        );
      }

      if (!Number.isSafeInteger(item.price_paise) || item.price_paise <= 0) {
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
    const orderId = `kantin_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");

    // Create the order through Cashfree's server-side SDK.
    const cashfree = getCashfreeClient();
    const response = await cashfree.PGCreateOrder({
      order_id: orderId,
      order_amount: Number((totalPaise / 100).toFixed(2)),
      order_currency: "INR",

      customer_details: {
        customer_id: `student_${crypto.randomUUID().slice(0, 12)}`,
        customer_email: customerEmail || "student@coeptech.ac.in",
        customer_phone: customerPhone || "9999999999",
      },

      order_meta: {
        return_url: `${appUrl}/payment/return?order_id={order_id}`,
      },

      order_note: "Kantin cafeteria checkout",
    });

    // Return the payment session to the frontend.
    return Response.json({
      orderId: response.data.order_id,
      paymentSessionId: response.data.payment_session_id,
      amount: response.data.order_amount,
    });
  } catch (error) {
    console.error("Cashfree order creation error:", {
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
