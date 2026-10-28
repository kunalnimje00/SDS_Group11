"use client";

import Link from "next/link";
import { useState } from "react";
import { ClipboardList } from "lucide-react";
import { useKantin } from "@/app/kantin-context";
import { destinations } from "@/lib/demo-data";
import { OrderCard } from "./order-ui";
import { EmptyState, PageHeading } from "./ui";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "active", label: "In progress" },
  { id: "past", label: "Past" },
];

const activeStatuses = new Set(["pending", "accepted", "preparing", "ready", "out_for_delivery"]);

export function OrdersPage() {
  const { orders, cafes } = useKantin();
  const [filter, setFilter] = useState("all");

  const filtered = orders.filter((order) =>
    filter === "all"
      ? true
      : filter === "active"
      ? activeStatuses.has(order.status)
      : !activeStatuses.has(order.status)
  );

  return (
    <div className="page-stack">
      <PageHeading
        eyebrow="STUDENT ORDERS"
        title="My orders"
        description="Follow live order status, preparation progress, and your order history."
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

      {filtered.length ? (
        <div className="orders-list">
          {filtered.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              cafe={cafes.find((entry) => entry.id === order.cafe_id)}
              destination={destinations.find((entry) => entry.id === order.destination_id)}
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
