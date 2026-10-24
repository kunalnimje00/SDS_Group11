"use client";

import { useState, useEffect, useCallback } from "react";
import { LayoutDashboard, ClipboardList, UtensilsCrossed, Clock, AlertTriangle, CheckCircle, Package, TrendingUp } from "lucide-react";
import { PageHeading, StatusPill, EmptyState } from "@/components/ui";
import { useCafe } from "@/app/cafe/providers";
import { supabase } from "@/lib/supabase";
import { formatINR, formatDateTime } from "@/lib/format";

export default function CafeOverviewPage() {
  const { orders, ordersLoading, refreshOrders, cafeName } = useCafe();
  const [hours, setHours] = useState(null);
  const [availability, setAvailability] = useState(null);

  useEffect(() => {
    supabase.rpc("cafe_get_hours").then(({ data }) => { if (data) setHours(data); });
    const today = new Date().toISOString().slice(0, 10);
    supabase.rpc("cafe_get_menu_availability", { p_date: today }).then(({ data }) => { if (data) setAvailability(data); });
  }, []);

  const statusCounts = {};
  (orders || []).forEach((o) => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });
  const todayOrders = orders || [];
  const pending = statusCounts.pending || 0;
  const preparing = statusCounts.preparing || 0;
  const accepted = statusCounts.accepted || 0;
  const ready = statusCounts.ready || 0;
  const delivered = statusCounts.delivered || 0;

  const lowStockItems = Array.isArray(availability)
    ? availability.filter((a) => a.remaining_stock !== null && a.remaining_stock !== undefined && a.remaining_stock <= 5 && a.remaining_stock > 0)
    : [];
  const outOfStockItems = Array.isArray(availability)
    ? availability.filter((a) => a.remaining_stock !== null && a.remaining_stock !== undefined && a.remaining_stock <= 0)
    : [];

  const recentOrders = todayOrders.slice(0, 5);

  return (
    <div className="page-stack">
      <PageHeading eyebrow="CAFETERIA OPS" title="Overview" description={`Dashboard for ${cafeName} — live operational snapshot.`} />

      {/* Stats Grid */}
      <div className="cafe-stats-grid">
        <div className="cafe-stat-card cafe-stat-card-accent">
          <div className="cafe-stat-icon"><ClipboardList size={18} /></div>
          <p className="stat-value">{todayOrders.length}</p>
          <p className="stat-label">Total orders today</p>
        </div>
        <div className="cafe-stat-card" style={pending > 0 ? { borderColor: "rgba(228,186,119,.2)" } : undefined}>
          <div className="cafe-stat-icon" style={pending > 0 ? { color: "var(--amber)", borderColor: "rgba(228,186,119,.18)", background: "rgba(228,186,119,.06)" } : undefined}>
            <AlertTriangle size={18} />
          </div>
          <p className="stat-value">{pending}</p>
          <p className="stat-label">Pending orders</p>
        </div>
        <div className="cafe-stat-card">
          <div className="cafe-stat-icon"><UtensilsCrossed size={18} /></div>
          <p className="stat-value">{accepted + preparing}</p>
          <p className="stat-label">Being prepared</p>
        </div>
        <div className="cafe-stat-card">
          <div className="cafe-stat-icon" style={{ color: "#c3df9f", borderColor: "rgba(192,214,139,.2)", background: "rgba(192,214,139,.06)" }}>
            <CheckCircle size={18} />
          </div>
          <p className="stat-value">{ready}</p>
          <p className="stat-label">Ready for pickup</p>
        </div>
        <div className="cafe-stat-card">
          <div className="cafe-stat-icon"><TrendingUp size={18} /></div>
          <p className="stat-value">{delivered}</p>
          <p className="stat-label">Completed today</p>
        </div>
        {(lowStockItems.length > 0 || outOfStockItems.length > 0) && (
          <div className="cafe-stat-card cafe-stat-card-warn">
            <div className="cafe-stat-icon"><Package size={18} /></div>
            <p className="stat-value">{lowStockItems.length + outOfStockItems.length}</p>
            <p className="stat-label">Low / out of stock items</p>
          </div>
        )}
      </div>

      {/* Main content grid */}
      <div className="overview-grid">
        {/* Recent Orders */}
        <div className="overview-section">
          <h3><ClipboardList size={16} /> Recent Orders</h3>
          {ordersLoading ? (
            <div style={{ display: "grid", gap: 8 }}>{[1, 2, 3].map((i) => <div key={i} className="skeleton-row" />)}</div>
          ) : recentOrders.length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: 11 }}>No orders yet today.</p>
          ) : (
            <div className="overview-list">
              {recentOrders.map((order) => (
                <div key={order.id || order.order_number} className="overview-list-item">
                  <div>
                    <strong style={{ fontSize: 10, color: "var(--muted)", letterSpacing: ".06em" }}>{order.order_number}</strong>
                    <span style={{ marginLeft: 8, color: "var(--text-soft)", fontSize: 11 }}>{order.student_display_name || "Customer"}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <StatusPill status={order.status} />
                    <strong style={{ fontSize: 11 }}>{formatINR(order.total_paise)}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div style={{ display: "grid", gap: 14 }}>
          {/* Cafe status */}
          <div className="overview-section">
            <h3><Clock size={16} /> Cafe Status</h3>
            <div className="cafe-open-badge cafe-open-badge-open" style={{ marginBottom: 10 }}>
              <span className="status-dot" /> Accepting Orders
            </div>
            {hours && Array.isArray(hours) && hours.length > 0 && (
              <div style={{ fontSize: 10, color: "var(--muted)" }}>
                {hours.slice(0, 3).map((h, i) => (
                  <div key={i} style={{ marginBottom: 3 }}>
                    {h.is_closed ? `Day ${h.day_of_week}: Closed` : `Day ${h.day_of_week}: ${h.opens_at} – ${h.closes_at}`}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Low stock alerts */}
          <div className="overview-section">
            <h3><Package size={16} /> Stock Alerts</h3>
            {lowStockItems.length === 0 && outOfStockItems.length === 0 ? (
              <p style={{ color: "var(--muted)", fontSize: 11 }}>All items well stocked.</p>
            ) : (
              <div className="overview-list">
                {outOfStockItems.map((item) => (
                  <div key={item.menu_item_id} className="overview-list-item">
                    <span style={{ color: "var(--text-soft)" }}>{item.item_name || item.menu_item_id}</span>
                    <span className="stock-badge stock-out">Out of stock</span>
                  </div>
                ))}
                {lowStockItems.map((item) => (
                  <div key={item.menu_item_id} className="overview-list-item">
                    <span style={{ color: "var(--text-soft)" }}>{item.item_name || item.menu_item_id}</span>
                    <span className="stock-badge stock-low">{item.remaining_stock} left</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
