"use client";

import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, ClipboardList, UtensilsCrossed, Clock } from "lucide-react";
import { PageHeading, EmptyState } from "@/components/ui";
import { useCafe } from "@/app/cafe/providers";
import { formatINR, labelStatus } from "@/lib/format";

export default function CafeAnalyticsPage() {
  const { orders } = useCafe();

  // Compute analytics from real order data
  const totalOrders = orders.length;
  const completedOrders = orders.filter((o) => o.status === "delivered").length;
  const cancelledOrders = orders.filter((o) => o.status === "cancelled").length;
  const rejectedOrders = orders.filter((o) => o.status === "rejected").length;
  const activeOrders = orders.filter((o) => !["delivered", "cancelled", "rejected"].includes(o.status)).length;

  // Status breakdown
  const statusCounts = {};
  orders.forEach((o) => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });
  const statusEntries = Object.entries(statusCounts).sort((a, b) => b[1] - a[1]);
  const maxStatusCount = Math.max(...Object.values(statusCounts), 1);

  // Popular items
  const itemCounts = {};
  orders.forEach((o) => {
    (o.items || []).filter((it) => it.status === "included").forEach((it) => {
      const name = it.item_name_snapshot || it.item_name || "Unknown";
      itemCounts[name] = (itemCounts[name] || 0) + it.quantity;
    });
  });
  const popularItems = Object.entries(itemCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxItemCount = Math.max(...popularItems.map(([, c]) => c), 1);

  // Revenue (informational, not claiming payments collected)
  const totalOrderValue = orders.filter((o) => o.status === "delivered").reduce((sum, o) => sum + (o.total_paise || 0), 0);

  return (
    <div className="page-stack">
      <PageHeading eyebrow="PERFORMANCE & INSIGHTS" title="Analytics" description="Operational metrics from today's order data. Payments are outside MVP scope." />

      {/* Summary stats */}
      <div className="cafe-stats-grid">
        <div className="cafe-stat-card cafe-stat-card-accent">
          <div className="cafe-stat-icon"><ClipboardList size={18} /></div>
          <p className="stat-value">{totalOrders}</p>
          <p className="stat-label">Total orders</p>
        </div>
        <div className="cafe-stat-card">
          <div className="cafe-stat-icon"><TrendingUp size={18} /></div>
          <p className="stat-value">{completedOrders}</p>
          <p className="stat-label">Completed</p>
        </div>
        <div className="cafe-stat-card">
          <div className="cafe-stat-icon" style={{ color: "var(--amber)", borderColor: "rgba(228,186,119,.18)", background: "rgba(228,186,119,.06)" }}>
            <Clock size={18} />
          </div>
          <p className="stat-value">{activeOrders}</p>
          <p className="stat-label">Active / in progress</p>
        </div>
        <div className="cafe-stat-card">
          <div className="cafe-stat-icon"><UtensilsCrossed size={18} /></div>
          <p className="stat-value">{formatINR(totalOrderValue)}</p>
          <p className="stat-label">Delivered order value</p>
        </div>
      </div>

      {totalOrders === 0 ? (
        <EmptyState icon={BarChart3} title="No data yet" description="Analytics will populate once orders come in." />
      ) : (
        <div className="analytics-grid">
          {/* Orders by status */}
          <div className="analytics-card">
            <h3>Orders by Status</h3>
            <div className="analytics-bar-chart">
              {statusEntries.map(([status, count]) => (
                <div key={status} className="analytics-bar-row">
                  <span className="analytics-bar-label">{labelStatus(status)}</span>
                  <div className="analytics-bar-track">
                    <div className="analytics-bar-fill" style={{ width: `${(count / maxStatusCount) * 100}%` }} />
                  </div>
                  <span className="analytics-bar-value">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Popular items */}
          <div className="analytics-card">
            <h3>Popular Items</h3>
            {popularItems.length === 0 ? (
              <p style={{ color: "var(--muted)", fontSize: 11 }}>No item data available.</p>
            ) : (
              <div className="analytics-bar-chart">
                {popularItems.map(([name, count]) => (
                  <div key={name} className="analytics-bar-row">
                    <span className="analytics-bar-label">{name}</span>
                    <div className="analytics-bar-track">
                      <div className="analytics-bar-fill" style={{ width: `${(count / maxItemCount) * 100}%` }} />
                    </div>
                    <span className="analytics-bar-value">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Completion rate */}
          <div className="analytics-card">
            <h3>Fulfillment Summary</h3>
            <div style={{ display: "grid", gap: 10, paddingTop: 4 }}>
              <div className="overview-list-item">
                <span>Completion rate</span>
                <strong style={{ color: "var(--mint-bright)" }}>{totalOrders > 0 ? `${Math.round((completedOrders / totalOrders) * 100)}%` : "—"}</strong>
              </div>
              <div className="overview-list-item">
                <span>Cancellation rate</span>
                <strong style={{ color: "var(--amber)" }}>{totalOrders > 0 ? `${Math.round((cancelledOrders / totalOrders) * 100)}%` : "—"}</strong>
              </div>
              <div className="overview-list-item">
                <span>Rejection rate</span>
                <strong style={{ color: "var(--red)" }}>{totalOrders > 0 ? `${Math.round((rejectedOrders / totalOrders) * 100)}%` : "—"}</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
