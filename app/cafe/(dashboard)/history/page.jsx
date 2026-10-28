"use client";

import { useState, useEffect } from "react";
import { History, Search, Calendar, ClipboardList } from "lucide-react";
import { PageHeading, StatusPill, EmptyState } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { formatINR, formatDateTime, labelStatus } from "@/lib/format";

const STATUS_FILTERS = ["all", "delivered", "cancelled", "rejected"];

export default function CafeHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      try {
        // Fetch all terminal orders
        const statuses = statusFilter === "all" ? ["delivered", "cancelled", "rejected"] : [statusFilter];
        let allOrders = [];
        for (const status of statuses) {
          const { data } = await supabase.rpc("cafe_list_orders", { p_status: status });
          if (Array.isArray(data)) allOrders = [...allOrders, ...data];
        }
        // Sort newest first
        allOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setOrders(allOrders);
      } catch (err) { console.error("History fetch error:", err); setOrders([]); }
      finally { setLoading(false); }
    }
    fetchHistory();
  }, [statusFilter]);

  const filteredOrders = orders.filter((o) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!(o.order_number || "").toLowerCase().includes(q) && !(o.student_display_name || "").toLowerCase().includes(q)) return false;
    }
    if (dateFrom && o.created_at && new Date(o.created_at) < new Date(dateFrom)) return false;
    if (dateTo && o.created_at && new Date(o.created_at) > new Date(dateTo + "T23:59:59")) return false;
    return true;
  });

  return (
    <div className="page-stack">
      <PageHeading eyebrow="PAST RECORDS" title="Order History" description="Search and review past orders — completed, cancelled, and rejected." />

      {/* Filters */}
      <div className="toolbar-row" style={{ gap: 10, flexWrap: "wrap" }}>
        <div className="search-field" style={{ maxWidth: 300 }}>
          <Search size={16} />
          <input type="text" placeholder="Search order # or customer..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: 5 }}>
          {STATUS_FILTERS.map((s) => (
            <button key={s} className={`filter-chip ${statusFilter === s ? "filter-chip-active" : ""}`} onClick={() => setStatusFilter(s)}>
              {s === "all" ? "All" : labelStatus(s)}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Calendar size={14} style={{ color: "var(--mint)" }} />
          <input type="date" className="date-select" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <span style={{ color: "var(--muted)", fontSize: 10 }}>to</span>
          <input type="date" className="date-select" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
      </div>

      <div className="result-count">
        <span>{filteredOrders.length} order{filteredOrders.length !== 1 ? "s" : ""}</span>
      </div>

      {loading ? (
        <div style={{ display: "grid", gap: 10 }}>{[1, 2, 3].map((i) => <div key={i} className="skeleton-card" />)}</div>
      ) : filteredOrders.length === 0 ? (
        <EmptyState icon={History} title="No orders found" description="No past orders match your filters." />
      ) : (
        <div className="orders-list">
          {filteredOrders.map((order) => (
            <div key={order.id || order.order_number} className="order-card" style={{ cursor: "default" }}>
              <div className="order-card-top">
                <div>
                  <p className="order-number">{order.order_number}</p>
                  <p className="order-cafe">{order.student_display_name || "Customer"}</p>
                </div>
                <div className="order-card-status">
                  <StatusPill status={order.status} />
                </div>
              </div>
              <p className="order-summary">
                {(order.items || []).filter((i) => i.status === "included").map((i) => `${i.item_name_snapshot || i.item_name} ×${i.quantity}`).join(", ") || "No items"}
              </p>
              <div className="order-card-bottom">
                <span><ClipboardList size={12} /> {formatDateTime(order.created_at)}</span>
                <strong>{formatINR(order.total_paise)}</strong>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
