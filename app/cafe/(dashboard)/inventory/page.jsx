"use client";

import { useState, useEffect, useCallback } from "react";
import { Package, CheckCircle, AlertTriangle, Calendar, Save } from "lucide-react";
import { PageHeading, FoodPlaceholder, EmptyState } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { formatINR } from "@/lib/format";

export default function CafeInventoryPage() {
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [overrides, setOverrides] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchAvailability = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data, error: err } = await supabase.rpc("cafe_get_menu_availability", { p_date: selectedDate });
      if (err) throw new Error(err.message);
      setAvailability(data || []);
      // Initialize overrides from current data
      const ov = {};
      (data || []).forEach((item) => {
        ov[item.menu_item_id] = {
          is_available: item.is_available !== false,
          quantity_available: item.quantity_available ?? "",
        };
      });
      setOverrides(ov);
    } catch (err) { setError(err.message); setAvailability([]); }
    finally { setLoading(false); }
  }, [selectedDate]);

  useEffect(() => { fetchAvailability(); }, [fetchAvailability]);

  function showToast(msg, type = "success") {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  function toggleAvailability(menuItemId) {
    setOverrides((prev) => ({
      ...prev,
      [menuItemId]: { ...prev[menuItemId], is_available: !prev[menuItemId]?.is_available },
    }));
  }

  function setQuantity(menuItemId, value) {
    const num = value === "" ? "" : parseInt(value, 10);
    setOverrides((prev) => ({
      ...prev,
      [menuItemId]: { ...prev[menuItemId], quantity_available: isNaN(num) ? "" : num },
    }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const overrideList = Object.entries(overrides).map(([menuItemId, ov]) => ({
        menu_item_id: menuItemId,
        is_available: ov.is_available,
        quantity_available: ov.quantity_available === "" || ov.quantity_available === null ? null : Number(ov.quantity_available),
      }));

      const { error: err } = await supabase.rpc("cafe_put_menu_availability", {
        p_service_date: selectedDate,
        p_overrides: overrideList,
      });
      if (err) throw new Error(err.message);
      showToast("Availability updated successfully");
      await fetchAvailability();
    } catch (err) { showToast(err.message || "Failed to save availability", "error"); }
    finally { setSaving(false); }
  }

  return (
    <div className="page-stack">
      <PageHeading eyebrow="STOCK CONTROL" title="Inventory & Daily Availability" description="Manage per-item availability and stock quantities for each service day."
        action={
          <button className="button button-primary button-small" onClick={handleSave} disabled={saving}>
            <Save size={14} /> {saving ? "Saving..." : "Save Changes"}
          </button>
        }
      />

      {/* Date selector */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Calendar size={16} style={{ color: "var(--mint)" }} />
        <label className="field-label" style={{ margin: 0 }}>Service date:</label>
        <input type="date" className="date-select" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
      </div>

      {loading ? (
        <div style={{ display: "grid", gap: 8 }}>{[1, 2, 3, 4, 5].map((i) => <div key={i} className="skeleton-row" />)}</div>
      ) : error ? (
        <EmptyState icon={AlertTriangle} title="Error loading availability" description={error} />
      ) : availability.length === 0 ? (
        <EmptyState icon={Package} title="No items found" description="No menu items with availability data for this date." />
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="inventory-table">
            <thead>
              <tr>
                <th>ITEM</th>
                <th>PRICE</th>
                <th>AVAILABLE</th>
                <th>DAILY QTY</th>
                <th>REMAINING</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {availability.map((item, idx) => {
                const ov = overrides[item.menu_item_id] || {};
                const isAvail = ov.is_available !== undefined ? ov.is_available : item.is_available !== false;
                const remaining = item.remaining_stock;
                let stockStatus = "stock-unlimited";
                let stockLabel = "Unlimited";
                if (remaining !== null && remaining !== undefined) {
                  if (remaining <= 0) { stockStatus = "stock-out"; stockLabel = "Out of stock"; }
                  else if (remaining <= 5) { stockStatus = "stock-low"; stockLabel = `${remaining} left`; }
                  else { stockStatus = "stock-ok"; stockLabel = `${remaining} left`; }
                }
                if (!isAvail) { stockStatus = "stock-out"; stockLabel = "Unavailable"; }

                return (
                  <tr key={item.menu_item_id}>
                    <td>
                      <div className="item-cell">
                        <FoodPlaceholder name={item.item_name || "Item"} index={idx} small />
                        <strong style={{ fontSize: 11 }}>{item.item_name || item.menu_item_id}</strong>
                      </div>
                    </td>
                    <td>{formatINR(item.price_paise || 0)}</td>
                    <td>
                      <label className={`availability-toggle ${isAvail ? "toggle-active" : ""}`} onClick={() => toggleAvailability(item.menu_item_id)}>
                        <span className="toggle-track" />
                        <span>{isAvail ? "Yes" : "No"}</span>
                      </label>
                    </td>
                    <td>
                      <input type="number" className="stock-input" min="0" placeholder="∞" value={ov.quantity_available ?? ""} onChange={(e) => setQuantity(item.menu_item_id, e.target.value)} />
                    </td>
                    <td>{remaining !== null && remaining !== undefined ? remaining : "—"}</td>
                    <td><span className={`stock-badge ${stockStatus}`}>{stockLabel}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

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
