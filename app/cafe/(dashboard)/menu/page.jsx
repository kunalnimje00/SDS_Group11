"use client";

import { useState, useEffect } from "react";
import { UtensilsCrossed, Search, Clock, CheckCircle, AlertTriangle, Info } from "lucide-react";
import { PageHeading, FoodPlaceholder, EmptyState } from "@/components/ui";
import { useCafe } from "@/app/cafe/providers";
import { supabase } from "@/lib/supabase";
import { formatINR } from "@/lib/format";

export default function CafeMenuPage() {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [availFilter, setAvailFilter] = useState("all");

  useEffect(() => {
    async function fetchMenu() {
      setLoading(true);
      try {
        // Get all cafes to find our cafe ID, then fetch menu
        const { data: cafes } = await supabase.from("cafes").select("id").limit(1);
        const cafeId = cafes?.[0]?.id;
        if (!cafeId) { setMenuItems([]); setLoading(false); return; }

        const { data, error: rpcErr } = await supabase.rpc("get_cafe_menu", { p_cafe_id: cafeId });
        if (rpcErr) throw new Error(rpcErr.message);
        setMenuItems(data || []);
      } catch (err) {
        setError(err.message);
        // Fallback: try direct table read (RLS allows SELECT)
        try {
          const { data } = await supabase.from("menu_items").select("*");
          setMenuItems(data || []);
        } catch { setMenuItems([]); }
      } finally { setLoading(false); }
    }
    fetchMenu();
  }, []);

  const categories = [...new Set(menuItems.map((item) => item.category).filter(Boolean))];

  const filteredItems = menuItems.filter((item) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!(item.name || "").toLowerCase().includes(q) && !(item.description || "").toLowerCase().includes(q)) return false;
    }
    if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
    if (availFilter === "available" && !item.is_available) return false;
    if (availFilter === "unavailable" && item.is_available) return false;
    return true;
  });

  return (
    <div className="page-stack">
      <PageHeading eyebrow="MENU OPERATIONS" title="Menu Management" description="View menu items and daily availability. Item creation requires administrator access." />

      <div className="inline-info" style={{ marginTop: -8 }}>
        <Info size={14} style={{ flexShrink: 0 }} />
        <span>Menu item creation and editing are administrator-only operations. Staff can manage daily availability from the Inventory page.</span>
      </div>

      {/* Filters */}
      <div className="toolbar-row" style={{ gap: 10, flexWrap: "wrap" }}>
        <div className="search-field" style={{ maxWidth: 320 }}>
          <Search size={16} />
          <input type="text" placeholder="Search menu items..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        {categories.length > 0 && (
          <div style={{ display: "flex", gap: 5 }}>
            <button className={`filter-chip ${categoryFilter === "all" ? "filter-chip-active" : ""}`} onClick={() => setCategoryFilter("all")}>All</button>
            {categories.map((cat) => (
              <button key={cat} className={`filter-chip ${categoryFilter === cat ? "filter-chip-active" : ""}`} onClick={() => setCategoryFilter(cat)}>{cat}</button>
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: 5 }}>
          <button className={`filter-chip ${availFilter === "all" ? "filter-chip-active" : ""}`} onClick={() => setAvailFilter("all")}>All</button>
          <button className={`filter-chip ${availFilter === "available" ? "filter-chip-active" : ""}`} onClick={() => setAvailFilter("available")}>Available</button>
          <button className={`filter-chip ${availFilter === "unavailable" ? "filter-chip-active" : ""}`} onClick={() => setAvailFilter("unavailable")}>Unavailable</button>
        </div>
      </div>

      <div className="result-count">
        <span>{filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""}</span>
      </div>

      {loading ? (
        <div className="cafe-menu-grid">{[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="skeleton-card" />)}</div>
      ) : error && filteredItems.length === 0 ? (
        <EmptyState icon={AlertTriangle} title="Error loading menu" description={error} />
      ) : filteredItems.length === 0 ? (
        <EmptyState icon={UtensilsCrossed} title="No menu items" description={searchQuery ? "No items match your search." : "No menu items configured."} />
      ) : (
        <div className="cafe-menu-grid">
          {filteredItems.map((item, idx) => (
            <div key={item.id} className="cafe-menu-card">
              <div className="cafe-menu-card-header">
                <FoodPlaceholder name={item.name} index={idx} small />
                <div className="cafe-menu-card-info">
                  <h3>{item.name}</h3>
                  <span className="menu-item-price">{formatINR(item.price_paise)}</span>
                </div>
                {item.is_available ? (
                  <span className="stock-badge stock-ok"><CheckCircle size={10} /> Available</span>
                ) : (
                  <span className="stock-badge stock-out">Unavailable</span>
                )}
              </div>
              <div className="cafe-menu-card-body">
                <p>{item.description || "No description"}</p>
                <div className="cafe-menu-card-meta">
                  {item.category && <span className="tag">{item.category}</span>}
                  {item.prep_minutes > 0 && <span className="tag"><Clock size={9} /> {item.prep_minutes} min</span>}
                  {item.remaining_stock !== null && item.remaining_stock !== undefined && (
                    <span className="tag">Stock: {item.remaining_stock}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
