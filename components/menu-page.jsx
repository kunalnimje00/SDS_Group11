"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Clock3, Plus, Search, Settings, UtensilsCrossed, X } from "lucide-react";
import { useKantin } from "@/app/kantin-context";
import { MenuItemCard } from "./menu-item-card";
import { DemoNotice, EmptyState, PageHeading } from "./ui";

export function CafeMenuPage() {
  const params = useParams();
  const { cafes, menuItems, updateMenuItem, addMenuItem } = useKantin();
  const cafeId = String(params.cafeId || "");
  const cafe = cafes.find((c) => c.id === cafeId);

  const [query, setQuery] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);

  // Form for adding/editing items
  const [editingItem, setEditingItem] = useState(null);
  const [newItemName, setNewItemName] = useState("");
  const [newItemDesc, setNewItemDesc] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemPrep, setNewItemPrep] = useState("10");

  if (!cafe) {
    return (
      <div className="page-stack">
        <EmptyState
          icon={UtensilsCrossed}
          title="Cafe not found"
          description="The selected cafe could not be found."
          action={<Link href="/cafes" className="button button-secondary">Browse canteens</Link>}
        />
      </div>
    );
  }

  const allItems = menuItems.filter((item) => item.cafe_id === cafe.id);
  const normalized = query.trim().toLowerCase();
  const filteredItems = allItems.filter(
    (item) =>
      (!availableOnly || item.is_available) &&
      `${item.name} ${item.description || ""}`.toLowerCase().includes(normalized)
  );

  function handleSaveNewItem(e) {
    e.preventDefault();
    if (!newItemName.trim() || !newItemPrice) return;

    if (editingItem) {
      updateMenuItem({
        ...editingItem,
        name: newItemName.trim(),
        description: newItemDesc.trim(),
        price_paise: Math.round(Number(newItemPrice) * 100),
        prep_minutes: Number(newItemPrep) || 10,
      });
      setEditingItem(null);
    } else {
      addMenuItem({
        cafe_id: cafe.id,
        name: newItemName.trim(),
        description: newItemDesc.trim(),
        price_paise: Math.round(Number(newItemPrice) * 100),
        prep_minutes: Number(newItemPrep) || 10,
        is_available: true,
      });
    }

    setNewItemName("");
    setNewItemDesc("");
    setNewItemPrice("");
    setNewItemPrep("10");
  }

  function startEditItem(item) {
    setEditingItem(item);
    setNewItemName(item.name);
    setNewItemDesc(item.description || "");
    setNewItemPrice(String((item.price_paise || 0) / 100));
    setNewItemPrep(String(item.prep_minutes || 10));
  }

  return (
    <div className="page-stack">
      <Link href="/cafes" className="back-link"><ArrowLeft size={15} /> All canteens</Link>
      <PageHeading
        eyebrow="CAMPUS MENU"
        title={cafe.name}
        description="Freshly prepared meals and cafeteria favorites."
        action={
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <span className="status-dot-label">
              <span className="status-dot" />
              {cafe.is_accepting_orders ? "Accepting orders" : "Not accepting orders"}
            </span>
            <button
              type="button"
              className="button button-secondary button-small"
              onClick={() => setShowManageModal(true)}
              style={{ display: "inline-flex", gap: "6px" }}
            >
              <Settings size={14} /> Cafe Menu Manager
            </button>
          </div>
        }
      />

      <section className="cafe-hours-panel" aria-label="Sample cafe hours">
        <div className="hours-panel-icon"><Clock3 size={19} /></div>
        <div className="hours-panel-copy">
          <strong>Operating hours</strong>
          <span>Weekly schedule</span>
        </div>
        <div className="hours-list">
          {cafe.hours.map((hour) => (
            <span key={hour}>{hour}</span>
          ))}
        </div>
      </section>

      <div className="menu-tools">
        <label className="search-field">
          <Search size={18} aria-hidden="true" />
          <span className="sr-only">Search menu items</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search the menu"
          />
        </label>
        <button
          type="button"
          className={`filter-chip ${availableOnly ? "filter-chip-active" : ""}`}
          aria-pressed={availableOnly}
          onClick={() => setAvailableOnly((value) => !value)}
        >
          {availableOnly ? "Available items" : "All items"}
        </button>
      </div>

      <div className="result-count">
        <span>{filteredItems.length} {filteredItems.length === 1 ? "item" : "items"}</span>
        <span>Prep times are dynamic estimates</span>
      </div>

      {filteredItems.length ? (
        <div className="menu-grid">
          {filteredItems.map((item, index) => (
            <MenuItemCard key={item.id} item={item} index={index} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Search}
          title="No menu items match"
          description="Try another search term or turn off the availability filter."
          action={
            <button
              type="button"
              className="button button-secondary"
              onClick={() => {
                setQuery("");
                setAvailableOnly(false);
              }}
            >
              Reset filters
            </button>
          }
        />
      )}

      {/* Cafe Menu Management Modal */}
      {showManageModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(6px)",
          }}
        >
          <div
            style={{
              width: "min(100%, 640px)",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#111d16",
              border: "1px solid rgba(145, 212, 168, 0.25)",
              borderRadius: "16px",
              padding: "24px",
              color: "#f3f6f2",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ margin: 0, fontSize: "18px" }}>
                {editingItem ? "Edit Menu Item" : "Manage Cafe Menu & Items"}
              </h2>
              <button
                type="button"
                className="icon-button"
                onClick={() => {
                  setShowManageModal(false);
                  setEditingItem(null);
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveNewItem} style={{ display: "grid", gap: "10px", marginBottom: "24px" }}>
              <div>
                <label className="field-label">Item name</label>
                <input
                  className="text-input"
                  placeholder="e.g. Cold Coffee, Chole Bhature"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="field-label">Description</label>
                <input
                  className="text-input"
                  placeholder="Short description or ingredients"
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label className="field-label">Price (INR ₹)</label>
                  <input
                    className="text-input"
                    type="number"
                    step="0.5"
                    min="1"
                    placeholder="e.g. 50"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="field-label">Prep time (minutes)</label>
                  <input
                    className="text-input"
                    type="number"
                    min="1"
                    placeholder="e.g. 8"
                    value={newItemPrep}
                    onChange={(e) => setNewItemPrep(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
                <button type="submit" className="button button-primary" style={{ flex: 1 }}>
                  {editingItem ? "Save Changes" : <><Plus size={15} /> Add to Menu</>}
                </button>
                {editingItem && (
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => {
                      setEditingItem(null);
                      setNewItemName("");
                      setNewItemDesc("");
                      setNewItemPrice("");
                      setNewItemPrep("10");
                    }}
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>

            <h3 style={{ fontSize: "14px", borderTop: "1px solid var(--border)", paddingTop: "14px" }}>
              Current Items in {cafe.name} ({allItems.length})
            </h3>
            <div style={{ display: "grid", gap: "8px", marginTop: "10px" }}>
              {allItems.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                  }}
                >
                  <div>
                    <strong>{item.name}</strong> — ₹{(item.price_paise / 100).toFixed(0)} ({item.prep_minutes}m)
                    <div style={{ fontSize: "11px", color: "var(--muted)" }}>{item.description}</div>
                  </div>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <button
                      type="button"
                      className="button button-secondary button-small"
                      onClick={() =>
                        updateMenuItem({
                          ...item,
                          is_available: !item.is_available,
                        })
                      }
                    >
                      {item.is_available ? "In Stock" : "Sold Out"}
                    </button>
                    <button
                      type="button"
                      className="button button-secondary button-small"
                      onClick={() => startEditItem(item)}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
