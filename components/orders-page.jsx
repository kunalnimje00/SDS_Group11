"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ClipboardList, RefreshCw } from "lucide-react";
import { useKantin } from "@/app/kantin-context";
import { OrderCard } from "./order-ui";
import { EmptyState, PageHeading } from "./ui";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "active", label: "In progress" },
  { id: "past", label: "Past" },
];

const activeStatuses = new Set(["pending", "accepted", "preparing", "ready", "out_for_delivery"]);

export function OrdersPage() {
  const { orders, ordersLoading, cafes, destinations, refreshOrders, user } = useKantin();
  const [filter, setFilter] = useState("all");

  // Poll for order updates every 15 seconds while on this page
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      if (refreshOrders) refreshOrders();
    }, 15000);
    return () => clearInterval(interval);
  }, [user, refreshOrders]);

  const filtered = (orders || []).filter((order) =>
    filter === "all"
      ? true
      : filter === "active"
      ? activeStatuses.has(order.status)
      : !activeStatuses.has(order.status)
  );

  if (!user) {
    return (
      <div className="page-stack">
        <PageHeading eyebrow="STUDENT ORDERS" title="My orders" />
        <EmptyState
          icon={ClipboardList}
          title="Sign in to view orders"
          description="Your orders will appear here once you sign in."
          action={
            <Link href="/login" className="button button-primary">
              Sign in
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="page-stack">
      <PageHeading
        eyebrow="STUDENT ORDERS"
        title="My orders"
        description="Follow live order status, preparation progress, and your order history."
        action={
          <button
            type="button"
            className="button button-secondary button-small"
            onClick={() => refreshOrders && refreshOrders()}
            disabled={ordersLoading}
            style={{ display: "inline-flex", gap: "6px" }}
          >
            <RefreshCw size={13} className={ordersLoading ? "spinner" : ""} />
            {ordersLoading ? "Refreshing…" : "Refresh"}
          </button>
        }
      />

      <div className="order-filter-row" role="tablist" aria-label="Filter orders">
        {FILTERS.map((entry) => (
          <button
            type="button"
            role="tab"
            aria-selected={filter === entry.id}
            className={`filter-chip ${filter === entry.id ? "filter-chip-active" : ""}`}
            key={entry.id}
            onClick={() => setFilter(entry.id)}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {ordersLoading && filtered.length === 0 ? (
        <div style={{ display: "grid", gap: 10 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton-card" />
          ))}
        </div>
      ) : filtered.length ? (
        <div className="orders-list">
          {filtered.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              cafe={cafes.find((entry) => entry.id === order.cafe_id)}
              destination={(destinations || []).find((entry) => entry.id === order.destination_id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={ClipboardList}
          title="No orders found"
          description="You don't have any orders in this view yet."
          action={
            <Link href="/cafes" className="button button-primary">
              Browse cafeteria menu
            </Link>
          }
        />
      )}
    </div>
  );
}
