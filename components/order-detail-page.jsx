"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Clock3, MapPin, ReceiptText, UtensilsCrossed, RefreshCw } from "lucide-react";
import { useKantin } from "@/app/kantin-context";
import { supabase } from "@/lib/supabase";
import { formatDateTime, formatINR } from "@/lib/format";
import { OrderStatusStepper, OrderTimelineNote } from "./order-ui";
import { EmptyState, PageHeading, StatusPill } from "./ui";

export function OrderDetailPage() {
  const params = useParams();
  const orderId = String(params.orderId || "");
  const { orders, cafes, destinations, user } = useKantin();

  // Try to find from context first
  const contextOrder = orders.find((entry) => entry.id === orderId);

  const [order, setOrder] = useState(contextOrder || null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(!contextOrder);

  // Fetch order details directly from Supabase for freshness
  const fetchOrderDetails = useCallback(async () => {
    if (!supabase || !orderId) return;
    try {
      // Fetch order
      const { data: orderData, error: oErr } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .maybeSingle();

      if (oErr || !orderData) {
        setLoading(false);
        return;
      }

      // Fetch order items
      const { data: itemsData } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId);

      // Fetch order events for the timeline
      const { data: eventsData } = await supabase
        .from("order_events")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: true });

      setOrder({ ...orderData, items: itemsData || [] });
      setEvents(eventsData || []);
    } catch (err) {
      console.error("Failed to fetch order details:", err);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrderDetails();
    // Poll every 10 seconds for live status
    const interval = setInterval(fetchOrderDetails, 10000);
    return () => clearInterval(interval);
  }, [fetchOrderDetails]);

  // Sync with context order if it updates
  useEffect(() => {
    if (contextOrder && !order) {
      setOrder(contextOrder);
      setLoading(false);
    }
  }, [contextOrder, order]);

  if (loading) {
    return (
      <div className="page-stack">
        <div className="skeleton-card" style={{ height: 200 }} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="page-stack">
        <EmptyState
          icon={ReceiptText}
          title="Order not found"
          description={user ? "This order could not be found or you don't have access to it." : "Please sign in to view your orders."}
          action={
            <Link href={user ? "/orders" : "/login"} className="button button-secondary">
              {user ? "Back to my orders" : "Sign in"}
            </Link>
          }
        />
      </div>
    );
  }

  const cafe = cafes.find((entry) => entry.id === order.cafe_id);
  const destination = (destinations || []).find((entry) => entry.id === order.destination_id);

  const statusHeading =
    {
      preparing: "Being prepared in kitchen",
      ready: "Ready for pickup at counter",
      out_for_delivery: "Out for campus delivery",
      delivered: "Order fulfilled",
      rejected: "Order declined",
      cancelled: "Order cancelled",
    }[order.status] || "Order received by cafe";

  return (
    <div className="page-stack">
      <Link href="/orders" className="back-link">
        <ArrowLeft size={15} /> My orders
      </Link>
      <PageHeading
        eyebrow="ORDER DETAILS & LIVE STATUS"
        title={order.order_number}
        description={`Placed on ${formatDateTime(order.created_at)}`}
        action={
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <StatusPill status={order.status} />
            <button
              type="button"
              className="icon-button"
              title="Refresh order status"
              onClick={fetchOrderDetails}
              style={{ width: 28, height: 28 }}
            >
              <RefreshCw size={13} />
            </button>
          </div>
        }
      />

      <section className="tracking-card">
        <div className="tracking-card-top">
          <div>
            <p className="eyebrow">PREPARATION PROGRESS</p>
            <h2>{statusHeading}</h2>
          </div>
          <div className="tracking-cafe-icon">
            <UtensilsCrossed size={19} />
          </div>
        </div>
        <OrderStatusStepper status={order.status} />
        <OrderTimelineNote status={order.status} />
      </section>

      <div className="order-detail-grid">
        <section className="detail-card">
          <div className="detail-card-heading">
            <ReceiptText size={18} />
            <h2>Order items</h2>
          </div>
          <div className="order-detail-lines">
            {(order.items || []).filter((item) => item.status === "included").map((item) => (
              <div className="order-detail-line" key={item.id}>
                <div>
                  <strong>
                    {item.quantity} × {item.item_name_snapshot}
                  </strong>
                  <span>{formatINR(item.unit_price_paise)} each</span>
                </div>
                <strong>{formatINR(item.line_total_paise)}</strong>
              </div>
            ))}
            {(order.items || []).filter((item) => item.status === "removed").map((item) => (
              <div className="order-detail-line" key={item.id} style={{ opacity: 0.4, textDecoration: "line-through" }}>
                <div>
                  <strong>
                    {item.quantity} × {item.item_name_snapshot}
                  </strong>
                  <span>{formatINR(item.unit_price_paise)} each</span>
                </div>
                <strong>{formatINR(item.line_total_paise)}</strong>
              </div>
            ))}
          </div>
          <div className="summary-divider" />
          <div className="summary-row summary-total">
            <span>Total bill</span>
            <strong>{formatINR(order.total_paise)}</strong>
          </div>
        </section>

        <aside className="detail-card order-info-card">
          <div className="detail-card-heading">
            <MapPin size={18} />
            <h2>Location & Timing</h2>
          </div>
          <div className="order-info-row">
            <span>Canteen</span>
            <strong>{cafe?.name || "Campus Cafe"}</strong>
          </div>
          <div className="order-info-row">
            <span>Pickup spot</span>
            <strong>{destination?.name || "Main Counter"}</strong>
          </div>
          <div className="order-info-row">
            <span>Placed at</span>
            <strong>{formatDateTime(order.created_at)}</strong>
          </div>
          {order.estimated_ready_at && (
            <div className="order-info-row">
              <span>Ready estimate</span>
              <strong>
                <Clock3 size={14} /> {formatDateTime(order.estimated_ready_at)}
              </strong>
            </div>
          )}
          {order.estimated_delivery_at && (
            <div className="order-info-row">
              <span>Delivery estimate</span>
              <strong>
                <Clock3 size={14} /> {formatDateTime(order.estimated_delivery_at)}
              </strong>
            </div>
          )}
          <div className="sample-events">
            <p className="tiny-label">STATUS TIMELINE</p>
            {events.length ? (
              events.map((event) => (
                <div className="sample-event" key={event.id}>
                  <span className="sample-event-dot" />
                  <span>{event.to_status?.replaceAll("_", " ")}</span>
                  <time>{formatDateTime(event.created_at)}</time>
                </div>
              ))
            ) : (
              <p className="field-help">Order was created recently.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
