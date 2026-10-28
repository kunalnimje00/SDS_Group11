"use client";

import { useState, useEffect, useCallback } from "react";
import {
  UtensilsCrossed,
  Plus,
  Search,
  Clock,
  CheckCircle,
  AlertTriangle,
  Edit2,
  Trash2,
  X,
  Package,
} from "lucide-react";
import { PageHeading, FoodPlaceholder, EmptyState } from "@/components/ui";
import { useCafe } from "@/app/cafe/providers";
import { supabase } from "@/lib/supabase";
import { formatINR } from "@/lib/format";

const DEFAULT_CATEGORIES = [
  "Breakfast",
  "Meals / Lunch",
  "Snacks",
  "Beverages",
  "Desserts",
  "Fast Food",
  "South Indian",
];

export default function CafeMenuPage() {
  const {
    cafeId,
    cafeName,
    addMenuItem: addContextMenuItem,
    updateMenuItem: updateContextMenuItem,
    deleteMenuItem: deleteContextMenuItem,
    registerCafe,
    menuItems: contextMenuItems,
  } = useCafe();

  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [availFilter, setAvailFilter] = useState("all");

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "Breakfast",
    price: "",
    prepMinutes: "10",
    description: "",
    isAvailable: true,
    dailyQuantity: "",
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);

  function showToast(message, type = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  // Load menu items from Supabase or context fallback
  const fetchMenu = useCallback(async () => {
    setLoading(true);
    try {
      let items = [];
      const currentCafeId = cafeId || "c0ffee00-0000-4000-8000-000000000001";
    if (registerCafe) {
      registerCafe({
        id: currentCafeId,
        name: cafeName || "Demo Cafe",
        is_accepting_orders: true,
        is_active: true,
      });
    }

      // 1. Try get_cafe_menu RPC
      try {
        const { data, error } = await supabase.rpc("get_cafe_menu", {
          p_cafe_id: currentCafeId,
        });
        if (!error && Array.isArray(data) && data.length > 0) {
          items = data;
        }
      } catch (err) {
        console.warn("get_cafe_menu RPC fallback:", err.message);
      }

      // 2. Try direct table SELECT
      if (items.length === 0) {
        try {
          const { data, error } = await supabase
            .from("menu_items")
            .select("*")
            .eq("cafe_id", currentCafeId);
          if (!error && Array.isArray(data) && data.length > 0) {
            items = data;
          }
        } catch (tblErr) {
          console.warn("menu_items select fallback:", tblErr.message);
        }
      }

      // 3. Fallback to context / local items
      if (items.length === 0 && Array.isArray(contextMenuItems) && contextMenuItems.length > 0) {
        items = contextMenuItems.filter(
          (m) => !m.cafe_id || m.cafe_id === currentCafeId
        );
      }

      setMenuItems(items.length > 0 ? items : contextMenuItems || []);
    } catch (err) {
      console.error("Error fetching menu:", err);
      setMenuItems(contextMenuItems || []);
    } finally {
      setLoading(false);
    }
  }, [cafeId, contextMenuItems, cafeName, registerCafe]);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  // Open modal for adding a new dish
  function handleOpenAdd() {
    setEditingItem(null);
    setFormData({
      name: "",
      category: "Breakfast",
      price: "",
      prepMinutes: "10",
      description: "",
      isAvailable: true,
      dailyQuantity: "",
    });
    setIsModalOpen(true);
  }

  // Open modal for editing an existing dish
  function handleOpenEdit(item) {
    setEditingItem(item);
    setFormData({
      name: item.name || "",
      category: item.category || "Breakfast",
      price: item.price_paise ? String(item.price_paise / 100) : "",
      prepMinutes: item.prep_minutes ? String(item.prep_minutes) : "10",
      description: item.description || "",
      isAvailable: item.is_available !== false,
      dailyQuantity:
        item.remaining_stock !== null && item.remaining_stock !== undefined
          ? String(item.remaining_stock)
          : "",
    });
    setIsModalOpen(true);
  }

  // Save dish (Add or Edit)
  async function handleSaveDish(e) {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast("Please enter dish name", "error");
      return;
    }
    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      showToast("Please enter a valid price in ₹", "error");
      return;
    }

    setSaving(true);
    const pricePaise = Math.round(priceNum * 100);
    const prepMinutes = parseInt(formData.prepMinutes, 10) || 10;
    const currentCafeId = cafeId || "c0ffee00-0000-4000-8000-000000000001";
    if (registerCafe) {
      registerCafe({
        id: currentCafeId,
        name: cafeName || "Demo Cafe",
        is_accepting_orders: true,
        is_active: true,
      });
    }

    try {
      if (editingItem) {
        // Edit existing dish
        const updated = {
          ...editingItem,
          name: formData.name.trim(),
          category: formData.category,
          price_paise: pricePaise,
          prep_minutes: prepMinutes,
          description: formData.description.trim(),
          is_available: formData.isAvailable,
        };

        // 1. Update in local/context store
        if (updateContextMenuItem) {
          updateContextMenuItem(updated);
        }

        // 2. Try Supabase RPC or table update
        try {
          await supabase.rpc("cafe_update_menu_item", {
            p_item_id: editingItem.id,
            p_name: updated.name,
            p_description: updated.description,
            p_price_paise: updated.price_paise,
            p_prep_minutes: updated.prep_minutes,
            p_category: updated.category,
            p_is_available: updated.is_available,
          });
        } catch (rpcErr) {
          try {
            await supabase
              .from("menu_items")
              .update({
                name: updated.name,
                description: updated.description,
                price_paise: updated.price_paise,
                prep_minutes: updated.prep_minutes,
                category: updated.category,
                is_available: updated.is_available,
              })
              .eq("id", editingItem.id);
          } catch {
            // Context update is already done
          }
        }

        // 3. Update UI state
        setMenuItems((prev) =>
          prev.map((it) => (it.id === editingItem.id ? updated : it))
        );
        showToast(`Updated "${updated.name}" successfully!`);
      } else {
        // Add new dish
        const newId = window.crypto?.randomUUID?.() || `dish-${Date.now()}`;
        const newDish = {
          id: newId,
          cafe_id: currentCafeId,
          name: formData.name.trim(),
          category: formData.category,
          price_paise: pricePaise,
          prep_minutes: prepMinutes,
          description: formData.description.trim(),
          is_available: formData.isAvailable,
          remaining_stock: formData.dailyQuantity
            ? parseInt(formData.dailyQuantity, 10)
            : null,
        };

        // 1. Try Supabase RPC
        try {
          const { data: createdId } = await supabase.rpc("cafe_add_menu_item", {
            p_name: newDish.name,
            p_description: newDish.description,
            p_price_paise: newDish.price_paise,
            p_prep_minutes: newDish.prep_minutes,
            p_category: newDish.category,
            p_is_available: newDish.is_available,
          });
          if (createdId) newDish.id = createdId;
        } catch (rpcErr) {
          try {
            const { data } = await supabase
              .from("menu_items")
              .insert([
                {
                  cafe_id: currentCafeId,
                  name: newDish.name,
                  description: newDish.description,
                  price_paise: newDish.price_paise,
                  prep_minutes: newDish.prep_minutes,
                  category: newDish.category,
                  is_available: newDish.is_available,
                },
              ])
              .select("id")
              .single();
            if (data?.id) newDish.id = data.id;
          } catch {
            // Local context handles persistence
          }
        }

        // 2. Set daily availability if quantity specified
        if (formData.dailyQuantity) {
          const qty = parseInt(formData.dailyQuantity, 10);
          const today = new Date().toISOString().slice(0, 10);
          try {
            await supabase.rpc("cafe_put_menu_availability", {
              p_service_date: today,
              p_overrides: [
                {
                  menu_item_id: newDish.id,
                  is_available: newDish.is_available,
                  quantity_available: qty,
                },
              ],
            });
          } catch {
            // Ignore
          }
        }

        // 3. Add to context and local state
        if (addContextMenuItem) {
          addContextMenuItem(newDish);
        }
        setMenuItems((prev) => [newDish, ...prev]);
        showToast(`Added "${newDish.name}" to menu!`);
      }

      setIsModalOpen(false);
    } catch (err) {
      showToast(err.message || "Failed to save dish", "error");
    } finally {
      setSaving(false);
    }
  }

  // Quick toggle availability on dish card
  async function handleToggleAvailability(item) {
    const nextAvail = !item.is_available;
    const updated = { ...item, is_available: nextAvail };

    // Update state immediately
    setMenuItems((prev) =>
      prev.map((it) => (it.id === item.id ? updated : it))
    );

    // Update in context
    if (updateContextMenuItem) {
      updateContextMenuItem(updated);
    }

    // Attempt backend update
    try {
      const today = new Date().toISOString().slice(0, 10);
      await supabase.rpc("cafe_put_menu_availability", {
        p_service_date: today,
        p_overrides: [
          {
            menu_item_id: item.id,
            is_available: nextAvail,
            quantity_available: item.remaining_stock ?? null,
          },
        ],
      });
    } catch {
      try {
        await supabase
          .from("menu_items")
          .update({ is_available: nextAvail })
          .eq("id", item.id);
      } catch {
        // Handled in context
      }
    }

    showToast(
      `"${item.name}" marked as ${nextAvail ? "Available" : "Unavailable"}`
    );
  }

  // Delete dish
  async function handleDeleteDish(item) {
    try {
      // 1. Delete from context
      if (deleteContextMenuItem) {
        deleteContextMenuItem(item.id);
      }

      // 2. Delete from Supabase
      try {
        await supabase.rpc("cafe_delete_menu_item", { p_item_id: item.id });
      } catch {
        try {
          await supabase.from("menu_items").delete().eq("id", item.id);
        } catch {
          // Handled
        }
      }

      // 3. Update state
      setMenuItems((prev) => prev.filter((it) => it.id !== item.id));
      showToast(`Deleted "${item.name}" from menu`);
      setDeleteConfirmItem(null);
    } catch (err) {
      showToast(err.message || "Failed to delete dish", "error");
    }
  }

  const allCategories = [
    ...new Set([
      ...DEFAULT_CATEGORIES,
      ...menuItems.map((item) => item.category).filter(Boolean),
    ]),
  ];

  const filteredItems = menuItems.filter((item) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !(item.name || "").toLowerCase().includes(q) &&
        !(item.description || "").toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
    if (availFilter === "available" && !item.is_available) return false;
    if (availFilter === "unavailable" && item.is_available) return false;
    return true;
  });

  return (
    <div className="page-stack">
      <PageHeading
        eyebrow="CAFETERIA MENU"
        title="Menu Management"
        description={`Manage food items, prices, and daily availability for ${cafeName}.`}
        action={
          <button
            className="button button-primary button-small"
            onClick={handleOpenAdd}
          >
            <Plus size={14} /> Add Dish
          </button>
        }
      />

      {/* Filters and search toolbar */}
      <div className="toolbar-row" style={{ gap: 10, flexWrap: "wrap" }}>
        <div className="search-field" style={{ maxWidth: 280 }}>
          <Search size={16} />
          <input
            type="text"
            placeholder="Search dishes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Categories */}
        <div style={{ display: "flex", gap: 5, overflowX: "auto", maxWidth: "100%" }}>
          <button
            className={`filter-chip ${categoryFilter === "all" ? "filter-chip-active" : ""}`}
            onClick={() => setCategoryFilter("all")}
          >
            All Categories
          </button>
          {allCategories.map((cat) => (
            <button
              key={cat}
              className={`filter-chip ${categoryFilter === cat ? "filter-chip-active" : ""}`}
              onClick={() => setCategoryFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Availability Filter */}
        <div style={{ display: "flex", gap: 5, marginLeft: "auto" }}>
          <button
            className={`filter-chip ${availFilter === "all" ? "filter-chip-active" : ""}`}
            onClick={() => setAvailFilter("all")}
          >
            All Status
          </button>
          <button
            className={`filter-chip ${availFilter === "available" ? "filter-chip-active" : ""}`}
            onClick={() => setAvailFilter("available")}
          >
            Available
          </button>
          <button
            className={`filter-chip ${availFilter === "unavailable" ? "filter-chip-active" : ""}`}
            onClick={() => setAvailFilter("unavailable")}
          >
            Unavailable
          </button>
        </div>
      </div>

      <div className="result-count">
        <span>
          {filteredItems.length} dish{filteredItems.length !== 1 ? "es" : ""} found
        </span>
      </div>

      {/* Menu Grid */}
      {loading ? (
        <div className="cafe-menu-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton-card" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title="No dishes found"
          description={
            searchQuery
              ? "No dishes match your search criteria."
              : "No dishes on the menu yet. Click 'Add Dish' to create your first menu item!"
          }
          action={
            <button
              className="button button-primary button-small"
              onClick={handleOpenAdd}
            >
              <Plus size={14} /> Add First Dish
            </button>
          }
        />
      ) : (
        <div className="cafe-menu-grid">
          {filteredItems.map((item, idx) => (
            <div key={item.id ? `${item.id}-${idx}` : `dish-${idx}`} className="cafe-menu-card">
              <div className="cafe-menu-card-header">
                <FoodPlaceholder name={item.name} index={idx} small />
                <div className="cafe-menu-card-info" style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ margin: "0 0 2px" }}>{item.name}</h3>
                  <span className="menu-item-price">{formatINR(item.price_paise)}</span>
                </div>

                {/* Quick Availability Toggle */}
                <div
                  className={`availability-toggle ${item.is_available ? "toggle-active" : ""}`}
                  onClick={() => handleToggleAvailability(item)}
                  title={item.is_available ? "Click to mark Out of Stock" : "Click to mark Available"}
                  style={{ cursor: "pointer", marginLeft: 4 }}
                >
                  <span className="toggle-track" />
                  <span style={{ fontSize: 9 }}>{item.is_available ? "Available" : "Out"}</span>
                </div>
              </div>

              <div className="cafe-menu-card-body">
                <p style={{ margin: "0 0 8px", minHeight: 32 }}>
                  {item.description || "No description provided."}
                </p>

                <div className="cafe-menu-card-meta" style={{ display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center" }}>
                  {item.category && <span className="tag">{item.category}</span>}
                  {item.prep_minutes > 0 && (
                    <span className="tag">
                      <Clock size={10} /> {item.prep_minutes} min
                    </span>
                  )}
                  {item.remaining_stock !== null && item.remaining_stock !== undefined && (
                    <span className="tag">
                      <Package size={10} /> {item.remaining_stock} left
                    </span>
                  )}

                  {/* Actions: Edit & Delete */}
                  <div style={{ marginLeft: "auto", display: "flex", gap: 5 }}>
                    <button
                      className="icon-button"
                      style={{ width: 28, height: 28 }}
                      title="Edit dish"
                      onClick={() => handleOpenEdit(item)}
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      className="icon-button"
                      style={{ width: 28, height: 28, color: "var(--red)" }}
                      title="Delete dish"
                      onClick={() => setDeleteConfirmItem(item)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Dish Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => !saving && setIsModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <h2 style={{ margin: 0 }}>{editingItem ? "Edit Dish" : "Add New Dish"}</h2>
              <button
                className="icon-button"
                style={{ width: 28, height: 28 }}
                onClick={() => setIsModalOpen(false)}
                disabled={saving}
              >
                <X size={16} />
              </button>
            </div>
            <p style={{ margin: "0 0 16px", color: "var(--muted)", fontSize: 11 }}>
              {editingItem
                ? `Update details and pricing for "${editingItem.name}".`
                : "Enter dish details to add it to your cafeteria menu."}
            </p>

            <form onSubmit={handleSaveDish} className="modal-form">
              <div>
                <label className="field-label">Dish Name *</label>
                <input
                  type="text"
                  className="text-input"
                  placeholder="e.g. Masala Dosa, Paneer Wrap..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 10 }}>
                <div>
                  <label className="field-label">Category</label>
                  <select
                    className="select-wrap text-input"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={{ width: "100%", height: 38 }}
                  >
                    {allCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="field-label">Price (₹) *</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    className="text-input"
                    placeholder="e.g. 60"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label className="field-label">Prep Time (minutes)</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    className="text-input"
                    placeholder="10"
                    value={formData.prepMinutes}
                    onChange={(e) => setFormData({ ...formData, prepMinutes: e.target.value })}
                  />
                </div>
                <div>
                  <label className="field-label">Daily Stock (optional)</label>
                  <input
                    type="number"
                    min="1"
                    className="text-input"
                    placeholder="Unlimited"
                    value={formData.dailyQuantity}
                    onChange={(e) => setFormData({ ...formData, dailyQuantity: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="field-label">Description</label>
                <textarea
                  className="text-area"
                  rows={2}
                  placeholder="Ingredients, accompaniments, or details..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0" }}>
                <span className="field-label" style={{ margin: 0 }}>Currently Available</span>
                <div
                  className={`availability-toggle ${formData.isAvailable ? "toggle-active" : ""}`}
                  onClick={() => setFormData({ ...formData, isAvailable: !formData.isAvailable })}
                  style={{ cursor: "pointer" }}
                >
                  <span className="toggle-track" />
                  <span>{formData.isAvailable ? "Available" : "Unavailable"}</span>
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: 14 }}>
                <button
                  type="button"
                  className="button button-secondary button-small"
                  onClick={() => setIsModalOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="button button-primary button-small"
                  disabled={saving}
                >
                  {saving ? "Saving..." : editingItem ? "Update Dish" : "Add Dish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmItem && (
        <div className="modal-overlay" onClick={() => setDeleteConfirmItem(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>Delete Dish</h2>
            <p>
              Are you sure you want to remove <strong>&ldquo;{deleteConfirmItem.name}&rdquo;</strong> from your menu?
            </p>
            <div className="modal-actions">
              <button
                className="button button-secondary button-small"
                onClick={() => setDeleteConfirmItem(null)}
              >
                Cancel
              </button>
              <button
                className="button button-danger button-small"
                onClick={() => handleDeleteDish(deleteConfirmItem)}
              >
                Delete Dish
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
