"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Clock3, MapPin, ReceiptText, UtensilsCrossed } from "lucide-react";
import { useKantin } from "@/app/providers";
import { demoOrderEvents, destinations } from "@/lib/demo-data";
import { formatDateTime, formatINR } from "@/lib/format";
import { OrderStatusStepper, OrderTimelineNote } from "./order-ui";
import { EmptyState, PageHeading, StatusPill } from "./ui";

export function OrderDetailPage() {
  const params = useParams();
  const orderId = String(params.orderId || "");
  const { orders, cafes } = useKantin();
  const order = orders.find((entry) => entry.id === orderId);

  if (!order) {
    return (
      <div className="page-stack">
        <EmptyState
          icon={ReceiptText}
          title="Order not found"
          description="Could not locate this order in your current session."
          action={
            <Link href="/orders" className="button button-secondary">
              Back to my orders
            </Link>
          }
        />
      </div>
    );
  }

  const cafe = cafes.find((entry) => entry.id === order.cafe_id);
  const destination = destinations.find((entry) => entry.id === order.destination_id);
  const events = demoOrderEvents[order.id] || [];

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
        action={<StatusPill status={order.status} />}
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
            {(order.items || []).map((item) => (
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
