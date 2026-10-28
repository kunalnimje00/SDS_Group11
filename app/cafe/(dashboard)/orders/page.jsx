"use client";

import { useState, useCallback, useEffect } from "react";
import { ClipboardList, Check, X, ChefHat, PackageCheck, Truck, CheckCircle, AlertTriangle, Clock, Search, Trash2, Timer } from "lucide-react";
import { PageHeading, StatusPill, EmptyState } from "@/components/ui";
import { useCafe } from "@/app/cafe/providers";
import { supabase } from "@/lib/supabase";
import { formatINR, formatDateTime, labelStatus } from "@/lib/format";

const ORDER_TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "accepted", label: "Accepted" },
  { key: "preparing", label: "Preparing" },
  { key: "ready", label: "Ready" },
  { key: "out_for_delivery", label: "Out for Delivery" },
  { key: "delivered", label: "Delivered" },
  { key: "rejected", label: "Rejected" },
  { key: "cancelled", label: "Cancelled" },
];

const VALID_TRANSITIONS = {
  pending: ["accepted", "rejected", "cancelled"],
  accepted: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["out_for_delivery", "cancelled"],
  out_for_delivery: ["delivered"],
};

function getTimeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m ago`;
}

// ─── Inline ETA editor component ─────────────────────────────────────
function EtaEditor({ order, onUpdate, disabled }) {
  const [editing, setEditing] = useState(false);
  const [etaMinutes, setEtaMinutes] = useState("");
  const [saving, setSaving] = useState(false);

  // Don't show ETA editor for final statuses
  const isFinal = ["delivered", "cancelled", "rejected"].includes(order.status);
  if (isFinal) return null;

  async function handleSaveEta(e) {
    e.preventDefault();
    const mins = parseInt(etaMinutes, 10);
    if (!mins || mins < 1) return;

    setSaving(true);
    try {
      const readyAt = new Date(Date.now() + mins * 60000).toISOString();
      const { error } = await supabase.rpc("cafe_set_order_eta", {
        p_order_id: order.id,
        p_estimated_ready_at: readyAt,
      });
      if (error) throw new Error(error.message);
      if (onUpdate) onUpdate();
      setEditing(false);
      setEtaMinutes("");
    } catch (err) {
      console.error("ETA update failed:", err.message);
      alert("Failed to set ETA: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  const currentEta = order.estimated_ready_at;
  const etaTime = currentEta ? new Date(currentEta) : null;
  const minsLeft = etaTime ? Math.max(0, Math.round((etaTime - Date.now()) / 60000)) : null;

  if (editing) {
    return (
      <form onSubmit={handleSaveEta} className="eta-editor" style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 6 }}>
        <Timer size={13} />
        <span style={{ fontSize: 10, color: "var(--muted)", whiteSpace: "nowrap" }}>Ready in</span>
        <input
          type="number"
          min="1"
          max="180"
          placeholder="min"
          value={etaMinutes}
          onChange={(e) => setEtaMinutes(e.target.value)}
          style={{ width: 56, fontSize: 11, padding: "3px 6px", borderRadius: 4, border: "1px solid var(--border)" }}
          autoFocus
          disabled={saving}
        />
        <span style={{ fontSize: 10, color: "var(--muted)" }}>min</span>
        <button type="submit" className="button button-primary button-small" style={{ fontSize: 10, padding: "2px 8px" }} disabled={saving || !etaMinutes}>
          {saving ? "…" : "Set"}
        </button>
        <button type="button" className="button button-secondary button-small" style={{ fontSize: 10, padding: "2px 8px" }} onClick={() => setEditing(false)} disabled={saving}>
          ✕
        </button>
      </form>
    );
  }

  return (
    <div className="eta-display" style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 6, flexWrap: "wrap" }}>
      <Timer size={13} style={{ color: "var(--muted)" }} />
      {currentEta ? (
        <>
          <span style={{ fontSize: 10, color: minsLeft > 0 ? "var(--mint)" : "var(--muted)" }}>
            ETA: {minsLeft > 0 ? `~${minsLeft} min` : "past due"} ({formatDateTime(currentEta)})
          </span>
        </>
      ) : (
        <span style={{ fontSize: 10, color: "var(--muted)" }}>No ETA set</span>
      )}
      <button
        type="button"
        className="button button-secondary button-small"
        style={{ fontSize: 9, padding: "1px 6px" }}
        onClick={() => setEditing(true)}
        disabled={disabled}
      >
        {currentEta ? "Revise" : "Set ETA"}
      </button>
    </div>
  );
}

// ─── Main page component ──────────────────────────────────────────────
export default function CafeOrdersPage() {
  const { orders, ordersLoading, refreshOrders, updateOrderStatus } = useCafe();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [reasonInput, setReasonInput] = useState("");
  const [viewMode, setViewMode] = useState("list"); // 'list' | 'queue'

  useEffect(() => { refreshOrders(); }, [refreshOrders]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => { refreshOrders(); }, 30000);
    return () => clearInterval(interval);
  }, [refreshOrders]);

  function showToast(message, type = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  const handleStatusChange = useCallback(async (orderId, toStatus, reason) => {
    setActionLoading(orderId);
    try {
      if (updateOrderStatus) {
        await updateOrderStatus(orderId, toStatus, reason);
      } else {
        const params = { p_order_id: orderId, p_to_status: toStatus };
        if (reason) params.p_reason = reason;
        const { error } = await supabase.rpc("cafe_set_order_status", params);
        if (error) throw new Error(error.message);
      }
      showToast(`Order updated to ${labelStatus(toStatus)}`);
      await refreshOrders();
    } catch (err) {
      showToast(err.message || "Failed to update order", "error");
      await refreshOrders();
    } finally {
      setActionLoading(null);
      setConfirmDialog(null);
      setReasonInput("");
    }
  }, [refreshOrders, updateOrderStatus]);

  const handleRemoveItem = useCallback(async (orderId, itemId, reason) => {
    setActionLoading(`${orderId}-${itemId}`);
    try {
      const { error } = await supabase.rpc("cafe_remove_order_item", {
        p_order_id: orderId, p_item_id: itemId, p_reason: reason || null,
      });
      if (error) throw new Error(error.message);
      showToast("Item removed from order");
      await refreshOrders();
    } catch (err) {
      showToast(err.message || "Failed to remove item", "error");
    } finally {
      setActionLoading(null);
      setConfirmDialog(null);
      setReasonInput("");
    }
  }, [refreshOrders]);

  function openConfirm(action, orderId, toStatus, itemId) {
    setConfirmDialog({ action, orderId, toStatus, itemId });
    setReasonInput("");
  }

  const filteredOrders = (orders || []).filter((o) => {
    if (activeTab !== "all" && o.status !== activeTab) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!(o.order_number || "").toLowerCase().includes(q) &&
          !(o.student_display_name || "").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  // Queue view: organize into columns
  const pendingOrders = orders?.filter((o) => o.status === "pending") || [];
  const preparingOrders = orders?.filter((o) => o.status === "accepted" || o.status === "preparing") || [];
  const readyOrders = orders?.filter((o) => o.status === "ready" || o.status === "out_for_delivery") || [];

  function renderActions(order) {
    const transitions = VALID_TRANSITIONS[order.status] || [];
    if (transitions.length === 0) return null;

    return (
      <div className="cafe-order-actions">
        {order.status === "pending" && (
          <>
            <button className="button button-accept button-small" disabled={actionLoading === order.id} onClick={() => handleStatusChange(order.id, "accepted")}>
              <Check size={14} /> Accept & Confirm
            </button>
            <button className="button button-reject button-small" disabled={actionLoading === order.id} onClick={() => openConfirm("reject", order.id, "rejected")}>
              <X size={14} /> Reject
            </button>
          </>
        )}
        {order.status === "accepted" && (
          <button className="button button-primary button-small" style={{ flex: 1 }} disabled={actionLoading === order.id} onClick={() => handleStatusChange(order.id, "preparing")}>
            <ChefHat size={14} /> Start Preparing
          </button>
        )}
        {order.status === "preparing" && (
          <button className="button button-primary button-small" style={{ flex: 1 }} disabled={actionLoading === order.id} onClick={() => handleStatusChange(order.id, "ready")}>
            <PackageCheck size={14} /> Mark Ready
          </button>
        )}
        {order.status === "ready" && (
          <button className="button button-primary button-small" style={{ flex: 1 }} disabled={actionLoading === order.id} onClick={() => handleStatusChange(order.id, "out_for_delivery")}>
            <Truck size={14} /> Out for Delivery
          </button>
        )}
        {order.status === "out_for_delivery" && (
          <button className="button button-primary button-small" style={{ flex: 1 }} disabled={actionLoading === order.id} onClick={() => handleStatusChange(order.id, "delivered")}>
            <CheckCircle size={14} /> Mark Delivered
          </button>
        )}
        {transitions.includes("cancelled") && (
          <button className="button button-danger button-small" disabled={actionLoading === order.id} onClick={() => openConfirm("cancel", order.id, "cancelled")}>
            Cancel
          </button>
        )}
      </div>
    );
  }

  function renderOrderCard(order) {
    const items = order.items || [];
    const waitTime = getTimeAgo(order.created_at);
    const mins = order.created_at ? Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000) : 0;

    return (
      <div key={order.id || order.order_number} className="cafe-order-card">
        <div className="cafe-order-card-header">
          <div>
            <p className="order-number">{order.order_number}</p>
            <p className="cafe-order-customer">{order.student_display_name || "Customer"}</p>
            <span className="cafe-order-time">{formatDateTime(order.created_at)}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
            <StatusPill status={order.status} />
            {order.status !== "delivered" && order.status !== "cancelled" && order.status !== "rejected" && (
              <span className={`wait-time ${mins > 20 ? "wait-time-urgent" : ""}`}>
                <Clock size={11} /> {waitTime}
              </span>
            )}
          </div>
        </div>

        <div className="cafe-order-items">
          {items.filter((it) => it.status === "included").map((item, idx) => (
            <div key={item.id || idx} className="cafe-order-item-row">
              <span className="item-name">{item.item_name_snapshot || item.item_name || "Item"}</span>
              <span className="item-qty">×{item.quantity}</span>
              <span className="item-price">{formatINR(item.line_total_paise || item.unit_price_paise * item.quantity)}</span>
              {["pending", "accepted", "preparing", "ready"].includes(order.status) && (
                <button className="icon-button" style={{ width: 24, height: 24 }} title="Remove item"
                  disabled={actionLoading === `${order.id}-${item.id}`}
                  onClick={() => openConfirm("removeItem", order.id, null, item.id)}>
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))}
          {items.filter((it) => it.status === "removed").map((item, idx) => (
            <div key={`removed-${idx}`} className="cafe-order-item-row" style={{ opacity: 0.4, textDecoration: "line-through" }}>
              <span className="item-name">{item.item_name_snapshot || "Item"}</span>
              <span className="item-qty">×{item.quantity}</span>
              <span className="item-price">{formatINR(item.line_total_paise)}</span>
            </div>
          ))}
        </div>

        <div className="cafe-order-total">
          <span>Order Total</span>
          <strong>{formatINR(order.total_paise)}</strong>
        </div>

        {/* ETA editor — managers can set/revise estimated ready time */}
        <EtaEditor order={order} onUpdate={refreshOrders} disabled={!!actionLoading} />

        {renderActions(order)}
      </div>
    );
  }

  return (
    <div className="page-stack">
      <PageHeading eyebrow="ORDER QUEUE" title="Orders" description="Incoming orders, status updates, and kitchen fulfillment queue."
        action={
          <div style={{ display: "flex", gap: 8 }}>
            <button className={`button button-small ${viewMode === "list" ? "button-primary" : "button-secondary"}`} onClick={() => setViewMode("list")}>List View</button>
            <button className={`button button-small ${viewMode === "queue" ? "button-primary" : "button-secondary"}`} onClick={() => setViewMode("queue")}>Queue View</button>
          </div>
        }
      />

      {/* Search and filters */}
      <div className="toolbar-row" style={{ gap: 10 }}>
        <div className="search-field" style={{ maxWidth: 320 }}>
          <Search size={16} />
          <input type="text" placeholder="Search by order # or customer..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <button className="button button-secondary button-small" onClick={() => refreshOrders()} disabled={ordersLoading}>
          {ordersLoading ? <span className="spinner" /> : "Refresh"}
        </button>
      </div>

      {viewMode === "list" ? (
        <>
          {/* Tab bar */}
          <div className="tab-bar">
            {ORDER_TABS.map((tab) => {
              const count = tab.key === "all" ? (orders || []).length : (orders || []).filter((o) => o.status === tab.key).length;
              return (
                <button key={tab.key} className={`tab-item ${activeTab === tab.key ? "tab-item-active" : ""}`} onClick={() => setActiveTab(tab.key)}>
                  {tab.label}{count > 0 ? ` (${count})` : ""}
                </button>
              );
            })}
          </div>

          {/* Order list */}
          {ordersLoading && filteredOrders.length === 0 ? (
            <div style={{ display: "grid", gap: 10 }}>{[1, 2, 3].map((i) => <div key={i} className="skeleton-card" />)}</div>
          ) : filteredOrders.length === 0 ? (
            <EmptyState icon={ClipboardList} title="No orders found" description={activeTab === "all" ? "No orders received yet." : `No ${labelStatus(activeTab).toLowerCase()} orders.`} />
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {filteredOrders.map(renderOrderCard)}
            </div>
          )}
        </>
      ) : (
        /* Queue view */
        <div className="order-queue">
          <div className="order-queue-column">
            <div className="queue-column-header">
              <h3>🔔 Incoming</h3>
              {pendingOrders.length > 0 && <span className="nav-count">{pendingOrders.length}</span>}
            </div>
            <div className="queue-column-body">
              {pendingOrders.length === 0 ? (
                <p style={{ color: "var(--muted)", fontSize: 10, textAlign: "center", padding: 20 }}>No pending orders</p>
              ) : pendingOrders.map(renderOrderCard)}
            </div>
          </div>
          <div className="order-queue-column">
            <div className="queue-column-header">
              <h3>🍳 Preparing</h3>
              {preparingOrders.length > 0 && <span className="nav-count">{preparingOrders.length}</span>}
            </div>
            <div className="queue-column-body">
              {preparingOrders.length === 0 ? (
                <p style={{ color: "var(--muted)", fontSize: 10, textAlign: "center", padding: 20 }}>No orders in prep</p>
              ) : preparingOrders.map(renderOrderCard)}
            </div>
          </div>
          <div className="order-queue-column">
            <div className="queue-column-header">
              <h3>✅ Ready</h3>
              {readyOrders.length > 0 && <span className="nav-count">{readyOrders.length}</span>}
            </div>
            <div className="queue-column-body">
              {readyOrders.length === 0 ? (
                <p style={{ color: "var(--muted)", fontSize: 10, textAlign: "center", padding: 20 }}>No ready orders</p>
              ) : readyOrders.map(renderOrderCard)}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <div className="modal-overlay" onClick={() => setConfirmDialog(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>{confirmDialog.action === "reject" ? "Reject Order" : confirmDialog.action === "cancel" ? "Cancel Order" : "Remove Item"}</h2>
            <p>{confirmDialog.action === "reject" ? "Are you sure you want to reject this order?" : confirmDialog.action === "cancel" ? "Are you sure you want to cancel this order?" : "Remove this item from the order?"}</p>
            {(confirmDialog.action === "cancel" || confirmDialog.action === "reject" || confirmDialog.action === "removeItem") && (
              <div className="modal-form">
                <label className="field-label">Reason {confirmDialog.action === "cancel" ? "(required)" : "(optional)"}</label>
                <textarea className="text-area" placeholder="Enter reason..." value={reasonInput} onChange={(e) => setReasonInput(e.target.value)} rows={3} />
              </div>
            )}
            <div className="modal-actions">
              <button className="button button-secondary button-small" onClick={() => setConfirmDialog(null)}>Cancel</button>
              <button className="button button-danger button-small"
                disabled={confirmDialog.action === "cancel" && !reasonInput.trim()}
                onClick={() => {
                  if (confirmDialog.action === "removeItem") {
                    handleRemoveItem(confirmDialog.orderId, confirmDialog.itemId, reasonInput.trim() || null);
                  } else {
                    handleStatusChange(confirmDialog.orderId, confirmDialog.toStatus, reasonInput.trim() || undefined);
                  }
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>
            {toast.type === "success" ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
