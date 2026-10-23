import Link from "next/link";
import { ArrowUpRight, ChevronRight, Clock3, MapPin } from "lucide-react";
import { ORDER_STATUSES } from "@/lib/demo-data";
import { formatDateTime, formatINR, labelStatus } from "@/lib/format";
import { StatusPill } from "./ui";

const PROGRESS_STATES = ["pending", "accepted", "preparing", "ready", "out_for_delivery", "delivered"];

export function OrderCard({ order, cafe, destination }) {
  const summary = (order.items || []).map((item) => `${item.quantity} × ${item.item_name_snapshot}`).join(" · ");

  return (
    <Link href={`/orders/${order.id}`} className="order-card">
      <div className="order-card-top">
        <div>
          <p className="order-number">{order.order_number}</p>
          <p className="order-cafe">{cafe?.name || "Campus Canteen"}</p>
        </div>
        <div className="order-card-status">
          <StatusPill status={order.status} />
          <ChevronRight size={17} aria-hidden="true" />
        </div>
      </div>
      <p className="order-summary">{summary || "Order items not available."}</p>
      <div className="order-card-bottom">
        <span>
          <Clock3 size={14} />
          {formatDateTime(order.created_at)}
        </span>
        <span>
          <MapPin size={14} />
          {destination?.name || "Campus Counter"}
        </span>
        <strong>{formatINR(order.total_paise)}</strong>
      </div>
      <span className="sr-only">
        View {order.order_number} details. Status {labelStatus(order.status)}.
      </span>
    </Link>
  );
}

export function OrderStatusStepper({ status }) {
  const isTerminal = status === "rejected" || status === "cancelled";
  if (!ORDER_STATUSES.includes(status)) {
    return <p className="inline-error">Order status is not available.</p>;
  }

  if (isTerminal) {
    return (
      <div className={`terminal-order-state terminal-${status}`} role="status">
        <span className="terminal-state-dot" />
        <div>
          <strong>{labelStatus(status)}</strong>
          <p>{status === "rejected" ? "This order was rejected by the kitchen." : "This order was cancelled."}</p>
        </div>
      </div>
    );
  }

  const current = PROGRESS_STATES.indexOf(status);

  return (
    <ol className="order-stepper" aria-label={`Order progress: ${labelStatus(status)}`}>
      {PROGRESS_STATES.map((step, index) => {
        const stateClass =
          index < current ? "step-complete" : index === current ? "step-current" : "step-upcoming";
        return (
          <li key={step} className={`order-step ${stateClass}`} aria-current={index === current ? "step" : undefined}>
            <span className="step-indicator">
              {index < current ? <span className="step-check">✓</span> : <span className="step-dot" />}
            </span>
            <span className="step-label">{labelStatus(step)}</span>
            {index < PROGRESS_STATES.length - 1 && <span className="step-connector" aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );
}

export function OrderTimelineNote({ status }) {
  return (
    <div className="order-tracking-note">
      <span className="tracking-note-mark">
        <ArrowUpRight size={15} />
      </span>
      <span>
        Current stage: <strong>{labelStatus(status)}</strong>. Updates reflect cafeteria kitchen live status.
      </span>
    </div>
  );
}
